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
from app.services import demo_fallbacks
from app.core.blockchain import add_to_ledger  # For Prisha's component
from app.auth import get_current_active_user
from app.models.user import User

router = APIRouter()


@router.post("/fusion", response_model=dict)
async def analyze_threat_fusion(request: FusionRequest, db: Session = Depends(get_db)):
    """
    Endpoint for Agent 3 to combine Forensics and Graph data.
    """
    try:
        result = await AnalystAgent.synthesize_intelligence(
            content=request.content,
            forensics=request.forensic_data,
            graph=request.graph_data
        )

        report = result["report"]
        thoughts = result["ai_reasoning_log"]

        ledger_hash = None
        try:
            ledger_hash = await add_to_ledger(
                db=db,
                report_id=request.threat_id,
                analyst_id=1,
                content=f"Threat: {report.threat_title}",
                recipient_agency="Internal-Audit",
                thought_process=thoughts
            )
        except Exception:
            pass

        return {
            "report": report,
            "thought_process": thoughts,
            "ledger_hash": ledger_hash,
            "status": "Verified by Agent 3"
        }
    except Exception as e:
        return demo_fallbacks.fusion_bundle_dict(
            threat_id=request.threat_id,
            reason=str(e)[:500],
        )


@router.post("/orchestrate", response_model=dict)
async def run_orchestrator_pipeline(
    body: dict = Body(..., description="Keys: content (required), id (optional), mode (optional, default 'local')"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Same ThreatOrchestrator as POST /api/scan (JWT required here). Use for analyst console;
    public scan UI should call /api/scan with the same payload shape.
    """
    content = body.get("content", "")
    threat_id = body.get("id", 0)
    mode = body.get("mode", "local")
    if not content:
        return {"status": "error", "detail": "body.content is required"}
    try:
        result = await orchestrator.process_incoming_threat(
            payload={"content": content, "id": threat_id, "analyst_id": current_user.id},
            db=db,
            mode=mode,
        )
        return result
    except Exception as e:
        return demo_fallbacks.orchestrator_result_dict(
            content=content,
            reason=f"Orchestrator error (demo fallback): {str(e)[:400]}",
        )
