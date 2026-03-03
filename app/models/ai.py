"""
AI Policy Model
Natural language business rules translated to executable logic
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey
from sqlalchemy.sql import func
from app.models.database import Base


class AIPolicy(Base):
    __tablename__ = "ai_policies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Policy content
    policy_type = Column(String(20), nullable=False, index=True)  # logical, natural
    content = Column(Text, nullable=False)  # Original policy
    translated_dsl = Column(Text, nullable=True)  # AI-translated DSL (if natural language)
    
    # Organization
    category = Column(String(50), nullable=True, index=True)  # finance, security, hr, etc.
    priority = Column(Integer, default=1, index=True)  # 1-10
    
    # Status
    is_active = Column(Boolean, default=True, index=True)
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<AIPolicy {self.name} ({self.policy_type})>"


class AIInsight(Base):
    __tablename__ = "ai_insights"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=False)
    
    # Classification
    severity = Column(String(20), nullable=False, index=True)  # critical, warning, recommendation
    category = Column(String(50), nullable=False, index=True)
    
    # Actions
    suggested_actions = Column(Text, nullable=False)  # JSON array of strings
    impact_estimate = Column(String(200), nullable=True)
    
    # Source
    data_source = Column(String(100), nullable=True)  # What data was analyzed
    confidence_score = Column(Float, nullable=False)  # 0.0 - 1.0
    
    # Status
    viewed = Column(Boolean, default=False, index=True)
    dismissed = Column(Boolean, default=False, index=True)
    dismissed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    dismissed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    def __repr__(self):
        return f"<AIInsight {self.title} ({self.severity})>"


class BlockedContent(Base):
    """
    Blocked Content Log - Agent 4 (Policy Guardian) enforcement records
    Tracks all content blocked by active policies
    """
    __tablename__ = "blocked_content"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Content details
    content_hash = Column(String(64), nullable=False, index=True)  # SHA256 hash of content
    content_preview = Column(Text, nullable=True)  # First 500 chars for logging
    source_platform = Column(String(50), nullable=True)
    source_username = Column(String(200), nullable=True)
    
    # Policy that triggered the block
    policy_id = Column(Integer, ForeignKey("ai_policies.id"), nullable=False, index=True)
    policy_name = Column(String(200), nullable=False)
    rule_name = Column(String(100), nullable=True)  # e.g., "rule_04.aegis"
    
    # Enforcement details
    dsl_logic = Column(Text, nullable=True)  # The DSL rule that was executed
    matched_conditions = Column(Text, nullable=True)  # JSON array of matched conditions
    action_taken = Column(String(50), nullable=False)  # BLOCK_AND_LOG, FLAG_THREAT, etc.
    
    # Context data
    ai_score = Column(Float, nullable=True)  # Forensic score from Agent 1
    graph_cluster_size = Column(Integer, nullable=True)  # From Agent 2
    narrative_keywords = Column(Text, nullable=True)  # Detected narrative keywords
    
    # Metadata
    blocked_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    def __repr__(self):
        return f"<BlockedContent {self.content_hash[:8]}... by {self.policy_name}>"
