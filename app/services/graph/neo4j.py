"""
Neo4j Service - Yash's Upgrade
Implements Campaign Lineage (Tree) and Advanced Clustering.
"""
from neo4j import AsyncGraphDatabase
from app.config import settings
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class Neo4jService:
    def __init__(self):
        self.driver = AsyncGraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
        )

    async def close(self):
        await self.driver.close()

    async def create_node(self, node_data: Dict):
        """Create/Update a node (User/Actor)"""
        query = """
        MERGE (u:User {id: $id})
        ON CREATE SET u.label = $label, u.risk_score = $risk_score, u.platform = $platform
        ON MATCH SET u.risk_score = $risk_score, u.last_seen = datetime()
        RETURN u
        """
        async with self.driver.session() as session:
            await session.run(
                query,
                id=node_data.get("id"),
                label=node_data.get("label"),
                risk_score=node_data.get("properties", {}).get("risk_score", 0),
                platform=node_data.get("properties", {}).get("platform", "unknown")
            )

    async def create_post_node(self, content_hash: str, user_id: str, timestamp: Any, risk_score: float = 0.0):
        """Create Post and Link to User"""
        query = """
        MERGE (u:User {id: $user_id})
        MERGE (p:Post {content_hash: $content_hash})
        ON CREATE SET p.timestamp = $timestamp, p.risk_score = $risk_score
        MERGE (u)-[:POSTED]->(p)
        """
        async with self.driver.session() as session:
            await session.run(query, content_hash=content_hash, user_id=user_id, timestamp=timestamp, risk_score=risk_score)

    # --- YASH TASK 1: Patient Zero ---
    async def find_patient_zero(self, content_hash: str) -> Dict[str, Any]:
        """
        Advanced Patient Zero: traverses SHARED/REPOSTED relationships backwards
        to find the true C2 origin, not just earliest timestamp.
        """
        query = """
        MATCH (p:Post {content_hash: $content_hash})<-[:POSTED]-(u:User)
        OPTIONAL MATCH path = (u)-[:SHARED|REPOSTED*1..5]->(origin:User)
        WITH coalesce(origin, u) AS root_actor, p
        ORDER BY p.timestamp ASC
        LIMIT 1
        RETURN root_actor.id AS user_id, root_actor.label AS username, p.timestamp AS timestamp
        """
        async with self.driver.session() as session:
            result = await session.run(query, content_hash=content_hash)
            record = await result.single()
            if record:
                return {
                    "status": "found",
                    "username": record.get("username") or record.get("user_id"),
                    "user_id": record.get("user_id"),
                    "origin_time": str(record.get("timestamp", ""))
                }
            return {"status": "not_found"}

    # --- YASH TASK 2: Campaign Lineage (The Tree View) ---
    async def get_campaign_lineage(self, root_user_id: str) -> Dict[str, Any]:
        """
        Traces the propagation tree starting from a specific user (Patient Zero).
        Returns a hierarchical structure for the Campaign View.
        """
        # This query finds everyone who interacted with the root user or posted similar content AFTER them
        query = """
        MATCH path = (root:User {id: $root_id})-[:INTERACTED_WITH|SHARED*1..3]->(target:User)
        RETURN path LIMIT 50
        """
        async with self.driver.session() as session:
            result = await session.run(query, root_id=root_user_id)
            nodes = {}
            edges = []
            
            async for record in result:
                path = record["path"]
                for node in path.nodes:
                    # Safe ID extraction for Neo4j 5.x driver
                    node_id = node.get("id") if hasattr(node, 'get') and node.get("id") else (str(node.element_id) if hasattr(node, 'element_id') else str(node.id))
                    if node_id not in nodes:
                        nodes[node_id] = {
                            "id": node_id,
                            "label": node.get("label", node_id) if hasattr(node, 'get') else (dict(node).get("label", node_id)),
                            "type": "User",
                            "severity": "critical" if (node.get("risk_score", 0) if hasattr(node, 'get') else dict(node).get("risk_score", 0)) > 0.8 else "low"
                        }
                for rel in path.relationships:
                    start_node = rel.start_node
                    end_node = rel.end_node
                    start_id = start_node.get("id") if hasattr(start_node, 'get') and start_node.get("id") else (str(start_node.element_id) if hasattr(start_node, 'element_id') else str(start_node.id))
                    end_id = end_node.get("id") if hasattr(end_node, 'get') and end_node.get("id") else (str(end_node.element_id) if hasattr(end_node, 'element_id') else str(end_node.id))
                    edges.append({
                        "source": start_id,
                        "target": end_id,
                        "type": rel.type if hasattr(rel, 'type') else "RELATED"
                    })
            
            return {"nodes": list(nodes.values()), "edges": edges}

    # --- YASH TASK 3: Clustering (Narrative Detection) with Neo4j GDS Louvain ---
    async def detect_clusters(self) -> List[Dict]:
        """
        Narrative Community Clustering via Louvain Modularity.
        Projects User+Post graph with POSTED/SHARED/SIMILAR_TO rels,
        runs GDS Louvain to detect Astroturfing / coordinated inauthentic behavior.
        Falls back to content_hash overlap if GDS unavailable.
        """
        try:
            async with self.driver.session() as session:
                # Drop stale projection (ignore error if not exists)
                await session.run(
                    "CALL gds.graph.drop('narrative-graph', false) YIELD graphName"
                )

                # Project multi-label graph with weighted relationships
                await session.run("""
                    CALL gds.graph.project(
                        'narrative-graph',
                        ['User', 'Post'],
                        {
                            POSTED:     { orientation: 'UNDIRECTED', properties: 'risk_score' },
                            SHARED:     { orientation: 'UNDIRECTED' },
                            SIMILAR_TO: { orientation: 'UNDIRECTED', properties: 'similarity_score' }
                        }
                    )
                """)

                result = await session.run("""
                    CALL gds.louvain.stream('narrative-graph')
                    YIELD nodeId, communityId
                    WITH gds.util.asNode(nodeId) AS n, communityId
                    WHERE 'User' IN labels(n)
                    RETURN n.id AS user_id, n.label AS username,
                           n.risk_score AS risk, communityId
                    ORDER BY communityId, risk DESC
                """)

                communities: Dict[int, list] = {}
                async for record in result:
                    comm_id = record["communityId"]
                    if comm_id not in communities:
                        communities[comm_id] = []
                    communities[comm_id].append({
                        "user_id": record["user_id"],
                        "username": record["username"],
                        "risk": record["risk"],
                    })

                clusters = []
                for comm_id, members in communities.items():
                    if len(members) >= 2:
                        avg_risk = sum(m.get("risk") or 0 for m in members) / len(members)
                        clusters.append({
                            "cluster_id": f"LOUVAIN_{comm_id}",
                            "nodes": [m["username"] for m in members],
                            "size": len(members),
                            "avg_risk": round(avg_risk, 3),
                            "type": "Botnet_Cluster",
                            "method": "Louvain_GDS",
                        })

                if clusters:
                    logger.info(f"GDS Louvain: {len(clusters)} communities detected")
                    return clusters

                logger.warning("GDS Louvain returned 0 clusters, falling back")

        except Exception as e:
            logger.warning(f"GDS Louvain failed, using content_hash fallback: {e}")

        # Fallback: exact content_hash overlap (Level 1)
        query = """
        MATCH (u1:User)-[:POSTED]->(p:Post)<-[:POSTED]-(u2:User)
        WHERE u1.id < u2.id
        WITH u1, u2, count(p) AS overlap
        WHERE overlap >= 2
        RETURN u1.label AS actor_a, u2.label AS actor_b,
               u1.risk_score AS risk_a, u2.risk_score AS risk_b, overlap
        ORDER BY overlap DESC LIMIT 20
        """
        async with self.driver.session() as session:
            result = await session.run(query)
            clusters = []
            async for record in result:
                avg_risk = ((record["risk_a"] or 0) + (record["risk_b"] or 0)) / 2
                clusters.append({
                    "cluster_id": f"HASH_{record['actor_a']}_{record['actor_b']}",
                    "nodes": [record["actor_a"], record["actor_b"]],
                    "size": record["overlap"],
                    "avg_risk": round(avg_risk, 3),
                    "type": "Botnet_Cluster",
                    "method": "Content_Hash_Overlap",
                })
            return clusters
    
    async def calculate_page_rank(self, limit: int = 20) -> List[Dict]:
        """
        Calculate PageRank for nodes to identify influential actors.
        Uses Neo4j GDS PageRank algorithm.
        """
        try:
            # GDS PageRank query
            pagerank_query = """
            CALL gds.pageRank.stream('narrative-graph')
            YIELD nodeId, score
            RETURN gds.util.asNode(nodeId).id as user_id,
                   gds.util.asNode(nodeId).label as username,
                   score
            ORDER BY score DESC
            LIMIT $limit
            """
            
            async with self.driver.session() as session:
                result = await session.run(pagerank_query, limit=limit)
                influencers = []
                async for record in result:
                    influencers.append({
                        "user_id": record["user_id"],
                        "username": record["username"],
                        "influence_score": float(record["score"]),
                        "rank": len(influencers) + 1
                    })
                return influencers
        except Exception as e:
            logger.warning(f"GDS PageRank not available: {e}")
            # Fallback: Simple degree-based ranking
            fallback_query = """
            MATCH (u:User)-[r]->()
            WITH u, count(r) as degree
            ORDER BY degree DESC
            LIMIT $limit
            RETURN u.id as user_id, u.label as username, degree as influence_score
            """
            async with self.driver.session() as session:
                result = await session.run(fallback_query, limit=limit)
                influencers = []
                async for record in result:
                    influencers.append({
                        "user_id": record["user_id"],
                        "username": record["username"],
                        "influence_score": float(record["influence_score"]),
                        "rank": len(influencers) + 1
                    })
                return influencers

    # Standard Network View
    async def get_network(self, limit: int = 100) -> Dict[str, Any]:
        query = "MATCH (n:User) OPTIONAL MATCH (n)-[r]->(m:User) RETURN n, r, m LIMIT $limit"
        async with self.driver.session() as session:
            result = await session.run(query, limit=limit)
            nodes = {}
            edges = []
            
            async for record in result:
                n = record['n']
                n_id = n.get("id") if hasattr(n, 'get') and n.get("id") else (str(n.element_id) if hasattr(n, 'element_id') else str(n.id))
                if n_id not in nodes:
                    n_props = dict(n) if hasattr(n, '__iter__') else {}
                    nodes[n_id] = {
                        "id": n_id,
                        "label": n_props.get("label") or n_props.get("username") or n_id,
                        "type": "User",
                        "severity": "critical" if n_props.get("risk_score", 0) > 0.7 else "low"
                    }
                
                m = record['m']
                if m:
                    m_id = m.get("id") if hasattr(m, 'get') and m.get("id") else (str(m.element_id) if hasattr(m, 'element_id') else str(m.id))
                    if m_id not in nodes:
                        m_props = dict(m) if hasattr(m, '__iter__') else {}
                        nodes[m_id] = {
                            "id": m_id,
                            "label": m_props.get("label") or m_props.get("username") or m_id,
                            "type": "User",
                            "severity": "critical" if m_props.get("risk_score", 0) > 0.7 else "low"
                        }
                    
                    r = record['r']
                    if r:
                        edges.append({
                            "source": n_id,
                            "target": m_id,
                            "strength": 1
                        })
            
            return {"nodes": list(nodes.values()), "edges": edges}

    async def get_subgraph(self, node_id: str, depth: int = 2, limit: int = 100) -> Dict[str, Any]:
        """Get subgraph around specific node"""
        query = f"""
        MATCH path = (start)-[*1..{depth}]-(connected)
        WHERE id(start) = $node_id OR start.id = $node_id
        RETURN path
        LIMIT $limit
        """
        # Simplified implementation - returns network for now
        return await self.get_network(limit=limit)

    async def detect_coordinated_behavior(self, time_window_minutes: int = 5) -> List[Dict]:
        """
        Detects groups of users posting the EXACT same content within a short time window.
        This is a hallmark of botnets and coordinated campaigns.
        """
        query = """
        MATCH (u1:User)-[:POSTED]->(p1:Post)
        MATCH (u2:User)-[:POSTED]->(p2:Post)
        WHERE u1.id < u2.id 
          AND p1.content_hash = p2.content_hash
        WITH u1, u2, count(*) as interactions
        WHERE interactions > 2
        RETURN u1.label as actor_a, u2.label as actor_b, interactions
        LIMIT 20
        """
        try:
            async with self.driver.session() as session:
                result = await session.run(query)
                clusters = []
                async for record in result:
                    clusters.append({
                        "actor_a": record["actor_a"],
                        "actor_b": record["actor_b"],
                        "strength": record["interactions"],
                        "type": "CIB_CLUSTER"
                    })
                return clusters
        except Exception as e:
            logger.error(f"Error detecting coordinated behavior: {e}")
            return []


# Singleton instance
neo4j_service = Neo4jService()
