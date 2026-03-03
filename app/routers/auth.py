"""
Authentication Router
Login, Register, and Token Management endpoints
"""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.auth import (
    create_access_token,
    get_password_hash,
    verify_password,
    get_current_active_user,
)
from app.auth.jwt import Token
from app.config import settings
from app.models.database import get_db
from app.models.user import User
from app.seed import DEFAULT_USERS

router = APIRouter()

# Demo users that can be auto-created on first login if DB is empty (e.g. seed didn't run)
DEMO_EMAILS = {u["email"] for u in DEFAULT_USERS}
DEMO_BY_EMAIL = {u["email"]: u for u in DEFAULT_USERS}


# ============================================
# Request/Response Schemas
# ============================================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str | None
    role: str
    is_active: bool

    class Config:
        from_attributes = True


# ============================================
# Endpoints
# ============================================

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user
    
    - **email**: Valid email address (must be unique)
    - **password**: Strong password
    - **full_name**: Optional display name
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    new_user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role="analyst",  # Default role
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login and receive JWT token

    - **email**: Registered email address
    - **password**: Account password

    Returns JWT access token valid for configured duration.
    Demo users (test@aegis.com, admin@aegis.com) are created on first login if missing.
    """
    user = db.query(User).filter(User.email == credentials.email).first()

    # If user not found, allow demo users to be created on first login (so login works without seed)
    if not user and credentials.email in DEMO_EMAILS:
        demo = DEMO_BY_EMAIL.get(credentials.email)
        if demo and credentials.password == demo["password"]:
            try:
                user = User(
                    email=demo["email"],
                    hashed_password=get_password_hash(demo["password"]),
                    full_name=demo["full_name"],
                    role=demo["role"],
                    is_active=True,
                    status="approved",
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            except Exception:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Database not ready. Run migrations and try again.",
                )

    if not user or not (user.hashed_password and verify_password(credentials.password, user.hashed_password)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
        },
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return Token(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """
    Get current authenticated user's information
    
    Requires valid JWT token in Authorization header
    """
    return current_user


@router.post("/refresh", response_model=Token)
async def refresh_token(current_user: User = Depends(get_current_active_user)):
    """
    Refresh the JWT token
    
    Returns a new token with extended expiration
    """
    access_token = create_access_token(
        data={
            "sub": current_user.id,
            "email": current_user.email,
            "role": current_user.role
        },
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return Token(access_token=access_token)

