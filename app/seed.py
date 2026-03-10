"""
Seed default users for development and testing.
Creates test and admin accounts if they don't exist.
"""
import logging
from app.models.database import SessionLocal
from app.models.user import User
from app.auth.password import get_password_hash

logger = logging.getLogger(__name__)

DEFAULT_USERS = [
    {
        "email": "test@aegis.com",
        "password": "TestPassword123!",
        "full_name": "Test User",
        "role": "analyst",
    },
    {
        "email": "admin@aegis.com",
        "password": "AdminPassword123!",
        "full_name": "Admin User",
        "role": "admin",
    },
]


def seed_default_users():
    """Create default test and admin users if they don't exist."""
    import os
    if os.getenv("ENVIRONMENT") == "testing":
        logger.debug("Skipping seed in testing environment")
        return

    db = SessionLocal()
    try:
        for user_data in DEFAULT_USERS:
            existing = db.query(User).filter(User.email == user_data["email"]).first()
            if existing:
                logger.debug(f"User {user_data['email']} already exists, skipping")
                continue

            user = User(
                email=user_data["email"],
                hashed_password=get_password_hash(user_data["password"]),
                full_name=user_data["full_name"],
                role=user_data["role"],
                is_active=True,
                status="approved",
            )
            db.add(user)
            logger.info(f"Created seed user: {user_data['email']} (role: {user_data['role']})")

        db.commit()
    except Exception as e:
        logger.error(f"Seed failed: {e}")
        db.rollback()
    finally:
        db.close()
