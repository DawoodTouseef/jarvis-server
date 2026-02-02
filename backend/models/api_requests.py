from sqlalchemy import Column, String, Integer, BigInteger, Text, DateTime, JSON
from sqlalchemy.sql import func
from backend.internal.db import Base
import uuid

class ApiRequestLog(Base):
    __tablename__ = "api_request_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    request_id = Column(String(36), index=True, default=lambda: str(uuid.uuid4()))
    method = Column(String(10), index=True)
    endpoint = Column(String(255), index=True)
    payload = Column(JSON, nullable=True)
    response_status = Column(Integer, index=True)
    response_body = Column(JSON, nullable=True)
    latency_ms = Column(BigInteger)
    user_id = Column(String(36), index=True, nullable=True)
    user_role = Column(String(50), nullable=True)
    source = Column(String(50), index=True) # e.g., 'frontend', 'backend', 'agent'
    environment = Column(String(20), index=True) # e.g., 'local', 'staging', 'production'
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    def __repr__(self):
        return f"<ApiRequestLog(request_id={self.request_id}, method={self.method}, endpoint={self.endpoint}, status={self.response_status})>"
