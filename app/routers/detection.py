"""
Detection Router
Real-time content scanning endpoint
Supports X-Inference-Mode: local (CPU) or cloud (Gemini API)
"""
from fastapi import APIRouter, HTTPException, Request
from app.schemas.detection import ScanRequest, ScanResponse, BatchScanRequest
from app.services.gemini.client import GeminiClient
from datetime import datetime
import hashlib

router = APIRouter()


@router.post("/", response_model=ScanResponse)
async def scan_content(request: ScanRequest, req: Request):
    """
    Real-time content scanning using Gemini (cloud) or placeholder (local CPU).
    X-Inference-Mode header: "local" = Prisha's DistilRoBERTa (placeholder), "cloud" = Gemini API
    """
    try:
        mode = (req.headers.get("X-Inference-Mode") or "local").lower()

        if mode == "cloud":
            # Call Gemini Cloud API
            gemini_client = GeminiClient()
            analysis = await gemini_client.detect_ai_content(request.content)
        else:
            # Local CPU mode - placeholder for Prisha's DistilRoBERTa
            analysis = {
                "risk_score": 0.75,
                "is_ai_generated": True,
                "confidence": 0.72,
                "detected_model": "local-distilroberta (placeholder)",
            }
        
        # Generate content hash
        content_hash = hashlib.sha256(request.content.encode()).hexdigest()
        
        # Calculate risk score
        risk_score = analysis.get("risk_score", 0.0)
        is_ai_generated = analysis.get("is_ai_generated", False)
        confidence = analysis.get("confidence", 0.0)
        
        # Determine recommendation
        if risk_score > 0.8:
            recommendation = "CRITICAL: Immediate forensic analysis required"
        elif risk_score > 0.6:
            recommendation = "HIGH: Schedule deep dive analysis"
        elif risk_score > 0.4:
            recommendation = "MEDIUM: Monitor and track"
        else:
            recommendation = "LOW: Standard monitoring"
        
        return ScanResponse(
            content_hash=content_hash,
            risk_score=risk_score,
            is_ai_generated=is_ai_generated,
            confidence=confidence,
            detected_model=analysis.get("detected_model"),
            timestamp=datetime.utcnow(),
            recommendation=recommendation
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")


@router.post("/batch", response_model=list)
async def scan_batch(request: BatchScanRequest, req: Request):
    """Batch content scanning for high-volume processing"""
    results = []
    for item in request.items:
        result = await scan_content(item, req)
        results.append(result)
    return results

