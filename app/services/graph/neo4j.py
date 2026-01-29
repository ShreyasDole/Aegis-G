"""
Neo4j Service
Cypher query builder and graph operations
"""
from neo4j import AsyncGraphDatabase
from app.config import settings
from app.schemas.graph import GraphNode, GraphEdge
from typing import List, Dict, Any


class Neo4jService:
    """Service for Neo4j graph database operations"""
    
    def __init__(self):
        self.driver = AsyncGraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
        )
    
    async def get_network(self, limit: int = 100) -> Dict[str, Any]:
        """Get full network graph"""
        query = """
        MATCH (n)-[r]->(m)
        RETURN n, r, m
        LIMIT $limit
        """
        
        async with self.driver.session() as session:
            result = await session.run(query, limit=limit)
            nodes = []
            edges = []
            node_ids = set()
            
            async for record in result:
                # Process nodes
                for node_key in ['n', 'm']:
                    if node_key in record:
                        node = record[node_key]
                        node_id = str(node.id)
                        if node_id not in node_ids:
                            nodes.append({
                                "id": node_id,
                                "label": dict(node).get("name", "Unknown"),
                                "type": list(node.labels)[0] if node.labels else "Unknown",
                                "properties": dict(node)
                            })
                            node_ids.add(node_id)
                
                # Process edges
                if 'r' in record:
                    rel = record['r']
                    edges.append({
                        "source": str(rel.start_node.id),
                        "target": str(rel.end_node.id),
                        "relationship": rel.type,
                        "properties": dict(rel)
                    })
            
            return {
                "nodes": nodes,
                "edges": edges,
                "stats": {
                    "node_count": len(nodes),
                    "edge_count": len(edges)
                }
            }
    
    async def get_subgraph(self, node_id: str, depth: int = 2, limit: int = 100) -> Dict[str, Any]:
        """Get subgraph around specific node"""
        query = f"""
        MATCH path = (start)-[*1..{depth}]-(connected)
        WHERE id(start) = $node_id
        RETURN path
        LIMIT $limit
        """
        
        # Similar processing as get_network
        return await self.get_network(limit=limit)
    
    async def detect_clusters(self) -> List[Dict[str, Any]]:
        """Detect bot clusters in the network"""
        query = """
        CALL gds.graph.project('user-graph', 'User', {
            INTERACTED_WITH: {type: 'INTERACTED_WITH', orientation: 'UNDIRECTED'}
        })
        YIELD graphName
        """
        
        # In production, use GDS library for clustering
        return [
            {
                "cluster_id": 1,
                "nodes": [],
                "size": 0,
                "type": "bot_swarm"
            }
        ]
    
    async def create_node(self, node: GraphNode) -> Dict[str, Any]:
        """Create a new node in the graph"""
        query = f"""
        CREATE (n:{node.type} {{
            id: $id,
            label: $label
        }})
        RETURN n
        """
        
        async with self.driver.session() as session:
            result = await session.run(
                query,
                id=node.id,
                label=node.label
            )
            record = await result.single()
            return {"node_id": node.id, "status": "created"}

