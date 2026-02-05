"""
Admin Router
Admin-only endpoints for user management, system config, and audit logs
"""
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

from app.auth import get_current_active_user, require_role
from app.models.database import get_db
from app.models.user import User
from app.models.audit import AuditLog
from app.services.audit import audit
from app.authz import authz

router = APIRouter()


# ============================================
# Schemas
# ============================================

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserApproval(BaseModel):
    status: str  # approved, rejected
    reason: Optional[str] = None


class AuthzRule(BaseModel):
    path: str
    method: str
    roles: List[str]


# ============================================
# User Management Endpoints
# ============================================

@router.get("/users", response_model=List[UserResponse])
async def list_users(
    status: Optional[str] = None,
    role: Optional[str] = None,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    List all users with optional filters
    Admin only
    """
    query = db.query(User)
    
    if status:
        query = query.filter(User.status == status)
    
    if role:
        query = query.filter(User.role == role)
    
    users = query.all()
    return users


@router.get("/users/pending", response_model=List[UserResponse])
async def list_pending_users(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Get all pending user registrations
    Admin only
    """
    pending_users = db.query(User).filter(User.status == "pending").all()
    return pending_users


@router.post("/users/{user_id}/approve")
async def approve_user(
    user_id: int,
    approval: UserApproval,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Approve or reject a pending user
    Admin only
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User is already {user.status}"
        )
    
    # Update user status
    user.status = approval.status
    user.is_active = (approval.status == "approved")
    
    db.commit()
    db.refresh(user)
    
    # Log the action
    await audit.log_user_action(
        action=f"user.{approval.status}",
        actor={"id": current_user.id, "email": current_user.email, "role": current_user.role},
        target_type="user",
        target_id=user.id,
        details={
            "target_email": user.email,
            "reason": approval.reason
        },
        db=db
    )
    
    return {
        "message": f"User {approval.status}",
        "user": UserResponse.from_orm(user)
    }


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Delete a user
    Admin only
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Log before deleting
    await audit.log_user_action(
        action="user.delete",
        actor={"id": current_user.id, "email": current_user.email, "role": current_user.role},
        target_type="user",
        target_id=user.id,
        details={"target_email": user.email},
        db=db
    )
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}


# ============================================
# Audit Log Endpoints
# ============================================

@router.get("/audit")
async def get_audit_logs(
    user_email: Optional[str] = None,
    method: Optional[str] = None,
    endpoint: Optional[str] = None,
    event_type: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Query audit logs with filters
    Admin only
    """
    logs = audit.query_logs(
        db=db,
        user_email=user_email,
        method=method,
        endpoint=endpoint,
        event_type=event_type,
        limit=limit,
        offset=offset
    )
    
    return {
        "total": len(logs),
        "logs": [
            {
                "id": log.id,
                "timestamp": log.timestamp,
                "method": log.method,
                "endpoint": log.endpoint,
                "user_email": log.user_email,
                "user_role": log.user_role,
                "response_status": log.response_status,
                "response_time_ms": log.response_time_ms,
                "ip_address": log.ip_address,
                "event_type": log.event_type,
            }
            for log in logs
        ]
    }


@router.get("/audit/export")
async def export_audit_logs(
    user_email: Optional[str] = None,
    method: Optional[str] = None,
    endpoint: Optional[str] = None,
    event_type: Optional[str] = None,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Export audit logs to CSV
    Admin only
    """
    logs = audit.query_logs(
        db=db,
        user_email=user_email,
        method=method,
        endpoint=endpoint,
        event_type=event_type,
        limit=10000  # Max export
    )
    
    csv_data = audit.export_to_csv(logs)
    
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=audit_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    )


@router.get("/audit/security")
async def get_security_events(
    hours: int = 24,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Get recent security-related events
    Admin only
    """
    events = audit.get_security_events(db=db, hours=hours)
    
    return {
        "total": len(events),
        "events": [
            {
                "timestamp": event.timestamp,
                "method": event.method,
                "endpoint": event.endpoint,
                "user_email": event.user_email,
                "response_status": event.response_status,
                "ip_address": event.ip_address,
                "event_type": event.event_type,
            }
            for event in events
        ]
    }


# ============================================
# Authorization Rules Management
# ============================================

@router.get("/authz/rules")
async def get_authorization_rules(
    current_user: User = Depends(require_role(["admin"]))
):
    """
    Get all authorization rules
    Admin only
    """
    return authz.get_all_rules()


@router.post("/authz/rules")
async def add_authorization_rule(
    rule: AuthzRule,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Add new authorization rule
    Admin only
    """
    authz.add_rule(rule.path, rule.method, rule.roles)
    
    # Log the change
    await audit.log_user_action(
        action="authz.rule.add",
        actor={"id": current_user.id, "email": current_user.email, "role": current_user.role},
        details={
            "path": rule.path,
            "method": rule.method,
            "roles": rule.roles
        },
        db=db
    )
    
    return {"message": "Authorization rule added successfully"}


@router.delete("/authz/rules")
async def remove_authorization_rule(
    path: str,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Remove authorization rule
    Admin only
    """
    authz.remove_rule(path)
    
    # Log the change
    await audit.log_user_action(
        action="authz.rule.remove",
        actor={"id": current_user.id, "email": current_user.email, "role": current_user.role},
        details={"path": path},
        db=db
    )
    
    return {"message": "Authorization rule removed successfully"}


@router.post("/authz/reload")
async def reload_authorization_rules(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Reload authorization rules from file
    Admin only
    """
    authz.reload_rules()
    
    # Log the reload
    await audit.log_user_action(
        action="authz.reload",
        actor={"id": current_user.id, "email": current_user.email, "role": current_user.role},
        db=db
    )
    
    return {"message": "Authorization rules reloaded successfully"}

