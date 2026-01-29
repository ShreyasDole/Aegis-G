"""
Detection Schemas - Pydantic
Input/Output schemas for content scanning
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ScanRequest(BaseModel):
    """Request schema for content scanning"""
    content: str = Field(..., description="Text content to analyze")
    source_platform: Optional[str] = Field(None, description="Platform where content was found")
    metadata: Optional[dict] = Field(None, description="Additional metadata")


class ScanResponse(BaseModel):
    """Response schema for content scanning"""
    threat_id: Optional[int] = None
    content_hash: str
    risk_score: float = Field(..., ge=0.0, le=1.0, description="Risk score between 0 and 1")
    is_ai_generated: bool
    confidence: float = Field(..., ge=0.0, le=1.0)
    detected_model: Optional[str] = None
    timestamp: datetime
    recommendation: str = Field(..., description="Recommended action")


class BatchScanRequest(BaseModel):
    """Batch scanning request"""
    items: list[ScanRequest]
    priority: Optional[str] = "normal"  # low, normal, high, critical

