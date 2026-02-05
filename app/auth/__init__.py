"""
Authentication Module
JWT-based authentication for Aegis-G
"""
from app.auth.jwt import (
    create_access_token,
    verify_token,
    get_current_user,
    get_current_active_user,
    require_role,
)
from app.auth.password import get_password_hash, verify_password

__all__ = [
    "create_access_token",
    "verify_token",
    "get_current_user",
    "get_current_active_user",
    "require_role",
    "get_password_hash",
    "verify_password",
]

