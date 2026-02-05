"""
Authorization Middleware
Automatically checks permissions for all API requests
Cache bust: 2026-02-05-v2
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
        
        logger.debug(f"Authorization header: {auth_header}")
        
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            logger.warning(f"Token extracted (first 30 chars): {token[:30]}")
            try:
                token_data = verify_token(token)
                logger.warning(f"Token verified successfully: user_id={token_data.user_id}, email={token_data.email}, role={token_data.role}")
                user = {
                    "id": token_data.user_id,
                    "email": token_data.email,
                    "role": token_data.role
                }
            except HTTPException as e:
                # Invalid token - return 401 response
                logger.warning(f"Token verification failed (HTTPException): status={e.status_code}, detail={e.detail}")
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Invalid authentication token"}
                )
            except JWTError as e:
                # Invalid token - return 401 response
                logger.warning(f"Token verification failed (JWTError): {type(e).__name__}: {str(e)}")
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Invalid authentication token"}
                )
            except Exception as e:
                # Catch any other exception
                logger.error(f"Unexpected error during token verification: {type(e).__name__}: {str(e)}")
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Invalid authentication token"}
                )
        
        logger.debug(f"User object before permission check: {user}")
        
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

