# app/routers/scan_core.py
"""Core Scan API endpoint (Phase 1)

Provides an end‑to‑end flow that:
1. Normalises the input text using the AdversarialDenoiser.
2. Runs the DeBERTa attribution model (ONNX if available, otherwise the PyTorch wrapper).
3. Returns the denoised text, risk score and per‑model probabilities.

The endpoint is deliberately lightweight and runs in *local* mode (air‑gap) by default.
"""

from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session

from app.schemas.detection import ScanRequest, ScanResponse
from app.models.database import get_db
from app.services.ai.orchestrator import orchestrator

router = APIRouter()

@router.post("/core", response_model=ScanResponse, status_code=status.HTTP_200_OK)
async def core_scan(
    request: ScanRequest,
    req: Request,
    db: Session = Depends(get_db),
):
    """Run the Phase 1 detection pipeline.

    The client can optionally set the ``X-Inference-Mode`` header to ``local``
    (default) or ``cloud``. ``local`` forces the ONNX/CPU path; ``cloud`` falls
    back to the Gemini client as implemented in the orchestrator.
    """
    mode = (req.headers.get("X-Inference-Mode") or "local").lower()
    payload = {
        "content": request.content,
        "source_platform": request.source_platform or "web",
        "username": request.username or "anonymous",
    }
    try:
        result = await orchestrator.process_incoming_threat(payload, db, mode=mode)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Phase 1 processing failed: {str(e)}"
        )

    # The orchestrator now returns a dict with denoised_text, risk_score and attribution.
    return ScanResponse(
        content_hash=result.get("content_hash", ""),
        risk_score=result.get("risk_score", 0.0),
        is_ai_generated=result.get("is_ai_generated", False),
        confidence=result.get("confidence", 0.0),
        detected_model=result.get("detected_model", ""),
        timestamp=result.get("timestamp"),
        recommendation=result.get("recommendation", ""),
        # Extra fields for UI mapping
        denoised_text=result.get("denoised_text", ""),
        attribution=result.get("attribution", {}),
        explainability=result.get("explainability", []),
        rag_memory=result.get("rag_memory", []),
    )
