"""
Forensics Router
Deep dive analysis using Agent 1 (Stylometry) + Gemini 2.5 Flash
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.services.gemini.client import GeminiClient
from app.services.ai.stylometry import forensic_investigator
from app.services import demo_fallbacks
from app.models.database import get_db
from app.models.threat import Threat
from app.core.blockchain import add_to_ledger

router = APIRouter()


class StylometryAnalyzeBody(BaseModel):
    text: str = Field(..., min_length=10)


@router.post("/stylometry/analyze")
async def analyze_text_stylometry(body: StylometryAnalyzeBody):
    """
    Direct stylometry analysis endpoint (static path — must stay above /{threat_id}).
    """
    text = body.text.strip()
    try:
        result = forensic_investigator.analyze(text)
        return jsonable_encoder(
            {
                "status": "success",
                "analysis": result,
                "agent": "Agent 1 - Forensic Investigator",
            }
        )
    except Exception as e:
        return jsonable_encoder(
            demo_fallbacks.stylometry_endpoint_dict(reason=str(e)[:500])
        )


@router.get("/{threat_id}/summary")
async def get_forensic_summary(threat_id: int, db: Session = Depends(get_db)):
    """
    On-load explanation: stylometry (why Agent 1 score) + pipeline metadata from DB.
    Does not call Gemini (use POST /{id} for full cloud analysis).
    """
    try:
        threat = db.query(Threat).filter(Threat.id == threat_id).first()
    except SQLAlchemyError as e:
        return jsonable_encoder(
            demo_fallbacks.forensic_summary_dict(
                threat_id=threat_id,
                stored_risk=0.0,
                reason=f"DB error (demo fallback): {str(e)[:400]}",
            )
        )
    if not threat:
        raise HTTPException(status_code=404, detail="Threat not found")
    try:
        styl = forensic_investigator.analyze(threat.content or "")
    except Exception as e:
        return jsonable_encoder(
            demo_fallbacks.forensic_summary_dict(
                threat_id=threat_id,
                stored_risk=float(threat.risk_score) if threat.risk_score is not None else 0.0,
                reason=f"Stylometry error (demo fallback): {str(e)[:400]}",
            )
        )
    signals = []
    if styl.get("burstiness") is not None:
        signals.append(
            f"Burstiness {styl['burstiness']}: sentence-length variance; "
            "very uniform sentences often read as synthetic."
        )
    if styl.get("perplexity") is not None:
        signals.append(
            f"Perplexity proxy {styl['perplexity']}: vocabulary / pattern diversity; "
            "low scores correlate with templated or model-like text in this heuristic."
        )
    if styl.get("adversarial_detected"):
        signals.append(
            "Adversarial/obfuscation patterns flagged — raises risk independent of generative model."
        )
    artifacts = styl.get("artifacts")
    if artifacts:
        signals.append(f"Artifacts: {', '.join(str(a) for a in list(artifacts)[:8])}")
    payload = {
        "threat_id": threat_id,
        "summary": styl.get("details") or "Stylometry complete.",
        "status": "ready",
        "stored_risk_score": float(threat.risk_score) if threat.risk_score is not None else 0.0,
        "detected_by": threat.detected_by or "pipeline",
        "stylometry": {
            "is_ai": styl.get("is_ai"),
            "risk_score": styl.get("risk_score"),
            "burstiness": styl.get("burstiness"),
            "perplexity": styl.get("perplexity"),
            "artifacts": list(styl.get("artifacts") or []),
            "adversarial_detected": styl.get("adversarial_detected"),
            "adversarial_patterns": list(styl.get("adversarial_patterns") or []),
        },
        "why_signals": signals,
    }
    return jsonable_encoder(payload)


@router.post("/{threat_id}")
async def analyze_forensics(
    threat_id: int,
    include_image: bool = False,
    db: Session = Depends(get_db),
):
    """
    Deep forensic analysis of flagged content.
    Uses Agent 1 (Stylometry) for perplexity & burstiness, plus Gemini for advanced reasoning.
    """
    try:
        threat = db.query(Threat).filter(Threat.id == threat_id).first()
        if not threat:
            raise HTTPException(status_code=404, detail="Threat not found")

        stylometry_result = forensic_investigator.analyze(threat.content or "")

        ledger_hash = None
        threat_detected = (
            float(stylometry_result.get("risk_score", 0) or 0) >= 0.5
            or stylometry_result.get("adversarial_detected", False)
        )
        if threat_detected:
            try:
                snapshot = (threat.content or "")[:100]
                ledger_hash = await add_to_ledger(
                    report_id=threat_id,
                    recipient_agency="Internal-Audit",
                    content=(
                        f"Agent1-Threat: risk={float(stylometry_result.get('risk_score', 0) or 0):.2f} "
                        f"adv={stylometry_result.get('adversarial_detected')} | {snapshot}"
                    ),
                    db=db,
                    analyst_id=None,
                )
            except Exception:
                pass

        gemini_analysis = None
        try:
            gemini_client = GeminiClient()
            gemini_analysis = await gemini_client.forensic_analysis(
                threat_id=threat_id,
                include_image=include_image,
            )
        except Exception:
            gemini_analysis = {
                "status": "unavailable",
                "error": "Gemini API not configured or failed",
            }

        payload = {
            "threat_id": threat_id,
            "stylometry": {
                "is_ai_generated": stylometry_result["is_ai"],
                "risk_score": stylometry_result["risk_score"],
                "burstiness": stylometry_result["burstiness"],
                "perplexity": stylometry_result["perplexity"],
                "artifacts": stylometry_result["artifacts"],
                "adversarial_detected": stylometry_result["adversarial_detected"],
                "adversarial_patterns": stylometry_result["adversarial_patterns"],
            },
            "blockchain_hash": ledger_hash,
            "ai_analysis": gemini_analysis,
            "entities": gemini_analysis.get("entities", {})
            if isinstance(gemini_analysis, dict)
            else {},
            "attribution": gemini_analysis.get("attribution", {})
            if isinstance(gemini_analysis, dict)
            else {},
            "recommendations": gemini_analysis.get("recommendations", [])
            if isinstance(gemini_analysis, dict)
            else [],
        }
        return jsonable_encoder(payload)
    except HTTPException:
        raise
    except Exception as e:
        return jsonable_encoder(
            demo_fallbacks.forensic_analyze_dict(
                threat_id=threat_id,
                reason=f"Forensic analysis error (demo fallback): {str(e)[:400]}",
            )
        )
