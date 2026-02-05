"""
Audit Service
Comprehensive logging system for requests, user actions, and security events
"""
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from fastapi import Request, Response
from app.models.audit import AuditLog
from app.models.database import get_db
import logging
import re

logger = logging.getLogger(__name__)


class AuditService:
    """Service for logging and querying audit events"""
    
    # Sensitive fields to mask in logs
    SENSITIVE_FIELDS = [
        "password", "token", "secret", "api_key", "apikey",
        "authorization", "auth", "credit_card", "ssn"
    ]
    
    # Endpoints to skip logging (too noisy)
    SKIP_ENDPOINTS = [
        "/health", "/docs", "/redoc", "/openapi.json", "/favicon.ico"
    ]
    
    @staticmethod
    def mask_sensitive_data(data: Any) -> Any:
        """Recursively mask sensitive fields in dict/list"""
        if isinstance(data, dict):
            masked = {}
            for key, value in data.items():
                if any(sensitive in key.lower() for sensitive in AuditService.SENSITIVE_FIELDS):
                    masked[key] = "***REDACTED***"
                else:
                    masked[key] = AuditService.mask_sensitive_data(value)
            return masked
        elif isinstance(data, list):
            return [AuditService.mask_sensitive_data(item) for item in data]
        else:
            return data
    
    @staticmethod
    async def log_request(
        request: Request,
        response: Response,
        response_time_ms: int,
        db: Session,
        user: Optional[Dict] = None
    ):
        """
        Automatically log API request/response
        Called by middleware
        """
        # Skip noisy endpoints
        if request.url.path in AuditService.SKIP_ENDPOINTS:
            return
        
        # Parse query params
        query_params = dict(request.query_params) if request.query_params else None
        
        # Get request body (if exists)
        request_body = None
        try:
            if request.method in ["POST", "PUT", "PATCH"]:
                # Read body from state (set by middleware)
                body = getattr(request.state, "body", None)
                if body:
                    request_body = json.dumps(AuditService.mask_sensitive_data(json.loads(body)))
        except Exception:
            pass
        
        # Create audit log
        audit_log = AuditLog(
            method=request.method,
            endpoint=request.url.path,
            query_params=query_params,
            user_id=user.get("id") if user else None,
            user_email=user.get("email") if user else None,
            user_role=user.get("role") if user else None,
            request_body=request_body,
            response_status=response.status_code,
            response_time_ms=response_time_ms,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
        
        try:
            db.add(audit_log)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to log audit: {e}")
            db.rollback()
    
    @staticmethod
    async def log_user_action(
        action: str,
        actor: Dict,
        db: Session,
        target_type: Optional[str] = None,
        target_id: Optional[int] = None,
        details: Optional[Dict] = None,
        request: Optional[Request] = None
    ):
        """
        Log custom business event
        
        Usage:
            await audit.log_user_action(
                action="user.approve",
                actor=current_user,
                target_type="user",
                target_id=123,
                details={"reason": "Verified email domain"},
                db=db
            )
        """
        audit_log = AuditLog(
            method="EVENT",
            endpoint=f"/event/{action}",
            user_id=actor.get("id"),
            user_email=actor.get("email"),
            user_role=actor.get("role"),
            event_type=action,
            event_details=AuditService.mask_sensitive_data(details) if details else None,
            target_type=target_type,
            target_id=target_id,
            ip_address=request.client.host if request and request.client else None,
            user_agent=request.headers.get("user-agent") if request else None,
        )
        
        try:
            db.add(audit_log)
            db.commit()
            logger.info(f"Audit: {action} by {actor.get('email')} on {target_type}#{target_id}")
        except Exception as e:
            logger.error(f"Failed to log user action: {e}")
            db.rollback()
    
    @staticmethod
    def query_logs(
        db: Session,
        user_id: Optional[int] = None,
        user_email: Optional[str] = None,
        method: Optional[str] = None,
        endpoint: Optional[str] = None,
        event_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[AuditLog]:
        """Query audit logs with filters"""
        query = db.query(AuditLog)
        
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        
        if user_email:
            query = query.filter(AuditLog.user_email.ilike(f"%{user_email}%"))
        
        if method:
            query = query.filter(AuditLog.method == method)
        
        if endpoint:
            query = query.filter(AuditLog.endpoint.ilike(f"%{endpoint}%"))
        
        if event_type:
            query = query.filter(AuditLog.event_type == event_type)
        
        if start_date:
            query = query.filter(AuditLog.timestamp >= start_date)
        
        if end_date:
            query = query.filter(AuditLog.timestamp <= end_date)
        
        query = query.order_by(desc(AuditLog.timestamp))
        query = query.limit(limit).offset(offset)
        
        return query.all()
    
    @staticmethod
    def get_user_activity(db: Session, user_id: int, days: int = 30) -> List[AuditLog]:
        """Get recent activity for a user"""
        since = datetime.utcnow() - timedelta(days=days)
        return db.query(AuditLog)\
            .filter(AuditLog.user_id == user_id)\
            .filter(AuditLog.timestamp >= since)\
            .order_by(desc(AuditLog.timestamp))\
            .limit(100)\
            .all()
    
    @staticmethod
    def get_security_events(db: Session, hours: int = 24) -> List[AuditLog]:
        """Get recent security-related events"""
        since = datetime.utcnow() - timedelta(hours=hours)
        return db.query(AuditLog)\
            .filter(AuditLog.timestamp >= since)\
            .filter(or_(
                AuditLog.response_status == 401,
                AuditLog.response_status == 403,
                AuditLog.event_type.ilike("%login%"),
                AuditLog.event_type.ilike("%auth%"),
                AuditLog.event_type.ilike("%security%")
            ))\
            .order_by(desc(AuditLog.timestamp))\
            .limit(100)\
            .all()
    
    @staticmethod
    def export_to_csv(logs: List[AuditLog]) -> str:
        """Export audit logs to CSV format"""
        import csv
        from io import StringIO
        
        output = StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            "Timestamp", "Method", "Endpoint", "User Email", "User Role",
            "Status", "Response Time (ms)", "IP Address", "Event Type"
        ])
        
        # Data
        for log in logs:
            writer.writerow([
                log.timestamp.isoformat() if log.timestamp else "",
                log.method,
                log.endpoint,
                log.user_email or "anonymous",
                log.user_role or "",
                log.response_status or "",
                log.response_time_ms or "",
                log.ip_address or "",
                log.event_type or ""
            ])
        
        return output.getvalue()


# Global instance
audit = AuditService()

