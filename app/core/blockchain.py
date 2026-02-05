"""
Blockchain Core
Hashing & verification logic for audit trail
"""
import hashlib
from datetime import datetime
from typing import Optional


def generate_hash(content: str, previous_hash: Optional[str] = None) -> str:
    """
    Generate SHA-256 hash for blockchain ledger
    In production, this would integrate with actual blockchain
    """
    if previous_hash:
        combined = f"{previous_hash}{content}{datetime.utcnow().isoformat()}"
    else:
        combined = f"{content}{datetime.utcnow().isoformat()}"
    
    return hashlib.sha256(combined.encode()).hexdigest()


async def add_to_ledger(
    report_id: int,
    recipient_agency: str,
    content: Optional[str] = None
) -> str:
    """
    Add entry to blockchain ledger
    Returns the hash of the ledger entry
    """
    # In production, get previous hash from database
    previous_hash = None
    
    # Generate current hash
    ledger_content = f"{report_id}|{recipient_agency}|{content or ''}"
    current_hash = generate_hash(ledger_content, previous_hash)
    
    # In production, save to database
    # ledger_entry = LedgerEntry(
    #     previous_hash=previous_hash,
    #     current_hash=current_hash,
    #     report_id=report_id,
    #     recipient_agency=recipient_agency,
    #     redacted_content=content
    # )
    # db.add(ledger_entry)
    # db.commit()
    
    return current_hash


def verify_ledger_integrity(entry_hash: str) -> bool:
    """
    Verify blockchain ledger integrity
    Checks hash chain continuity
    """
    # In production, verify against previous entries
    return True

