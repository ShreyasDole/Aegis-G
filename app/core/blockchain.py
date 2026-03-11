"""
Blockchain Core - Production (Agent 5: Trust Layer)
Implements a cryptographically linked ledger (Merkle Chain).
Every block contains the hash of the previous block, making tampering impossible.
Provides immutable ledger for threat intelligence sharing and audit trail.
"""
import hashlib
import json
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.database import SessionLocal
from app.models.ledger import LedgerEntry
import logging

logger = logging.getLogger(__name__)


def calculate_hash(index: int, prev_hash: str, timestamp: str, data: str) -> str:
    """
    SHA-256 Hashing of the block content.
    Creates the cryptographic link between blocks.

    Args:
        index: Block index/number
        prev_hash: Hash of the previous block
        timestamp: ISO format timestamp
        data: JSON string of block data

    Returns:
        64-character hexadecimal hash
    """
    payload = f"{index}{prev_hash}{timestamp}{data}"
    return hashlib.sha256(payload.encode()).hexdigest()


async def add_to_ledger(
    report_id: int,
    recipient_agency: str,
    content: Optional[str] = None,
    db: Optional[Session] = None,
    analyst_id: Optional[int] = None,
    thought_process: Optional[str] = None,
) -> str:
    """
    Mints a new block in the chain.

    Process:
    1. Fetches the last block (genesis if empty).
    2. Links current block to previous hash.
    3. Calculates new hash using previous hash + current data.
    4. Saves to database.

    This creates an immutable chain where:
    - Block N contains hash of Block N-1
    - Changing any block breaks the chain
    - Verification can detect tampering

    Args:
        report_id: ID of the threat intelligence report
        recipient_agency: Agency receiving the intelligence
        content: Redacted content snapshot (optional)
        db: Optional existing session; if None, creates one
        analyst_id: Optional analyst ID for audit
        thought_process: Optional AI reasoning log for audit trail

    Returns:
        Current block hash (64-character hex string)
    """
    own_session = db is None
    db = db or SessionLocal()
    try:
        # 1. Get Last Block (Previous Hash)
        last_block = db.query(LedgerEntry).order_by(desc(LedgerEntry.id)).first()
        
        if last_block:
            previous_hash = last_block.current_hash
            new_index = last_block.id + 1
            logger.debug(f"Linking to previous block #{last_block.id} with hash: {previous_hash[:16]}...")
        else:
            # Genesis Block - First block in the chain
            previous_hash = "0" * 64  # Genesis Block Hash (64 zeros)
            new_index = 1
            logger.info("Creating Genesis Block (first entry in chain)")

        # 2. Prepare Data Payload
        timestamp = datetime.utcnow().isoformat()
        # We hash the critical data: Agency + Report ID + Redacted Content
        payload_dict = {
            "report_id": report_id,
            "agency": recipient_agency,
            "content_snapshot": content[:100] if content else "meta_only",
        }
        if analyst_id is not None:
            payload_dict["analyst_id"] = analyst_id
        if thought_process:
            payload_dict["thought_process"] = thought_process[:200]
        data_payload = json.dumps(payload_dict, sort_keys=True)

        # 3. Mine the Block (Calculate Hash)
        # This is where the cryptographic link is created
        current_hash = calculate_hash(new_index, previous_hash, timestamp, data_payload)
        
        logger.debug(f"Block #{new_index} hash: {current_hash[:16]}... (linked to {previous_hash[:16]}...)")

        # 4. Persist to Immutable Ledger
        new_entry = LedgerEntry(
            previous_hash=previous_hash,
            current_hash=current_hash,
            report_id=report_id,
            recipient_agency=recipient_agency,
            redacted_content=content,
            thought_process=thought_process,
            timestamp=datetime.utcnow(),
            verified="verified"
        )
        
        db.add(new_entry)
        db.commit()
        db.refresh(new_entry)
        
        logger.info(f"Block #{new_index} added to ledger. Hash: {current_hash[:16]}...")
        
        return current_hash

    except Exception as e:
        db.rollback()
        logger.error(f"Error adding to ledger: {e}")
        raise e
    finally:
        if own_session:
            db.close()


def verify_chain_integrity() -> bool:
    """
    Audits the entire database to ensure no rows have been tampered with.
    
    Process:
    1. Retrieves all blocks in order
    2. For each block (except genesis), verifies:
       - Block.previous_hash == PreviousBlock.current_hash (Link integrity)
       - Re-calculates hash to detect data tampering
    3. Returns True if chain is intact, False if tampering detected
    
    Returns:
        True if chain is valid, False if tampering detected
    """
    db: Session = SessionLocal()
    try:
        chain = db.query(LedgerEntry).order_by(LedgerEntry.id.asc()).all()
        
        if not chain:
            logger.warning("Chain is empty - nothing to verify")
            return True
        
        logger.info(f"Verifying chain integrity for {len(chain)} blocks...")
        
        for i, block in enumerate(chain):
            if i == 0:
                # Genesis block - verify it has the genesis hash
                if block.previous_hash != "0" * 64:
                    logger.error(f"🚨 Genesis block has invalid previous_hash: {block.previous_hash}")
                    return False
                continue
            
            # Get previous block
            prev_block = chain[i - 1]
            
            # Check Link Integrity (Block N must point to Block N-1)
            if block.previous_hash != prev_block.current_hash:
                logger.error(f"🚨 BROKEN CHAIN at Block #{block.id}!")
                logger.error(f"   Expected previous_hash: {prev_block.current_hash[:16]}...")
                logger.error(f"   Found previous_hash: {block.previous_hash[:16]}...")
                return False
            
            # Re-hash check (verify data hasn't been tampered with)
            # Reconstruct the data payload
            timestamp = block.timestamp.isoformat() if hasattr(block.timestamp, 'isoformat') else str(block.timestamp)
            data_payload = json.dumps({
                "report_id": block.report_id,
                "agency": block.recipient_agency,
                "content_snapshot": (block.redacted_content or "")[:100]
            }, sort_keys=True)
            
            # Recalculate hash
            expected_hash = calculate_hash(block.id, block.previous_hash, timestamp, data_payload)
            
            if block.current_hash != expected_hash:
                logger.error(f"🚨 DATA TAMPERING DETECTED at Block #{block.id}!")
                logger.error(f"   Expected hash: {expected_hash[:16]}...")
                logger.error(f"   Found hash: {block.current_hash[:16]}...")
                return False
        
        logger.info("✓ Chain integrity verified - all blocks are valid")
        return True
        
    except Exception as e:
        logger.error(f"Error verifying chain: {e}")
        return False
    finally:
        db.close()


def get_chain_stats() -> Dict[str, Any]:
    """
    Get statistics about the blockchain.
    
    Returns:
        Dictionary with chain statistics
    """
    db: Session = SessionLocal()
    try:
        total_blocks = db.query(LedgerEntry).count()
        latest_block = db.query(LedgerEntry).order_by(desc(LedgerEntry.id)).first()
        
        return {
            "total_blocks": total_blocks,
            "latest_block_id": latest_block.id if latest_block else 0,
            "latest_hash": latest_block.current_hash[:16] + "..." if latest_block else "N/A",
            "genesis_hash": "0" * 64,
            "is_valid": verify_chain_integrity()
        }
    finally:
        db.close()
