"""
System Router
Simple router to test connectivity
"""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class SystemStatus(BaseModel):
    database: bool
    ai_engine: bool
    version: str


@router.get("/health", response_model=SystemStatus)
def health_check():
    """Health check endpoint - tests basic connectivity"""
    # In real app, check DB connection here
    return {
        "database": True, 
        "ai_engine": False,  # Not connected yet
        "version": "0.1.0-alpha"
    }

