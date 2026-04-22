"""
Detection Router
Real-time content scanning endpoint.
Now fully integrated with the Orchestrator Pipeline.
"""
from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy.orm import Session
from app.schemas.detection import ScanRequest, ScanResponse, BatchScanRequest
from app.services.ai.orchestrator import orchestrator
from app.models.database import get_db
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("", response_model=ScanResponse)
@router.post("/", response_model=ScanResponse)
async def scan_content(
    request: ScanRequest, 
    req: Request,
    db: Session = Depends(get_db)
):
    """
    Live Threat Detection Pipeline.
    
    This endpoint now triggers the complete Multi-Agent Defense Pipeline:
    1. Agent 1 (Forensics) - Analyzes content locally or via Gemini
    2. Agent 2 (Graph) - Maps nodes and detects Patient Zero
    3. Agent 4 (Policy Guardian) - Applies guardrails
    4. Trust Layer (Blockchain) - Logs high-risk threats
    
    Headers:
      X-Inference-Mode: 'local' (Air-Gapped) or 'cloud' (Gemini)
    """
    try:
        # 1. Determine Mode (Default to Local for Security)
        mode = (req.headers.get("X-Inference-Mode") or "local").lower()
        
        # 2. Prepare payload for orchestrator
        payload = {
            "content": request.content,
            "source_platform": request.source_platform or "web",
            "username": request.username or "anonymous"
        }
        
        # 3. Execute Orchestrator Pipeline
        logger.info(f"🚀 Starting Defense Pipeline for content (mode: {mode})...")
        result = await orchestrator.process_incoming_threat(
            payload=payload,
            db=db,
            mode=mode
        )

        # 4. Persist threat to PostgreSQL (idempotent — skip if hash already stored)
        threat_id = None
        try:
            from app.models.threat import Threat
            existing = db.query(Threat).filter(
                Threat.content_hash == result.get("content_hash")
            ).first()
            if not existing:
                threat_record = Threat(
                    content_hash=result.get("content_hash", ""),
                    content=request.content,
                    risk_score=result.get("risk_score", 0.0),
                    source_platform=payload["source_platform"],
                    detected_by=result.get("forensics", {}).get("detected_model", mode),
                )
                db.add(threat_record)
                db.commit()
                db.refresh(threat_record)
                threat_id = threat_record.id
            else:
                threat_id = existing.id
        except Exception as save_err:
            logger.warning(f"Threat DB save error: {save_err}")

        # 5. Handle blocked threats
        if result.get("status") == "BLOCKED":
            logger.warning("🚫 Threat blocked by Policy Guardian")
            return ScanResponse(
                threat_id=threat_id,
                content_hash=result.get("content_hash", ""),
                risk_score=result.get("risk_score", 0.0),
                is_ai_generated=result.get("forensics", {}).get("is_ai_generated", False),
                confidence=result.get("forensics", {}).get("confidence", 0.0),
                detected_model=result.get("forensics", {}).get("detected_model", "unknown"),
                timestamp=datetime.utcnow(),
                recommendation=f"BLOCKED: {result.get('action', {}).get('reason', 'Policy violation')}"
            )

        # 6. Format Response
        forensics = result.get("forensics", {})
        return ScanResponse(
            threat_id=threat_id,
            content_hash=result.get("content_hash", ""),
            risk_score=result.get("risk_score", 0.0),
            is_ai_generated=result.get("is_ai_generated", False),
            confidence=forensics.get("confidence", 0.0),
            detected_model=forensics.get("detected_model", "unknown"),
            timestamp=datetime.utcnow(),
            recommendation=result.get("recommendation", "None")
        )

    except Exception as e:
        import traceback
        logger.error(f"Defense Grid Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Defense Grid Error: {str(e)}")


@router.post("/batch", response_model=list)
async def scan_batch(
    request: BatchScanRequest, 
    req: Request,
    db: Session = Depends(get_db)
):
    """Batch content scanning for high-volume processing"""
    results = []
    for item in request.items:
        # Create a ScanRequest from the batch item
        scan_request = ScanRequest(
            content=item.content,
            source_platform=item.source_platform or "web",
            username=item.username if hasattr(item, 'username') else "anonymous"
        )
        result = await scan_content(scan_request, req, db)
        results.append(result)
    return results
