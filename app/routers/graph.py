from fastapi import APIRouter, HTTPException
from app.schemas.graph import GraphResponse, NetworkQuery
from app.services.graph.neo4j import neo4j_service

router = APIRouter()

@router.get("/", response_model=GraphResponse)
async def get_network(limit: int = 100):
    try:
        data = await neo4j_service.get_network(limit=limit)
        return GraphResponse(nodes=data["nodes"], edges=data["edges"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/campaign/{root_id}", response_model=GraphResponse)
async def get_campaign_view(root_id: str):
    """Get the propagation tree for a specific campaign origin"""
    try:
        data = await neo4j_service.get_campaign_lineage(root_id)
        return GraphResponse(nodes=data["nodes"], edges=data["edges"])
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
