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
    timestamp: Optional[datetime] = None
    recommendation: str = Field(..., description="Recommended action")
    denoised_text: Optional[str] = None
    attribution: Optional[dict] = None
    # Image-specific fields
    image_analysis: Optional[dict] = None

    class Config:
        extra = "allow"


class BatchScanRequest(BaseModel):
    """Batch scanning request"""
    items: list[ScanRequest]
    priority: Optional[str] = "normal"  # low, normal, high, critical


class ImageScanRequest(BaseModel):
    """Request schema for image + text scanning"""
    content: Optional[str] = Field("", description="Optional text content")
    source_platform: Optional[str] = Field("web", description="Platform")
    username: Optional[str] = Field("anonymous", description="Username")
    metadata: Optional[dict] = Field(None, description="Additional metadata")

