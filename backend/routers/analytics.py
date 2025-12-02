import logging
import psutil
import time
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from backend.utils.auth import get_verified_user, get_admin_user
from backend.env import SRC_LOG_LEVELS
from backend.models.home_assistant_controllers import StatesCtrl, StatesMetaCtrl
from backend.internal.db import get_db
from sqlalchemy import func, and_
from datetime import datetime, timedelta
import json

log = logging.getLogger(__name__)
log.setLevel(SRC_LOG_LEVELS["MAIN"])

router = APIRouter()

class UserMetrics(BaseModel):
    active_users: int = 0
    sessions: int = 0
    new_users_today: int = 0

class ApiRequestMetrics(BaseModel):
    requests_per_second: float = 0.0
    total_requests: int = 0
    error_rate: float = 0.0
    avg_response_time: float = 0.0

class SystemMetrics(BaseModel):
    cpu: float = 0.0
    memory: float = 0.0
    network: float = 0.0
    disk: float = 0.0
    containers: int = 0
    uptime: str = "0 days"

class EntityStateMetrics(BaseModel):
    total_entities: int = 0
    active_entities: int = 0
    domains: Dict[str, int] = {}
    recent_state_changes: int = 0

def get_system_metrics_from_psutil():
    """Get real-time system metrics using psutil"""
    try:
        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # Memory usage
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        
        # Disk usage
        disk = psutil.disk_usage('/')
        disk_percent = (disk.used / disk.total) * 100 if disk.total > 0 else 0
        
        # Network I/O
        net_io = psutil.net_io_counters()
        network_bytes = net_io.bytes_sent + net_io.bytes_recv
        
        # System uptime
        boot_time = psutil.boot_time()
        uptime_seconds = time.time() - boot_time
        uptime_days = int(uptime_seconds // (24 * 3600))
        uptime_str = f"{uptime_days} days"
        
        return SystemMetrics(
            cpu=cpu_percent,
            memory=memory_percent,
            network=network_bytes / (1024 * 1024),  # Convert to MB
            disk=disk_percent,
            containers=0,  # This would need to be implemented separately
            uptime=uptime_str
        )
    except Exception as e:
        log.error(f"Error getting system metrics from psutil: {e}")
        return SystemMetrics()

def get_entity_metrics():
    """Get real-time entity metrics from Home Assistant State table"""
    try:
        # Get all entity IDs
        entity_ids = StatesMetaCtrl.get_all_entity_ids()
        total_entities = len(entity_ids)
        
        # Count entities by domain
        domains = {}
        active_entities = 0
        
        # Get recent state changes (last 24 hours)
        recent_changes = 0
        
        with get_db() as db:
            # Count entities by domain
            for entity_id in entity_ids:
                domain = entity_id.split('.')[0] if '.' in entity_id else 'unknown'
                domains[domain] = domains.get(domain, 0) + 1
                
                # Check if entity has recent state changes
                latest_state = StatesCtrl.get_latest_state_by_entity_id(entity_id)
                if latest_state:
                    active_entities += 1
                    
                    # Check if state was updated in last 24 hours
                    if latest_state.last_updated and \
                       latest_state.last_updated > datetime.now() - timedelta(days=1):
                        recent_changes += 1
        
        return EntityStateMetrics(
            total_entities=total_entities,
            active_entities=active_entities,
            domains=domains,
            recent_state_changes=recent_changes
        )
    except Exception as e:
        log.error(f"Error getting entity metrics: {e}")
        return EntityStateMetrics()

@router.get("/system", response_model=SystemMetrics)
async def get_system_metrics(user=Depends(get_verified_user)):
    """Get system metrics using psutil for real-time data"""
    return get_system_metrics_from_psutil()

@router.get("/users", response_model=UserMetrics)
async def get_user_metrics(user=Depends(get_verified_user)):
    """Get user metrics - using entity data where possible"""
    entity_metrics = get_entity_metrics()
    
    # Try to find user-related entities
    active_users = 0
    new_users_today = 0
    
    try:
        with get_db() as db:
            # Look for user presence entities
            user_entities = []
            entity_ids = StatesMetaCtrl.get_all_entity_ids()
            
            for entity_id in entity_ids:
                if 'person' in entity_id or 'device' in entity_id or 'user' in entity_id:
                    state = StatesCtrl.get_latest_state_by_entity_id(entity_id)
                    if state and state.state and state.state.lower() in ['home', 'on', 'active']:
                        active_users += 1
            
            # Look for new entities created today
            today = datetime.now().date()
            # This would require checking entity creation timestamps if available
    except Exception as e:
        log.error(f"Error calculating user metrics: {e}")
    
    return UserMetrics(
        active_users=active_users,
        sessions=entity_metrics.recent_state_changes,  # Use state changes as proxy for activity
        new_users_today=new_users_today
    )

@router.get("/api-requests", response_model=ApiRequestMetrics)
async def get_api_request_metrics(user=Depends(get_verified_user)):
    """Get API request metrics - using entity data where possible"""
    entity_metrics = get_entity_metrics()
    
    # Use entity metrics as a proxy for API activity
    return ApiRequestMetrics(
        requests_per_second=entity_metrics.recent_state_changes / 86400.0,  # Average over 24 hours
        total_requests=entity_metrics.total_entities * 10,  # Estimate based on entities
        error_rate=0.0,  # Would need actual error tracking
        avg_response_time=0.1  # Estimated average response time
    )

@router.get("/entities", response_model=EntityStateMetrics)
async def get_entity_state_metrics(user=Depends(get_verified_user)):
    """Get detailed entity state metrics"""
    return get_entity_metrics()

@router.get("/custom", response_model=List[Dict[str, Any]])
async def get_custom_metrics(user=Depends(get_verified_user)):
    """Get custom metrics from Home Assistant entities"""
    try:
        custom_metrics = []
        entity_metrics = get_entity_metrics()
        
        # Add entity metrics as custom metrics
        custom_metrics.append({
            "metric_name": "total_entities",
            "value": entity_metrics.total_entities,
            "unit": "entities",
            "timestamp": int(datetime.now().timestamp())
        })
        
        custom_metrics.append({
            "metric_name": "active_entities",
            "value": entity_metrics.active_entities,
            "unit": "entities",
            "timestamp": int(datetime.now().timestamp())
        })
        
        custom_metrics.append({
            "metric_name": "recent_state_changes",
            "value": entity_metrics.recent_state_changes,
            "unit": "changes",
            "timestamp": int(datetime.now().timestamp())
        })
        
        # Add domain breakdown
        for domain, count in entity_metrics.domains.items():
            custom_metrics.append({
                "metric_name": f"{domain}_entities",
                "value": count,
                "unit": "entities",
                "timestamp": int(datetime.now().timestamp())
            })
        
        return custom_metrics
    except Exception as e:
        log.error(f"Error getting custom metrics: {e}")
        return []