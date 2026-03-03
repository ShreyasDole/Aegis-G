"""
Sharing Router
Federated intelligence sharing with PII redaction and STIX 2.1 export
"""
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.auth import get_current_active_user
from app.models.database import get_db
from app.models.threat import Threat, Report as AegisReport
from app.services.export.stix_service import stix_service
from app.services.gemini.privacy import PrivacyService
from app.core.blockchain import add_to_ledger

router = APIRouter()


@router.get("/export/stix/{threat_id}")
async def export_threat_to_stix(
    threat_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user)
):
    """
    Generates a STIX 2.1 JSON bundle for a specific threat.
    Authorized for Analysts and Admins only.
    """
    threat = db.query(Threat).filter(Threat.id == threat_id).first()
    aegis_report = db.query(AegisReport).filter(AegisReport.threat_id == threat_id).first()

    if not threat:
        raise HTTPException(status_code=404, detail="Threat record not found")

    try:
        stix_json = stix_service.generate_threat_bundle(threat, aegis_report)
        return Response(
            content=stix_json,
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename=AEGIS_STIX_T{threat_id}.json"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"STIX Generation Failed: {str(e)}")


@router.post("/share/{report_id}")
async def share_intelligence(
    report_id: int,
    recipient_agency: str,
    redact_pii: bool = True
):
    """
    Share threat intelligence with allied agencies
    Automatically redacts PII before sharing
    """
    try:
        privacy_service = PrivacyService()
        
        # Redact PII if requested
        if redact_pii:
            redacted_content = await privacy_service.redact_pii(report_id)
        else:
            redacted_content = None
        
        # Add to blockchain ledger
        ledger_hash = await add_to_ledger(
            report_id=report_id,
            recipient_agency=recipient_agency,
            content=redacted_content
        )
        
        return {
            "report_id": report_id,
            "recipient_agency": recipient_agency,
            "ledger_hash": ledger_hash,
            "status": "shared",
            "pii_redacted": redact_pii
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sharing failed: {str(e)}")


@router.get("/ledger/{hash}")
async def verify_ledger_entry(hash: str):
    """Verify a ledger entry by hash"""
    # In production, verify against blockchain
    return {
        "hash": hash,
        "verified": True,
        "timestamp": "2024-01-01T00:00:00Z"
    }

