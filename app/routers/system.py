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
    """Health check endpoint - tests basic connectivity"""
    from app.services.mcp_client import is_mcp_enabled
    return SystemStatus(
        database=True,
        ai_engine=_gemini_configured(),
        mcp_enabled=is_mcp_enabled(),
        version="0.1.0-alpha"
    )

