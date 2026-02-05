"""
Graph Router
Neo4j graph queries and network analysis
"""
from fastapi import APIRouter, HTTPException
from app.schemas.graph import GraphResponse, NetworkQuery, GraphNode
from app.services.graph.neo4j import Neo4jService

router = APIRouter()


@router.get("/", response_model=GraphResponse)
async def get_network(query: NetworkQuery = None):
    """
    Get graph network visualization data
    Returns nodes and edges for visualization
    """
    try:
        neo4j_service = Neo4jService()
        
        if query and query.node_id:
            # Get subgraph around specific node
            graph_data = await neo4j_service.get_subgraph(
                node_id=query.node_id,
                depth=query.depth,
                limit=query.limit
            )
        else:
            # Get full network
            graph_data = await neo4j_service.get_network(limit=query.limit if query else 100)
        
        return GraphResponse(
            nodes=graph_data.get("nodes", []),
            edges=graph_data.get("edges", []),
            stats=graph_data.get("stats", {})
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Graph query failed: {str(e)}")


@router.get("/clusters")
async def get_bot_clusters():
    """Identify bot clusters in the network"""
    try:
        neo4j_service = Neo4jService()
        clusters = await neo4j_service.detect_clusters()
        return {"clusters": clusters}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cluster detection failed: {str(e)}")


@router.post("/nodes")
async def create_node(node: GraphNode):
    """Create a new node in the graph"""
    try:
        neo4j_service = Neo4jService()
        result = await neo4j_service.create_node(node)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Node creation failed: {str(e)}")

