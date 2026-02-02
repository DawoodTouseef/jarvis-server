from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from backend.models.api_requests import ApiRequestLog
from backend.internal.db import get_session
from backend.utils.auth import get_admin_user
from pydantic import BaseModel

router = APIRouter(prefix="/observability", tags=["observability"])

class LogResponse(BaseModel):
    id: int
    request_id: str
    method: str
    endpoint: str
    payload: Optional[dict] = None
    response_status: int
    latency_ms: int
    user_id: Optional[str] = None
    user_role: Optional[str] = None
    source: str
    environment: str
    timestamp: datetime

    class Config:
        from_attributes = True

class StatsResponse(BaseModel):
    total_requests_5m: int
    total_requests_1h: int
    total_requests_24h: int
    success_rate: float
    avg_latency: float
    p95_latency: float
    error_count: int
    active_users: int
    health_status: str # 'healthy', 'degraded', 'critical'

@router.get("/logs", response_model=List[LogResponse])
async def get_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    method: Optional[str] = None,
    status: Optional[int] = None,
    endpoint: Optional[str] = None,
    user_id: Optional[str] = None,
    db: Session = Depends(get_session),
    admin_user: Session = Depends(get_admin_user)
):
    query = db.query(ApiRequestLog)
    
    if method:
        query = query.filter(ApiRequestLog.method == method.upper())
    if status:
        query = query.filter(ApiRequestLog.response_status == status)
    if endpoint:
        query = query.filter(ApiRequestLog.endpoint.contains(endpoint))
    if user_id:
        query = query.filter(ApiRequestLog.user_id == user_id)
        
    return query.order_by(ApiRequestLog.timestamp.desc()).offset(skip).limit(limit).all()

@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    db: Session = Depends(get_session),
    admin_user: Session = Depends(get_admin_user)
):
    from datetime import datetime, timedelta
    from sqlalchemy import func
    
    now = datetime.now()
    five_min_ago = now - timedelta(minutes=5)
    one_hour_ago = now - timedelta(hours=1)
    twenty_four_hours_ago = now - timedelta(hours=24)
    
    # Counts
    total_5m = db.query(ApiRequestLog).filter(ApiRequestLog.timestamp >= five_min_ago).count()
    total_1h = db.query(ApiRequestLog).filter(ApiRequestLog.timestamp >= one_hour_ago).count()
    total_24h = db.query(ApiRequestLog).filter(ApiRequestLog.timestamp >= twenty_four_hours_ago).count()
    
    if total_24h == 0:
        return StatsResponse(
            total_requests_5m=0, total_requests_1h=0, total_requests_24h=0,
            success_rate=100.0, avg_latency=0.0, p95_latency=0.0,
            error_count=0, active_users=0, health_status="healthy"
        )
        
    errors_24h = db.query(ApiRequestLog).filter(
        ApiRequestLog.response_status >= 400,
        ApiRequestLog.timestamp >= twenty_four_hours_ago
    ).count()
    
    avg_latency = db.query(func.avg(ApiRequestLog.latency_ms)).filter(
        ApiRequestLog.timestamp >= twenty_four_hours_ago
    ).scalar() or 0
    
    # P95 Latency - Fetch recent latencies to calculate in Python for simplicity/SQLite compatibility
    recent_latencies = db.query(ApiRequestLog.latency_ms).filter(
        ApiRequestLog.timestamp >= one_hour_ago
    ).order_by(ApiRequestLog.latency_ms.asc()).all()
    
    p95_latency = 0.0
    if recent_latencies:
        idx = int(len(recent_latencies) * 0.95)
        p95_latency = float(recent_latencies[idx][0])
        
    # Active Users
    active_users = db.query(func.count(func.distinct(ApiRequestLog.user_id))).filter(
        ApiRequestLog.timestamp >= one_hour_ago
    ).scalar() or 0
    
    # Health Status Logic
    success_rate = ((total_24h - errors_24h) / total_24h) * 100
    health_status = "healthy"
    if success_rate < 90 or p95_latency > 2000:
        health_status = "critical"
    elif success_rate < 98 or p95_latency > 500:
        health_status = "degraded"
        
    return StatsResponse(
        total_requests_5m=total_5m,
        total_requests_1h=total_1h,
        total_requests_24h=total_24h,
        success_rate=success_rate,
        avg_latency=float(avg_latency),
        p95_latency=p95_latency,
        error_count=errors_24h,
        active_users=active_users,
        health_status=health_status
    )
