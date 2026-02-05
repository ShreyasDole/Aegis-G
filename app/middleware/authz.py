"""
Authorization Middleware
Automatically checks permissions for all API requests
"""
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.authz import authz
from app.auth.jwt import verify_token
from jose import JWTError
import logging

logger = logging.getLogger(__name__)


class AuthorizationMiddleware(BaseHTTPMiddleware):
    """
    Middleware that automatically checks authorization for all requests
    """
    
    async def dispatch(self, request: Request, call_next):
        # Get path and method
        path = request.url.path
        method = request.method
        
        # Skip authorization for public endpoints
        if authz.is_public_endpoint(path):
            return await call_next(request)
        
        # Extract user from token
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
            except (JWTError, HTTPException):
                # Invalid token - return 401 response
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Invalid authentication token"}
                )
        
        # Check permission
        try:
            authz.check_permission(user, method, path, raise_exception=True)
        except HTTPException as e:
            # Log authorization failure
            logger.warning(
                f"Authorization denied: {method} {path} - User: {user.get('email') if user else 'anonymous'} - Role: {user.get('role') if user else 'none'}"
            )
            # Return error response instead of raising
            return JSONResponse(
                status_code=e.status_code,
                content={"detail": e.detail}
            )
        
        # Continue to endpoint
        response = await call_next(request)
        return response

