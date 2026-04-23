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
    media_base64: Optional[str] = Field(None, description="Base64 encoded audio/video data")
    media_type: Optional[str] = Field(None, description="Type of media provided, e.g. 'audio', 'video', 'image'")
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
    reasoning: Optional[str] = None
    denoised_text: Optional[str] = None
    attribution: Optional[dict] = None
    explainability: Optional[list] = None
    rag_memory: Optional[list] = None
    is_conversational: Optional[bool] = False
    demo_mode: Optional[bool] = False
    fallback_reason: Optional[str] = None


class BatchScanRequest(BaseModel):
    """Batch scanning request"""
    items: list[ScanRequest]
    priority: Optional[str] = "normal"  # low, normal, high, critical


class RedTeamSimulateRequest(BaseModel):
    """Red-team simulator: how many payloads to run through the real orchestrator."""
    count: int = Field(10, ge=1, le=100, description="Number of adversarial payloads (1–100)")

