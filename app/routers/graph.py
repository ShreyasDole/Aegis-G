from fastapi import APIRouter, HTTPException
from app.schemas.graph import GraphResponse, NetworkQuery
from app.services.graph.neo4j import neo4j_service

router = APIRouter()

def _normalize_edges(edges: list) -> list:
    """Ensure each edge has 'relationship' for GraphResponse schema."""
    return [
        {"source": e["source"], "target": e["target"], "relationship": e.get("type") or e.get("relationship") or "RELATED"}
        for e in edges
    ]


@router.get("", response_model=GraphResponse)
@router.get("/", response_model=GraphResponse)
async def get_network(limit: int = 100):
    try:
        data = await neo4j_service.get_network(limit=limit)
        edges = _normalize_edges(data.get("edges", []))
        return GraphResponse(nodes=data["nodes"], edges=edges)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/campaign/{root_id}", response_model=GraphResponse)
async def get_campaign_view(root_id: str):
    """Get the propagation tree for a specific campaign origin (Source -> Botnet -> Targets)."""
    try:
        data = await neo4j_service.get_campaign_lineage(root_id)
        edges = _normalize_edges(data.get("edges", []))
        return GraphResponse(nodes=data["nodes"], edges=edges)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/clusters")
async def get_bot_clusters():
    try:
        clusters = await neo4j_service.detect_clusters()
        return {"clusters": clusters}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pagerank")
async def get_influencers(limit: int = 20):
    """Get top influencers using PageRank algorithm"""
    try:
        influencers = await neo4j_service.calculate_page_rank(limit=limit)
        return {"influencers": influencers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
