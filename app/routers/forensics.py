"""
Forensics Router
Deep dive analysis using Agent 1 (Stylometry) + Gemini 2.5 Flash
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.services.gemini.client import GeminiClient
from app.services.ai.stylometry import forensic_investigator
from app.models.database import get_db
from app.models.threat import Threat
from app.core.blockchain import add_to_ledger

router = APIRouter()


@router.post("/{threat_id}")
async def analyze_forensics(
    threat_id: int, 
    include_image: bool = False,
    db: Session = Depends(get_db)
):
    """
    Deep forensic analysis of flagged content.
    Uses Agent 1 (Stylometry) for perplexity & burstiness, plus Gemini for advanced reasoning.

    Args:
        threat_id: ID of the threat to analyze
        include_image: Whether to include image analysis

    Returns:
        Complete forensic analysis with stylometry and AI insights
    """
    try:
        # Fetch threat from database
        threat = db.query(Threat).filter(Threat.id == threat_id).first()
        
        if not threat:
            raise HTTPException(status_code=404, detail="Threat not found")
        
        # 1. Agent 1: Stylometric Analysis
        stylometry_result = forensic_investigator.analyze(threat.content)
        
        # 1b. Blockchain Audit (Agent 5): When Agent 1 detects a threat, record in ledger
        ledger_hash = None
        threat_detected = (
            stylometry_result.get("risk_score", 0) >= 0.5
            or stylometry_result.get("adversarial_detected", False)
        )
        if threat_detected:
            try:
                snapshot = (threat.content or "")[:100]
                ledger_hash = await add_to_ledger(
                    report_id=threat_id,
                    recipient_agency="Internal-Audit",
                    content=f"Agent1-Threat: risk={stylometry_result.get('risk_score', 0):.2f} adv={stylometry_result.get('adversarial_detected')} | {snapshot}",
                    db=db,
                    analyst_id=None,
                )
            except Exception as e:
                pass  # Don't fail the request if ledger write fails
        
        # 2. Gemini: Deep reasoning (optional, may fail if no API key)
        gemini_analysis = None
        try:
            gemini_client = GeminiClient()
            gemini_analysis = await gemini_client.forensic_analysis(
                threat_id=threat_id,
                include_image=include_image
            )
        except Exception as gemini_error:
            # Stylometry still works even if Gemini fails
            gemini_analysis = {
                "status": "unavailable",
                "error": "Gemini API not configured or failed"
            }
        
        return {
            "threat_id": threat_id,
            "stylometry": {
                "is_ai_generated": stylometry_result["is_ai"],
                "risk_score": stylometry_result["risk_score"],
                "burstiness": stylometry_result["burstiness"],
                "perplexity": stylometry_result["perplexity"],
                "artifacts": stylometry_result["artifacts"],
                "adversarial_detected": stylometry_result["adversarial_detected"],
                "adversarial_patterns": stylometry_result["adversarial_patterns"]
            },
            "blockchain_hash": ledger_hash,
            "ai_analysis": gemini_analysis,
            "entities": gemini_analysis.get("entities", {}) if isinstance(gemini_analysis, dict) else {},
            "attribution": gemini_analysis.get("attribution", {}) if isinstance(gemini_analysis, dict) else {},
            "recommendations": gemini_analysis.get("recommendations", []) if isinstance(gemini_analysis, dict) else []
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forensic analysis failed: {str(e)}")


@router.get("/{threat_id}/summary")
async def get_forensic_summary(threat_id: int, db: Session = Depends(get_db)):
    """
    On-load explanation: stylometry (why Agent 1 score) + pipeline metadata from DB.
    Does not call Gemini (use POST /{id} for full cloud analysis).
    """
    threat = db.query(Threat).filter(Threat.id == threat_id).first()
    if not threat:
        raise HTTPException(status_code=404, detail="Threat not found")
    styl = forensic_investigator.analyze(threat.content or "")
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
    if styl.get("artifacts"):
        signals.append(f"Artifacts: {', '.join(styl['artifacts'][:8])}")
    return {
        "threat_id": threat_id,
        "summary": styl.get("details") or "Stylometry complete.",
        "status": "ready",
        "stored_risk_score": threat.risk_score,
        "detected_by": threat.detected_by or "pipeline",
        "stylometry": {
            "is_ai": styl.get("is_ai"),
            "risk_score": styl.get("risk_score"),
            "burstiness": styl.get("burstiness"),
            "perplexity": styl.get("perplexity"),
            "artifacts": styl.get("artifacts") or [],
            "adversarial_detected": styl.get("adversarial_detected"),
            "adversarial_patterns": styl.get("adversarial_patterns") or [],
        },
        "why_signals": signals,
    }


@router.post("/stylometry/analyze")
async def analyze_text_stylometry(text: str):
    """
    Direct stylometry analysis endpoint.
    
    Agent 1: Forensic Investigator
    Analyzes text for AI-generated characteristics using:
    - Burstiness (sentence length variance)
    - Perplexity (text predictability)
    - Adversarial pattern detection (Leetspeak, obfuscation)
    
    Args:
        text: The content to analyze
        
    Returns:
        Stylometric analysis results
    """
    if not text or len(text.strip()) < 10:
        raise HTTPException(
            status_code=400, 
            detail="Text must be at least 10 characters"
        )
    
    try:
        result = forensic_investigator.analyze(text)
        return {
            "status": "success",
            "analysis": result,
            "agent": "Agent 1 - Forensic Investigator"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Stylometry analysis failed: {str(e)}"
        )

