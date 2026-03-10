"""
Analyst Router - Agent 3 (Intelligence Analyst)
Fusion endpoint and full Orchestrator pipeline
"""
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.schemas.intelligence import FusionRequest
from app.services.ai.fusion_service import AnalystAgent
from app.services.ai.orchestrator import orchestrator
from app.core.blockchain import add_to_ledger  # For Prisha's component
from app.auth import get_current_active_user
from app.models.user import User

router = APIRouter()


@router.post("/fusion", response_model=dict)
async def analyze_threat_fusion(request: FusionRequest, db: Session = Depends(get_db)):
    """
    Endpoint for Agent 3 to combine Forensics and Graph data.
    """
    # 1. Run the Synthesis
    result = await AnalystAgent.synthesize_intelligence(
        content=request.content,
        forensics=request.forensic_data,
        graph=request.graph_data
    )
    
    report = result["report"]
    thoughts = result["ai_reasoning_log"]

    # 2. Log to the Blockchain (Trust Layer)
    # We include the AI's internal reasoning so the logic is immutable.
    ledger_hash = await add_to_ledger(
        report_id=request.threat_id,
        recipient_agency="Internal-Audit",
        content=f"Threat: {report.threat_title} | Logic: {thoughts}"
    )

    return {
        "report": report,
        "thought_process": thoughts,
        "ledger_hash": ledger_hash,
        "status": "Verified by Agent 3"
    }


@router.post("/orchestrate", response_model=dict)
async def run_orchestrator_pipeline(
    body: dict = Body(..., description="Keys: content (required), id (optional), mode (optional, default 'local')"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Run the full Multi-Agent pipeline (Orchestrator).
    Agents 1 (Forensics) -> 2 (Graph) -> 4 (Policy) -> 3 (Analyst) -> Trust Layer.
    mode: "local" = placeholder forensics, "cloud" = Gemini where configured.
    """
    content = body.get("content", "")
    threat_id = body.get("id", 0)
    mode = body.get("mode", "local")
    if not content:
        return {"status": "error", "detail": "body.content is required"}
    result = await orchestrator.process_incoming_threat(
        payload={"content": content, "id": threat_id},
        db=db,
        mode=mode,
    )
    return result
