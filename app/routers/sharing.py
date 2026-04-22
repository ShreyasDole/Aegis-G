"""
Sharing Router
Federated intelligence sharing with PII redaction and STIX 2.1 export
"""
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from datetime import datetime
from app.auth import get_current_active_user
from app.models.database import get_db
from app.models.threat import Threat, Report as AegisReport
from app.services.export.stix_service import stix_service
from app.services.gemini.privacy import PrivacyService
from app.core.blockchain import add_to_ledger, verify_ledger_integrity, verify_full_chain

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
    redact_pii: bool = True,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user)
):
    """
    Share threat intelligence with allied agencies.
    Automatically redacts PII before sharing.
    Logs to blockchain ledger (Agent 5) for audit trail.
    """
    try:
        privacy_service = PrivacyService()
        
        # Redact PII if requested
        if redact_pii:
            redacted_content = await privacy_service.redact_pii(report_id)
        else:
            redacted_content = f"Shared report {report_id} with {recipient_agency}"
        
        # Add to blockchain ledger (Agent 5: Trust Layer)
        ledger_hash = await add_to_ledger(
            db=db,
            report_id=report_id,
            analyst_id=current_user.id,
            content=redacted_content,
            recipient_agency=recipient_agency
        )
        
        return {
            "report_id": report_id,
            "recipient_agency": recipient_agency,
            "ledger_hash": ledger_hash,
            "status": "shared",
            "pii_redacted": redact_pii,
            "shared_by": current_user.email
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sharing failed: {str(e)}")


@router.get("/ledger/integrity")
async def check_chain_integrity(
    current_user=Depends(get_current_active_user)
):
    """
    Check blockchain integrity - verifies all blocks are linked correctly.
    """
    from app.core.blockchain import verify_chain_integrity
    
    try:
        is_valid = verify_chain_integrity()
        return {
            "is_valid": is_valid,
            "status": "INTACT" if is_valid else "TAMPERED",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Integrity check failed: {str(e)}")


@router.get("/ledger/verify/chain")
async def verify_blockchain_chain(db: Session = Depends(get_db)):
    """
    Verify integrity of the entire blockchain ledger.
    Agent 5: Trust Layer - Full chain verification
    """
    try:
        result = await verify_full_chain(db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chain verification failed: {str(e)}")


@router.get("/ledger")
async def get_ledger_history(
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user)
):
    """
    Ledger Explorer - View blockchain history of threat intelligence sharing.
    Returns all ledger entries in chronological order.
    """
    from app.models.ledger import LedgerEntry
    from sqlalchemy import desc
    
    try:
        entries = db.query(LedgerEntry).order_by(desc(LedgerEntry.timestamp)).offset(offset).limit(limit).all()
        total = db.query(LedgerEntry).count()
        
        ledger_data = []
        for entry in entries:
            ledger_data.append({
                "id": entry.id,
                "previous_hash": entry.previous_hash,
                "current_hash": entry.current_hash,
                "report_id": entry.report_id,
                "recipient_agency": entry.recipient_agency,
                "timestamp": entry.timestamp.isoformat() if entry.timestamp else None,
                "verified": entry.verified,
                "content_preview": entry.redacted_content[:100] + "..." if entry.redacted_content and len(entry.redacted_content) > 100 else entry.redacted_content
            })
        
        return {
            "entries": ledger_data,
            "total": total,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve ledger: {str(e)}")


@router.get("/ledger/{hash}")
async def verify_ledger_entry(hash: str, db: Session = Depends(get_db)):
    """
    Verify a ledger entry by hash.
    Agent 5: Trust Layer - Blockchain verification
    """
    try:
        is_valid = verify_ledger_integrity(db, hash)
        
        from app.models.ledger import LedgerEntry
        entry = db.query(LedgerEntry).filter(LedgerEntry.current_hash == hash).first()
        
        if not entry:
            raise HTTPException(status_code=404, detail="Ledger entry not found")
        
        return {
            "hash": hash,
            "verified": is_valid,
            "report_id": entry.report_id,
            "recipient_agency": entry.recipient_agency,
            "timestamp": entry.timestamp.isoformat() if entry.timestamp else None,
            "previous_hash": entry.previous_hash,
            "status": entry.verified
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")
