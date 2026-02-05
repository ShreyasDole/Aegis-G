"""
Audit Log Model
Tracks all API requests and business events for compliance
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.models.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Timestamp
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Request details
    method = Column(String(10), nullable=False, index=True)  # GET, POST, etc.
    endpoint = Column(String(500), nullable=False, index=True)
    query_params = Column(JSON, nullable=True)
    
    # User details
    user_id = Column(Integer, nullable=True, index=True)
    user_email = Column(String(255), nullable=True, index=True)
    user_role = Column(String(50), nullable=True, index=True)
    
    # Request/Response
    request_body = Column(Text, nullable=True)  # Sensitive data masked
    response_status = Column(Integer, nullable=True, index=True)
    response_time_ms = Column(Integer, nullable=True)
    
    # Client info
    ip_address = Column(String(45), nullable=True, index=True)  # IPv6 support
    user_agent = Column(String(500), nullable=True)
    
    # Business event (if custom logged)
    event_type = Column(String(100), nullable=True, index=True)  # e.g., "user.approve", "threat.detected"
    event_details = Column(JSON, nullable=True)
    
    # Target (for business events)
    target_type = Column(String(50), nullable=True)  # e.g., "user", "threat", "report"
    target_id = Column(Integer, nullable=True)
    
    def __repr__(self):
        return f"<AuditLog {self.method} {self.endpoint} by {self.user_email}>"

