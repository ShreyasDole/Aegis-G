"""
System Router
Simple router to test connectivity
"""
from fastapi import APIRouter
from pydantic import BaseModel
from app.config import settings

router = APIRouter()


class SystemStatus(BaseModel):
    database: bool
    ai_engine: bool
    mcp_enabled: bool
    version: str


def _gemini_configured() -> bool:
    key = getattr(settings, "GEMINI_API_KEY", None) or ""
    return bool(key and str(key).strip() and str(key) != "test-key")


@router.get("/health", response_model=SystemStatus)
def health_check():
    """Health check — never 500 (shell + proxy poll this unauthenticated)."""
    mcp = False
    try:
        from app.services.mcp_client import is_mcp_enabled

        mcp = bool(is_mcp_enabled())
    except Exception:
        mcp = False
    try:
        return SystemStatus(
            database=True,
            ai_engine=_gemini_configured(),
            mcp_enabled=mcp,
            version="0.1.0-alpha",
        )
    except Exception:
        return SystemStatus(
            database=True,
            ai_engine=False,
            mcp_enabled=False,
            version="0.1.0-alpha",
        )

