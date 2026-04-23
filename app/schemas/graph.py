"""
Graph Schemas - Pydantic
Node and Edge schemas for Neo4j graph visualization
"""
from pydantic import BaseModel
from typing import Optional, List


class GraphNode(BaseModel):
    """Graph node representation"""
    id: str
    label: str
    type: str  # User, Post, Narrative, IP_Address, PATIENT_ZERO, COMMUNITY
    severity: Optional[str] = None   # critical | medium | low
    platform: Optional[str] = None
    caption: Optional[str] = None  # one-line intel / role for UI
    risk_score: Optional[float] = None
    properties: Optional[dict] = None


class GraphEdge(BaseModel):
    """Graph edge representation"""
    source: str
    target: str
    relationship: str  # POSTED, SIMILAR_TO, INTERACTED_WITH
    properties: Optional[dict] = None


class GraphResponse(BaseModel):
    """Graph visualization response"""
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    stats: Optional[dict] = None


class NetworkQuery(BaseModel):
    """Query parameters for graph exploration"""
    node_id: Optional[str] = None
    relationship_type: Optional[str] = None
    depth: int = 2
    limit: int = 100

