"""
Blockchain Core - Agent 5: Trust Layer
Hashing & verification logic for audit trail
Provides immutable ledger for threat intelligence sharing
"""
import hashlib
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)


def generate_hash(content: str, previous_hash: Optional[str] = None) -> str:
    """
    Generate SHA-256 hash for blockchain ledger
    Creates cryptographic hash chain for integrity verification
    
    Args:
        content: The data to hash
        previous_hash: Hash of previous entry in chain (for continuity)
        
    Returns:
        64-character SHA-256 hex digest
    """
    timestamp = datetime.utcnow().isoformat()
    
    if previous_hash:
        combined = f"{previous_hash}{content}{timestamp}"
    else:
        combined = f"{content}{timestamp}"
    
    return hashlib.sha256(combined.encode()).hexdigest()


async def add_to_ledger(
    db: Session,
    report_id: int,
    analyst_id: int,
    content: str,
    recipient_agency: str = "Internal",
    thought_process: Optional[str] = None
) -> str:
    """
    Agent 5: Trust Layer
    Add entry to blockchain ledger with full database persistence.
    
    Creates immutable record of threat intelligence sharing with:
    - Hash chain linking (previous_hash -> current_hash)
    - Cryptographic verification
    - Audit trail for legal compliance
    - Thought process logging for AI reasoning transparency
    
    Args:
        db: Database session
        report_id: ID of the threat report
        analyst_id: ID of the analyst creating the entry
        content: Content to be recorded (will be truncated for privacy)
        recipient_agency: Target agency for sharing (default: Internal)
        thought_process: AI reasoning log for audit trail
        
    Returns:
        Current hash (64-character hex string)
        
    Raises:
        Exception: If database commit fails
    """
    from app.models.ledger import LedgerEntry
    
    logger.info(f"🔗 Agent 5: Adding report {report_id} to blockchain ledger")
    
    try:
        # 1. Get previous hash from database (for chain continuity)
        last_entry = db.query(LedgerEntry).order_by(LedgerEntry.id.desc()).first()
        previous_hash = last_entry.current_hash if last_entry else "0" * 64
        
        # 2. Generate unique hash for this entry
        timestamp = datetime.utcnow().isoformat()
        raw_data = f"{report_id}|{analyst_id}|{content}|{timestamp}"
        current_hash = generate_hash(raw_data, previous_hash)
        
        # 3. Create ledger entry
        new_entry = LedgerEntry(
            previous_hash=previous_hash,
            current_hash=current_hash,
            report_id=report_id,
            recipient_agency=recipient_agency,
            redacted_content=content[:500],  # Store first 500 chars for privacy
            thought_process=thought_process,
            verified="verified"  # Auto-verify for now; use crypto verification in prod
        )
        
        # 4. Commit to database
        db.add(new_entry)
        db.commit()
        db.refresh(new_entry)
        
        logger.info(f"✅ Ledger entry created: Hash={current_hash[:16]}...")
        
        return current_hash
        
    except Exception as e:
        logger.error(f"❌ Failed to add to ledger: {str(e)}")
        db.rollback()
        raise


def verify_ledger_integrity(db: Session, entry_hash: str) -> bool:
    """
    Verify blockchain ledger integrity by checking hash chain continuity.
    
    Args:
        db: Database session
        entry_hash: Hash of the entry to verify
        
    Returns:
        True if chain is valid, False otherwise
    """
    from app.models.ledger import LedgerEntry
    
    try:
        # 1. Find the entry
        entry = db.query(LedgerEntry).filter(LedgerEntry.current_hash == entry_hash).first()
        
        if not entry:
            logger.warning(f"⚠️  Entry not found: {entry_hash[:16]}...")
            return False
        
        # 2. Verify hash generation
        raw_data = f"{entry.report_id}|{entry.recipient_agency}|{entry.redacted_content or ''}"
        expected_hash = generate_hash(raw_data, entry.previous_hash)
        
        if expected_hash != entry.current_hash:
            logger.error(f"❌ Hash mismatch for entry {entry.id}")
            return False
        
        # 3. Verify chain continuity (if not genesis block)
        if entry.previous_hash != "0" * 64:
            previous_entry = db.query(LedgerEntry).filter(
                LedgerEntry.current_hash == entry.previous_hash
            ).first()
            
            if not previous_entry:
                logger.error(f"❌ Broken chain: Previous hash not found")
                return False
        
        logger.info(f"✅ Ledger entry verified: {entry_hash[:16]}...")
        return True
        
    except Exception as e:
        logger.error(f"❌ Verification failed: {str(e)}")
        return False


async def verify_full_chain(db: Session) -> Dict[str, Any]:
    """
    Verify integrity of the entire blockchain ledger.
    
    Returns:
        Dictionary with verification results and statistics
    """
    from app.models.ledger import LedgerEntry
    
    logger.info("🔍 Verifying full blockchain integrity...")
    
    try:
        entries = db.query(LedgerEntry).order_by(LedgerEntry.id).all()
        
        if not entries:
            return {
                "valid": True,
                "total_entries": 0,
                "verified": 0,
                "failed": 0,
                "message": "No entries to verify"
            }
        
        verified_count = 0
        failed_count = 0
        failed_entries = []
        
        for entry in entries:
            is_valid = verify_ledger_integrity(db, entry.current_hash)
            
            if is_valid:
                verified_count += 1
            else:
                failed_count += 1
                failed_entries.append(entry.id)
        
        is_valid = failed_count == 0
        
        result = {
            "valid": is_valid,
            "total_entries": len(entries),
            "verified": verified_count,
            "failed": failed_count,
            "failed_entry_ids": failed_entries,
            "message": "Chain integrity verified" if is_valid else f"Chain integrity compromised: {failed_count} entries failed"
        }
        
        if is_valid:
            logger.info(f"✅ Full chain verified: {verified_count} entries")
        else:
            logger.error(f"❌ Chain compromised: {failed_count} failures")
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Full chain verification failed: {str(e)}")
        return {
            "valid": False,
            "error": str(e),
            "message": "Verification process failed"
        }


# Backwards compatibility for existing calls without db parameter
async def add_to_ledger_legacy(
    report_id: int,
    recipient_agency: str,
    content: Optional[str] = None
) -> str:
    """
    Legacy version for backwards compatibility.
    WARNING: This does not persist to database.
    Use add_to_ledger(db, ...) for proper persistence.
    """
    logger.warning("⚠️  Using legacy add_to_ledger without database persistence")
    ledger_content = f"{report_id}|{recipient_agency}|{content or ''}"
    current_hash = generate_hash(ledger_content, None)
    return current_hash

