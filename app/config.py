"""
Configuration Management
Environment variables and settings
"""
import os
import logging
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List, Optional

logger = logging.getLogger(__name__)

# Project root (parent of app/) so .env is found regardless of cwd
_ROOT_DIR = Path(__file__).resolve().parent.parent
_ENV_FILE = _ROOT_DIR / ".env"


class Settings(BaseSettings):
    # API Configuration
    API_V1_PREFIX: str = "/api"
    PROJECT_NAME: Optional[str] = "Aegis-G"
    API_V1_STR: Optional[str] = "/api/v1"

    # Gemini API
    GEMINI_API_KEY: str = "test-key"
    GEMINI_FLASH_MODEL: str = "gemini-2.5-flash"

    # Database Configuration
    # BUG FIX: default is now an empty string, not "sqlite:///:memory:",
    # so startup validation can catch a missing DATABASE_URL in prod.
    DATABASE_URL: str = ""
    POSTGRES_USER: Optional[str] = "aegis"
    POSTGRES_PASSWORD: Optional[str] = "aegis_password"
    POSTGRES_DB: Optional[str] = "aegis"

    # Neo4j Configuration
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "test"
    NEO4J_AUTH: Optional[str] = None

    # Security
    # BUG FIX: sentinel value — startup validation will reject this in prod
    SECRET_KEY: str = "__CHANGE_ME__"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS — lock this down in production
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]

    # Outlook / Microsoft OAuth (login)
    OUTLOOK_CLIENT_ID: Optional[str] = None
    OUTLOOK_TENANT_ID: Optional[str] = None
    OUTLOOK_CLIENT_SECRET: Optional[str] = None
    ENCRYPTION_KEY: Optional[str] = None
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # MCP (Model Context Protocol)
    MCP_SERVER_URL: Optional[str] = None
    MCP_SERVER_URLS: Optional[str] = None
    MCP_GOOGLE_PROJECT_ID: Optional[str] = None
    DEVELOPER_KNOWLEDGE_API_KEY: Optional[str] = None

    # Application
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    ENABLE_METRICS: bool = False

    class Config:
        env_file = str(_ENV_FILE) if _ENV_FILE.exists() else ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields in .env


settings = Settings()


# ─────────────────────────────────────────────────────────────────────────────
# Production startup validation
# BUG FIX: enforce critical env vars in deployed environments so the app
# fails FAST with a clear message instead of silently misbehaving.
# ─────────────────────────────────────────────────────────────────────────────

def validate_production_settings() -> None:
    """
    Raise RuntimeError for any critical misconfiguration.
    Called from app.main lifespan so the error is caught and logged clearly.
    Only enforced when ENVIRONMENT != 'development' or Railway env is detected.
    """
    is_prod = (
        settings.ENVIRONMENT not in ("development", "dev", "test")
        or os.getenv("RAILWAY_ENVIRONMENT") is not None
    )

    if not is_prod:
        return  # Skip checks in local dev

    errors: List[str] = []

    # 1. DATABASE_URL must be set and must NOT be SQLite in prod
    if not settings.DATABASE_URL:
        errors.append(
            "DATABASE_URL is not set. "
            "Add it as a Railway environment variable (e.g. PostgreSQL connection string)."
        )
    elif settings.DATABASE_URL.startswith("sqlite"):
        errors.append(
            f"DATABASE_URL is set to SQLite ({settings.DATABASE_URL!r}). "
            "SQLite is not supported in production — set a PostgreSQL URL."
        )

    # 2. SECRET_KEY must not be the default sentinel
    if settings.SECRET_KEY in ("__CHANGE_ME__", "your-secret-key-change-in-production", ""):
        errors.append(
            "SECRET_KEY is not set or is the insecure default. "
            "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
        )

    # 3. GEMINI_API_KEY must not be the test placeholder
    if settings.GEMINI_API_KEY in ("test-key", "", "your-gemini-api-key-here"):
        errors.append(
            "GEMINI_API_KEY is not set or is a placeholder. "
            "Get a real key from https://aistudio.google.com and add it to Railway env vars."
        )

    if errors:
        msg = "❌ Production configuration errors:\n" + "\n".join(f"  • {e}" for e in errors)
        logger.critical(msg)
        raise RuntimeError(msg)

    logger.info("✅ Production settings validated successfully.")
