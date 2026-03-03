"""
Intelligence Schemas - Pydantic
Structured output schemas for Agent 3 (Intelligence Analyst)
"""
from pydantic import BaseModel, Field
from typing import List, Literal, Optional


class EvidenceArtifact(BaseModel):
    """Evidence artifact from Agent 1 (Forensics) or Agent 2 (Graph)"""
    source: str = Field(description="Agent 1 (Forensics) or Agent 2 (Graph)")
    finding: str = Field(description="The specific discovery (e.g., 'Low Burstiness detected')")
    weight: float = Field(description="Confidence weight 0.0 to 1.0")


class ActionStep(BaseModel):
    """Actionable recommendation step"""
    action: str = Field(description="Clear instruction (e.g., 'Escalate to CISA')")
    priority: Literal["Immediate", "High", "Routine"] = Field(description="Priority level")


class IntelligenceReport(BaseModel):
    """Structured intelligence report from Agent 3"""
    threat_title: str = Field(description="A concise name for this threat")
    executive_summary: str = Field(description="High-level brief for leadership")
    threat_type: Literal["Phishing", "Disinformation", "Botnet", "Human Error", "Compromised Account"] = Field(
        description="Classification of the threat"
    )
    risk_level: Literal["Critical", "High", "Medium", "Low"] = Field(
        description="Overall risk assessment"
    )
    confidence: float = Field(ge=0, le=1, description="Confidence score 0.0 to 1.0")
    evidence: List[EvidenceArtifact] = Field(description="List of evidence artifacts")
    recommendations: List[ActionStep] = Field(description="Actionable recommendations")


class FusionRequest(BaseModel):
    """Request schema for intelligence fusion"""
    threat_id: int = Field(description="Threat ID for this analysis")
    content: str = Field(description="Original content text")
    forensic_data: dict = Field(description="Data from Agent 1 (Forensics)")
    graph_data: dict = Field(description="Data from Agent 2 (Graph)")

