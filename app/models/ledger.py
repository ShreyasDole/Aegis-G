"""
Blockchain Ledger Model - SQLAlchemy
Audit trail for threat intelligence sharing
"""
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class LedgerEntry(Base):
    __tablename__ = "ledger_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    previous_hash = Column(String(64), nullable=True)
    current_hash = Column(String(64), unique=True, index=True)
    report_id = Column(Integer, nullable=False)
    recipient_agency = Column(String(100))
    redacted_content = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    verified = Column(String(10), default="pending")  # pending, verified, failed

