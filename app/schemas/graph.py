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
    type: str  # User, Post, Narrative, IP_Address
    cluster: Optional[str] = None
    is_patient_zero: Optional[bool] = False
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

