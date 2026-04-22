from fastapi import APIRouter, HTTPException
from app.schemas.graph import GraphResponse, NetworkQuery
from app.services.graph.neo4j import neo4j_service

router = APIRouter()

def _normalize_edges(edges: list) -> list:
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
    try:
        influencers = await neo4j_service.calculate_page_rank(limit=limit)
        return {"influencers": influencers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/patient-zero/{content_hash}")
async def trace_patient_zero(content_hash: str):
    """
    Temporal Patient Zero Identification.
    Traverses SHARED/REPOSTED relationships backwards to find the C2 origin.
    """
    try:
        result = await neo4j_service.find_patient_zero(content_hash)
        if result.get("status") == "not_found":
            raise HTTPException(status_code=404, detail="No origin found for this content hash")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/seed")
async def seed_demo_graph():
    """
    Inject astroturfing demo data into Neo4j:
    Patient Zero (c2_master) + 5 bot agents + SHARED/REPOSTED/SIMILAR_TO edges.
    Call this once before presenting the demo.
    """
    try:
        summary = await neo4j_service.seed_demo_data()
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
