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
    image_base64: Optional[str] = Field(None, description="Base64 encoded image data for visual multimodal scans")
    source_platform: Optional[str] = Field("web", description="Platform where content was found")
    username: Optional[str] = Field("anonymous", description="Username or identifier of the content source")
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
    denoised_text: Optional[str] = None
    attribution: Optional[dict] = None

    class Config:
        extra = "allow"


class BatchScanRequest(BaseModel):
    """Batch scanning request"""
    items: list[ScanRequest]
    priority: Optional[str] = "normal"  # low, normal, high, critical

