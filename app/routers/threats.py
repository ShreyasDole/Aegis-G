"""
Threats Router
Lists scanned threats from the database
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.threat import Threat

router = APIRouter()


@router.get("")
@router.get("/")
def get_threats(db: Session = Depends(get_db)) -> list:
    """Get the 50 most recent threats"""
    threats = db.query(Threat).order_by(Threat.timestamp.desc()).limit(50).all()
    return [
        {
            "id": t.id,
            "content": t.content,
            "content_hash": t.content_hash,
            "risk_score": t.risk_score,
            "source_platform": t.source_platform or "unknown",
            "timestamp": t.timestamp.isoformat() if t.timestamp else None,
            "detected_by": t.detected_by,
        }
        for t in threats
    ]


@router.get("/{threat_id}")
def get_threat(threat_id: int, db: Session = Depends(get_db)):
    """Get a single threat by ID (e.g. for forensics detail)."""
    t = db.query(Threat).filter(Threat.id == threat_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Threat not found")
    return {
        "id": t.id,
        "content": t.content,
        "content_hash": t.content_hash,
        "risk_score": t.risk_score,
        "source_platform": t.source_platform or "unknown",
        "timestamp": t.timestamp.isoformat() if t.timestamp else None,
        "detected_by": t.detected_by,
    }
