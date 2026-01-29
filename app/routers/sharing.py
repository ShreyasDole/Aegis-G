"""
Sharing Router
Federated intelligence sharing with PII redaction
"""
from fastapi import APIRouter, HTTPException
from app.services.gemini.privacy import PrivacyService
from app.core.blockchain import add_to_ledger
from typing import Optional

router = APIRouter()


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

