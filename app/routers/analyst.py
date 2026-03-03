"""
Analyst Router - Agent 3 (Intelligence Analyst)
Fusion endpoint for synthesizing intelligence reports
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.schemas.intelligence import FusionRequest, IntelligenceReport
from app.services.ai.fusion_service import AnalystAgent
from app.core.blockchain import add_to_ledger  # For Prisha's component

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
