"""
AI Router
Endpoints for AI Policies, Insights, and Chat
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json

from app.auth import get_current_active_user, require_role
from app.models.database import get_db
from app.models.user import User
from app.models.ai import AIPolicy, AIInsight
from app.schemas.ai import (
    PolicyCreate, PolicyResponse, PolicyTranslation,
    InsightResponse, InsightCreate,
    ChatRequest, ChatResponse
)
from app.services.ai import policy_service, insight_service, chat_service
from app.services.audit import audit

router = APIRouter()


# ============================================
# AI Policies
# ============================================

@router.post("/policies", response_model=PolicyResponse, status_code=status.HTTP_201_CREATED)
async def create_policy(
    policy_data: PolicyCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new AI policy
    Natural language policies are automatically translated to DSL
    """
    # Translate if natural language
    translated_dsl = None
    if policy_data.policy_type == "natural":
        translation = await policy_service.translate_natural_language_to_dsl(policy_data.content)
        translated_dsl = translation.get("dsl")
    
    # Create policy
    policy = AIPolicy(
        name=policy_data.name,
        description=policy_data.description,
        policy_type=policy_data.policy_type,
        content=policy_data.content,
        translated_dsl=translated_dsl,
        category=policy_data.category,
        priority=policy_data.priority,
        created_by=current_user.id,
        is_active=True
    )
    
    db.add(policy)
    db.commit()
    db.refresh(policy)
    
    # Log action
    await audit.log_user_action(
        action="ai.policy.create",
        actor={"id": current_user.id, "email": current_user.email, "role": current_user.role},
        target_type="ai_policy",
        target_id=policy.id,
        details={"policy_name": policy.name, "policy_type": policy.policy_type},
        db=db
    )
    
    return PolicyResponse.from_orm(policy)


@router.get("/policies", response_model=List[PolicyResponse])
async def list_policies(
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all AI policies with optional filters"""
    query = db.query(AIPolicy)
    
    if category:
        query = query.filter(AIPolicy.category == category)
    
    if is_active is not None:
        query = query.filter(AIPolicy.is_active == is_active)
    
    policies = query.order_by(AIPolicy.priority.desc(), AIPolicy.created_at.desc()).all()
    return policies


@router.get("/policies/{policy_id}", response_model=PolicyResponse)
async def get_policy(
    policy_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific policy"""
    policy = db.query(AIPolicy).filter(AIPolicy.id == policy_id).first()
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
    
    return policy


@router.delete("/policies/{policy_id}")
async def delete_policy(
    policy_id: int,
    current_user: User = Depends(require_role(["admin", "analyst"])),
    db: Session = Depends(get_db)
):
    """Delete a policy"""
    policy = db.query(AIPolicy).filter(AIPolicy.id == policy_id).first()
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
    
    # Log before deleting
    await audit.log_user_action(
        action="ai.policy.delete",
        actor={"id": current_user.id, "email": current_user.email, "role": current_user.role},
        target_type="ai_policy",
        target_id=policy.id,
        details={"policy_name": policy.name},
        db=db
    )
    
    db.delete(policy)
    db.commit()
    
    return {"message": "Policy deleted successfully"}


@router.post("/policies/translate", response_model=PolicyTranslation)
async def translate_policy(
    policy: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Translate natural language policy to DSL
    Useful for preview before creating policy
    """
    translation = await policy_service.translate_natural_language_to_dsl(policy)
    
    return PolicyTranslation(
        original=policy,
        dsl=translation.get("dsl"),
        confidence=translation.get("confidence", 0.0),
        explanation=translation.get("explanation", "")
    )


# ============================================
# AI Insights
# ============================================

@router.get("/insights", response_model=List[InsightResponse])
async def get_insights(
    severity: Optional[str] = None,
    viewed: Optional[bool] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get AI-generated insights"""
    query = db.query(AIInsight)
    
    if severity:
        query = query.filter(AIInsight.severity == severity)
    
    if viewed is not None:
        query = query.filter(AIInsight.viewed == viewed)
    
    query = query.filter(AIInsight.dismissed == False)
    
    insights = query.order_by(AIInsight.created_at.desc()).limit(50).all()
    
    # Convert suggested_actions from JSON string to list
    for insight in insights:
        if isinstance(insight.suggested_actions, str):
            insight.suggested_actions = json.loads(insight.suggested_actions)
    
    return insights


@router.post("/insights/generate")
async def generate_insights(
    current_user: User = Depends(require_role(["admin", "analyst"])),
    db: Session = Depends(get_db)
):
    """
    Generate new insights based on current system data
    Admin/Analyst only
    """
    insights_data = await insight_service.generate_insights(db)
    
    created_insights = []
    for insight_data in insights_data:
        insight = AIInsight(
            title=insight_data["title"],
            description=insight_data["description"],
            severity=insight_data["severity"],
            category=insight_data["category"],
            suggested_actions=json.dumps(insight_data["suggested_actions"]),
            impact_estimate=insight_data.get("impact_estimate"),
            data_source=insight_data.get("data_source", "system_analysis"),
            confidence_score=insight_data["confidence_score"],
        )
        db.add(insight)
        created_insights.append(insight)
    
    db.commit()
    
    # Log action
    await audit.log_user_action(
        action="ai.insights.generate",
        actor={"id": current_user.id, "email": current_user.email, "role": current_user.role},
        details={"count": len(created_insights)},
        db=db
    )
    
    return {
        "message": f"Generated {len(created_insights)} insights",
        "count": len(created_insights)
    }


@router.post("/insights/{insight_id}/dismiss")
async def dismiss_insight(
    insight_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark an insight as dismissed"""
    insight = db.query(AIInsight).filter(AIInsight.id == insight_id).first()
    
    if not insight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insight not found"
        )
    
    insight.dismissed = True
    insight.dismissed_by = current_user.id
    insight.dismissed_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Insight dismissed"}


# ============================================
# AI Chat (Manager)
# ============================================

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Chat with AI Manager
    Context-aware assistant with tool execution
    """
    response = await chat_service.chat(
        message=request.message,
        context=request.context,
        conversation_id=request.conversation_id,
        use_tools=request.use_tools,
        db=db
    )
    
    return ChatResponse(**response)


@router.delete("/chat/{conversation_id}")
async def clear_chat(
    conversation_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Clear chat conversation history"""
    chat_service.clear_conversation(conversation_id)
    return {"message": "Conversation cleared"}

