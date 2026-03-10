"""
Authentication Router
Login, Register, Outlook OAuth, and Token Management endpoints
"""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.auth import (
    create_access_token,
    get_password_hash,
    verify_password,
    get_current_active_user,
)
from app.auth.jwt import Token
from app.auth.outlook import (
    exchange_code_for_user_info,
    get_authorize_url,
    get_redirect_uri,
    is_outlook_configured,
)
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


# ============================================
# Outlook / Microsoft OAuth
# ============================================

# Placeholder password for OAuth-only users (never used for login)
OAUTH_PASSWORD_PLACEHOLDER = "oauth-no-password-placeholder"


@router.get("/outlook")
async def outlook_login(request: Request):
    """
    Redirect to Microsoft sign-in. Requires OUTLOOK_CLIENT_ID, OUTLOOK_TENANT_ID, OUTLOOK_CLIENT_SECRET in env.
    """
    if not is_outlook_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Microsoft sign-in is not configured. Set OUTLOOK_CLIENT_ID, OUTLOOK_TENANT_ID, OUTLOOK_CLIENT_SECRET.",
        )
    base = f"{request.base_url.scheme}://{request.base_url.netloc}"
    redirect_uri = get_redirect_uri(base)
    url = get_authorize_url(redirect_uri)
    return RedirectResponse(url=url, status_code=302)


@router.get("/outlook/callback")
async def outlook_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
):
    """
    OAuth callback: exchange code for user info, find or create user, redirect to frontend with JWT.
    """
    if error:
        frontend = settings.FRONTEND_URL.rstrip("/")
        return RedirectResponse(url=f"{frontend}/login?error=access_denied", status_code=302)
    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing code")
    if not is_outlook_configured():
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Outlook OAuth not configured")

    base = f"{request.base_url.scheme}://{request.base_url.netloc}"
    redirect_uri = get_redirect_uri(base)
    try:
        info = await exchange_code_for_user_info(code, redirect_uri)
    except Exception as e:
        frontend = settings.FRONTEND_URL.rstrip("/")
        return RedirectResponse(url=f"{frontend}/login?error=oauth_failed", status_code=302)

    email = (info.get("email") or "").strip().lower()
    if not email:
        frontend = settings.FRONTEND_URL.rstrip("/")
        return RedirectResponse(url=f"{frontend}/login?error=no_email", status_code=302)

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            hashed_password=get_password_hash(OAUTH_PASSWORD_PLACEHOLDER),
            full_name=info.get("name") or email.split("@")[0],
            role="analyst",
            is_active=True,
            status="approved",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if not user.is_active or user.status != "approved":
        frontend = settings.FRONTEND_URL.rstrip("/")
        return RedirectResponse(url=f"{frontend}/login?error=account_disabled", status_code=302)

    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    frontend = settings.FRONTEND_URL.rstrip("/")
    return RedirectResponse(url=f"{frontend}/auth/callback?token={access_token}", status_code=302)

