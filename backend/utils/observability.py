import json
import re
import time
import uuid
from typing import Any, Dict, Optional

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from backend.models.api_requests import ApiRequestLog
from backend.internal.db import SessionLocal
from backend.env import ENV
from backend.utils.auth import get_current_user, get_http_authorization_cred
import logging

log = logging.getLogger(__name__)

SENSITIVE_FIELDS = {
    "password", "token", "access_token", "refresh_token", 
    "api_key", "secret", "authorization", "cookie"
}

def sanitize_payload(data: Any) -> Any:
    """Mask sensitive fields in the payload."""
    if isinstance(data, dict):
        sanitized = {}
        for k, v in data.items():
            if k.lower() in SENSITIVE_FIELDS:
                sanitized[k] = "********"
            else:
                sanitized[k] = sanitize_payload(v)
        return sanitized
    elif isinstance(data, list):
        return [sanitize_payload(item) for item in data]
    return data

class ObservabilityMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        start_time = time.perf_counter()
        
        # We need to capture the request body before it's consumed
        # NOTE: This can be tricky with large bodies, so we limit it
        payload = None
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.body()
                if body:
                    try:
                        payload = json.loads(body)
                        payload = sanitize_payload(payload)
                    except json.JSONDecodeError:
                        payload = {"raw": body.decode("utf-8", errors="replace")[:1000]}
            except Exception as e:
                log.debug(f"Failed to capture request body: {e}")

        response = await call_next(request)
        
        process_time = int((time.perf_counter() - start_time) * 1000)
        
        # Add Request ID to response headers
        response.headers["X-Request-ID"] = request_id
        
        # Log to database asynchronously (background task would be better but keeping it simple for now)
        # In a real production app, we'd use a queue or background task
        try:
            self._log_request(request, response, payload, process_time, request_id)
        except Exception as e:
            log.error(f"Failed to log API request: {e}")
            
        return response

    def _log_request(self, request: Request, response: Response, payload: Any, latency_ms: int, request_id: str):
        db = SessionLocal()
        try:
            # Try to get user from state if auth middleware already ran
            # Or try to decode from header manually if needed
            user_id = getattr(request.state, "user_id", None)
            user_role = getattr(request.state, "user_role", None)
            
            if not user_id:
                auth_header = request.headers.get("Authorization")
                if auth_header:
                    try:
                        # This is a bit expensive to do every request if not cached
                        # In Jarvis, auth usually happens in dependencies
                        pass 
                    except:
                        pass

            log_entry = ApiRequestLog(
                request_id=request_id,
                method=request.method,
                endpoint=str(request.url.path),
                payload=payload,
                response_status=response.status_code,
                latency_ms=latency_ms,
                user_id=str(user_id) if user_id else None,
                user_role=user_role,
                source="frontend" if "Mozilla" in request.headers.get("user-agent", "") else "backend",
                environment=ENV,
            )
            db.add(log_entry)
            db.commit()
        except Exception as e:
            log.error(f"Database logging error: {e}")
        finally:
            db.close()
