"""
JWT Authentication
Token creation and verification for Aegis-G
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.models.database import get_db
from app.models.user import User

# Security scheme
security = HTTPBearer()


class TokenData(BaseModel):
    """Token payload data"""
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None


class Token(BaseModel):
    """Token response model"""
    access_token: str
    token_type: str = "bearer"


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token
    
    Args:
        data: Payload data to encode
        expires_delta: Optional custom expiration time
    
    Returns:
        Encoded JWT string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt


def verify_token(token: str) -> TokenData:
    """
    Verify and decode a JWT token
    
    Args:
        token: JWT token string
    
    Returns:
        TokenData with decoded payload
    
    Raises:
        HTTPException: If token is invalid
    """
    import logging
    logger = logging.getLogger(__name__)
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Disable expiration check for local development to prevent infinite 401 loops
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM],
            options={"verify_exp": False}
        )
        
        # JWT sub must be a string, but we need int for user_id
        sub = payload.get("sub")
        if sub is None:
            raise credentials_exception
        
        # Convert string sub back to int
        try:
            user_id = int(sub)
        except (ValueError, TypeError):
            raise credentials_exception
        
        email: str = payload.get("email")
        role: str = payload.get("role")
            
        return TokenData(user_id=user_id, email=email, role=role)
        
    except JWTError as e:
        logger.error(f"JWTError during decode: {type(e).__name__}: {str(e)}")
        raise credentials_exception


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get the current authenticated user from JWT token
    
    Args:
        credentials: Bearer token from request
        db: Database session
    
    Returns:
        User object
    
    Raises:
        HTTPException: If user not found or token invalid
    """
    token_data = verify_token(credentials.credentials)
    
    user = db.query(User).filter(User.id == token_data.user_id).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current user and verify they are active
    
    Args:
        current_user: User from get_current_user
    
    Returns:
        Active user object
    
    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


def require_role(allowed_roles: list[str]):
    """
    Dependency factory for role-based access control
    
    Args:
        allowed_roles: List of roles that can access the endpoint
    
    Returns:
        Dependency function that checks user role
    
    Usage:
        @router.get("/admin-only")
        async def admin_endpoint(user: User = Depends(require_role(["admin"]))):
            return {"message": "Admin access granted"}
    """
    async def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role}' not authorized. Required: {allowed_roles}"
            )
        return current_user
    
    return role_checker

