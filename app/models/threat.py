"""
Threat Model - SQLAlchemy
Stores threat reports and analysis results
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.database import Base


class Threat(Base):
    __tablename__ = "threats"
    
    id = Column(Integer, primary_key=True, index=True)
    content_hash = Column(String(64), unique=True, index=True)
    content = Column(Text, nullable=False)
    risk_score = Column(Float, nullable=False)
    source_platform = Column(String(50))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    detected_by = Column(String(50), default="gemini-2.5-flash")
    
    # RAG memory embedding (384-dimensional for local sentence-transformers)
    from pgvector.sqlalchemy import Vector
    embedding = Column(Vector(384))
    
    # Relationships
    reports = relationship("Report", back_populates="threat")


class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    threat_id = Column(Integer, ForeignKey("threats.id"))
    analyst_notes = Column(Text)
    gemini_summary = Column(Text)
    shared_ledger_hash = Column(String(64), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    threat = relationship("Threat", back_populates="reports")

