"""
AI Schemas
Pydantic models for AI features (Policies, Insights, Chat)
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


# ============================================
# AI Policies
# ============================================

class PolicyType(str, Enum):
    LOGICAL = "logical"  # DSL-based
    NATURAL = "natural"  # Natural language


class PolicyCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    policy_type: PolicyType = PolicyType.NATURAL
    content: str = Field(..., min_length=10)
    category: Optional[str] = None  # e.g., "finance", "security", "hr"
    priority: int = Field(default=1, ge=1, le=10)


class PolicyResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    policy_type: PolicyType
    content: str
    translated_dsl: Optional[str]  # Auto-generated DSL if natural language
    category: Optional[str]
    priority: int
    is_active: bool
    created_by: int  # User ID
    created_at: datetime
    
    class Config:
        from_attributes = True


class PolicyTranslation(BaseModel):
    original: str
    dsl: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    explanation: str


class PolicyGuardianTranslation(BaseModel):
    """Enhanced translation response from Policy Guardian (Agent 4)"""
    rule_name: str
    dsl_logic: str
    safety_score: float = Field(..., ge=0.0, le=1.0)
    edge_cases: List[str] = []
    explanation: str
    ai_reasoning: Optional[str] = None


# ============================================
# AI Insights
# ============================================

class InsightSeverity(str, Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    RECOMMENDATION = "recommendation"


class InsightCreate(BaseModel):
    title: str
    description: str
    severity: InsightSeverity
    category: str
    suggested_actions: List[str]
    data_source: Optional[str] = None
    confidence_score: float = Field(..., ge=0.0, le=1.0)


class InsightResponse(BaseModel):
    id: int
    title: str
    description: str
    severity: InsightSeverity
    category: str
    suggested_actions: List[str]
    impact_estimate: Optional[str]
    data_source: Optional[str]
    confidence_score: float
    created_at: datetime
    viewed: bool = False
    dismissed: bool = False
    
    class Config:
        from_attributes = True


# ============================================
# AI Chat (Manager)
# ============================================

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    context: Optional[Dict[str, Any]] = None  # Current page, selected items, etc.
    conversation_id: Optional[str] = None
    use_tools: bool = True


class ChatResponse(BaseModel):
    message: str
    conversation_id: str
    tool_calls: Optional[List[Dict[str, Any]]] = None
    suggestions: Optional[List[str]] = None  # Quick action buttons


class ToolCall(BaseModel):
    tool_name: str
    parameters: Dict[str, Any]
    result: Any


# ============================================
# AI Analysis
# ============================================

class AnalysisRequest(BaseModel):
    data_type: str  # "threat", "report", "network", etc.
    data_id: Optional[int] = None
    analysis_type: str  # "forensic", "pattern", "risk", etc.
    custom_prompt: Optional[str] = None


class AnalysisResponse(BaseModel):
    analysis_type: str
    summary: str
    findings: List[str]
    risk_level: str
    recommendations: List[str]
    confidence: float
    generated_at: datetime


# ============================================
# Blocked Content (Agent 4)
# ============================================

class BlockedContentResponse(BaseModel):
    id: int
    content_hash: str
    content_preview: Optional[str]
    source_platform: Optional[str]
    source_username: Optional[str]
    policy_id: int
    policy_name: str
    rule_name: Optional[str]
    action_taken: str
    ai_score: Optional[float]
    graph_cluster_size: Optional[int]
    blocked_at: datetime
    
    class Config:
        from_attributes = True


class BlockedContentStats(BaseModel):
    today_count: int
    last_24h_count: int
    last_7d_count: int
    total_count: int
    by_policy: Dict[str, int]  # policy_name -> count
    by_action: Dict[str, int]  # action_taken -> count
    recent_blocks: List[BlockedContentResponse]

