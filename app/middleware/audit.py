"""
Audit Logging Middleware
Automatically logs all API requests
"""
import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.services.audit import audit
from app.models.database import SessionLocal
from app.auth.jwt import verify_token
from jose import JWTError
import logging

logger = logging.getLogger(__name__)


class AuditMiddleware(BaseHTTPMiddleware):
    """
    Middleware that automatically logs all API requests to audit log
    """
    
    async def dispatch(self, request: Request, call_next):
        # Start timer
        start_time = time.time()
        
        # Read and store request body (for logging)
        if request.method in ["POST", "PUT", "PATCH"]:
            body = await request.body()
            request.state.body = body.decode("utf-8") if body else None
            
            # Re-create request with body (FastAPI consumes it)
            async def receive():
                return {"type": "http.request", "body": body}
            request._receive = receive
        
        # Extract user from token (if exists)
        user = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                token_data = verify_token(token)
                user = {
                    "id": token_data.user_id,
                    "email": token_data.email,
                    "role": token_data.role
                }
            except (JWTError, Exception):
                pass
        
        # Process request
        response = await call_next(request)
        
        # Calculate response time
        response_time_ms = int((time.time() - start_time) * 1000)
        
        # Log to audit (async, don't block response)
        try:
            db = SessionLocal()
            await audit.log_request(
                request=request,
                response=response,
                response_time_ms=response_time_ms,
                db=db,
                user=user
            )
            db.close()
        except Exception as e:
            logger.error(f"Audit logging failed: {e}")
        
        return response

