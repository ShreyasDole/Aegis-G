"""
Threats Router
Lists scanned threats from the database
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.models.database import get_db
from app.models.threat import Threat
from app.services import demo_fallbacks

router = APIRouter()
logger = logging.getLogger(__name__)


def _threat_dict(t: Threat) -> dict:
    return {
        "id": int(t.id),
        "content": t.content if isinstance(t.content, str) else str(t.content or ""),
        "content_hash": t.content_hash or "",
        "risk_score": float(t.risk_score) if t.risk_score is not None else 0.0,
        "source_platform": t.source_platform or "unknown",
        "timestamp": t.timestamp.isoformat() if t.timestamp else None,
        "detected_by": t.detected_by,
    }


@router.get("")
@router.get("/")
def get_threats(db: Session = Depends(get_db)) -> list:
    """Get the 50 most recent threats"""
    try:
        threats = db.query(Threat).order_by(Threat.timestamp.desc()).limit(50).all()
        return jsonable_encoder([_threat_dict(t) for t in threats])
    except SQLAlchemyError as e:
        logger.warning("get_threats DB error: %s", e)
        return JSONResponse(
            content=jsonable_encoder(demo_fallbacks.demo_threat_rows()),
            headers={"X-Aegis-Fallback": "1"},
        )


@router.get("/{threat_id}")
def get_threat(threat_id: int, db: Session = Depends(get_db)):
    """Get a single threat by ID (e.g. for forensics detail)."""
    try:
        t = db.query(Threat).filter(Threat.id == threat_id).first()
    except SQLAlchemyError as e:
        logger.warning("get_threat DB error: %s", e)
        return JSONResponse(
            content=jsonable_encoder(
                demo_fallbacks.demo_threat_detail(threat_id)
            ),
            headers={"X-Aegis-Fallback": "1"},
        )
    if not t:
        raise HTTPException(status_code=404, detail="Threat not found")
    return jsonable_encoder(_threat_dict(t))
