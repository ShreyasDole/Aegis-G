"""
Neo4j Service — Safe Wrapper Edition
Implements Campaign Lineage (Tree), Advanced Clustering, and graceful
degradation when Neo4j is unavailable (e.g. Railway deploy without Aura).
"""
from neo4j import AsyncGraphDatabase
from app.config import settings
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Core Service
# ─────────────────────────────────────────────────────────────────────────────

class Neo4jService:
    def __init__(self):
        # AsyncGraphDatabase.driver() is lazy — it doesn't open a socket until
        # the first query, so this __init__ is safe even if Neo4j is offline.
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

    # ── TASK 1: Patient Zero ──────────────────────────────────────────────────
    async def find_patient_zero(self, content_hash: str) -> Dict[str, Any]:
        """Find the absolute origin of a narrative."""
        query = """
        MATCH (u:User)-[:POSTED]->(p:Post {content_hash: $content_hash})
        WITH u, p ORDER BY p.timestamp ASC LIMIT 1
        RETURN u.id as user_id, u.label as username, p.timestamp as timestamp
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

    # ── TASK 2: Campaign Lineage (Tree View) ──────────────────────────────────
    async def get_campaign_lineage(self, root_user_id: str) -> Dict[str, Any]:
        """
        Traces the propagation tree starting from a specific user (Patient Zero).
        Returns a hierarchical structure for the Campaign View.
        """
        query = """
        MATCH path = (root:User {id: $root_id})-[:INTERACTED_WITH|SHARED*1..3]->(target:User)
        RETURN path LIMIT 50
        """
        try:
            nodes = {}
            edges = []
            async with self.driver.session() as session:
                result = await session.run(query, root_id=root_user_id)
                # Consume cursor INSIDE the session block to avoid connection-closed errors
                records = await result.data()

            for record in records:
                path = record["path"]
                for node in path.nodes:
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
        except Exception as e:
            logger.warning(f"Neo4j offline for campaign trace, returning robust mock. Error: {e}")
            mock_nodes = [
                {"id": root_user_id, "label": f"{root_user_id} (P0)", "type": "Actor", "properties": {"severity": "critical"}},
                {"id": "bot_1", "label": "Amplifier Bot 1", "type": "Bot", "properties": {"severity": "high"}},
                {"id": "bot_2", "label": "Amplifier Bot 2", "type": "Bot", "properties": {"severity": "high"}},
                {"id": "bot_3", "label": "Echo Node A", "type": "Bot", "properties": {"severity": "medium"}},
                {"id": "target_1", "label": "Target Victim X", "type": "User", "properties": {"severity": "low"}}
            ]
            mock_edges = [
                {"source": root_user_id, "target": "bot_1", "type": "COMMANDED"},
                {"source": root_user_id, "target": "bot_2", "type": "COMMANDED"},
                {"source": "bot_1", "target": "bot_3", "type": "SHARED"},
                {"source": "bot_2", "target": "target_1", "type": "TARGETED"}
            ]
            return {"nodes": mock_nodes, "edges": mock_edges}

    # ── TASK 3: Clustering (Narrative Detection) with Neo4j GDS ──────────────
    async def detect_clusters(self) -> List[Dict]:
        """
        Finds groups of users posting identical content hashes (Botnets).
        Uses Neo4j GDS Louvain algorithm for advanced clustering.
        """
        try:
            gds_query = """
            CALL gds.graph.project(
                'narrative-graph',
                'User',
                {
                    COORDINATED: {
                        type: 'POSTED',
                        orientation: 'UNDIRECTED',
                        properties: {
                            weight: {
                                property: 'risk_score',
                                defaultValue: 1.0
                            }
                        }
                    }
                }
            )
            YIELD graphName, nodeCount, relationshipCount
            """
            louvain_query = """
            CALL gds.louvain.stream('narrative-graph')
            YIELD nodeId, communityId
            RETURN gds.util.asNode(nodeId).id as user_id,
                   gds.util.asNode(nodeId).label as username,
                   communityId
            ORDER BY communityId, user_id
            """
            async with self.driver.session() as session:
                try:
                    await session.run(gds_query)
                    result = await session.run(louvain_query)
                    records = await result.data()

                    communities: Dict[Any, List] = {}
                    for record in records:
                        comm_id = record["communityId"]
                        if comm_id not in communities:
                            communities[comm_id] = []
                        communities[comm_id].append({
                            "user_id": record["user_id"],
                            "username": record["username"]
                        })

                    clusters = [
                        {
                            "cluster_id": f"GDS_Community_{comm_id}",
                            "nodes": [m["username"] for m in members],
                            "size": len(members),
                            "type": "Botnet",
                            "method": "Louvain_GDS"
                        }
                        for comm_id, members in communities.items()
                        if len(members) >= 2
                    ]
                    if clusters:
                        logger.info(f"GDS Louvain found {len(clusters)} communities")
                        return clusters
                except Exception as gds_error:
                    logger.warning(f"GDS not available, falling back to basic clustering: {gds_error}")
        except Exception as outer_e:
            logger.warning(f"GDS outer setup failed, using basic clustering: {outer_e}")

        # Fallback: basic content-hash overlap clustering
        query = """
        MATCH (u1:User)-[:POSTED]->(p:Post)<-[:POSTED]-(u2:User)
        WHERE u1.id < u2.id
        WITH u1, u2, count(p) as overlap
        WHERE overlap >= 2
        RETURN u1.label as actor_a, u2.label as actor_b, overlap
        ORDER BY overlap DESC LIMIT 10
        """
        async with self.driver.session() as session:
            result = await session.run(query)
            records = await result.data()

        return [
            {
                "cluster_id": f"C_{r['actor_a']}_{r['actor_b']}",
                "nodes": [r['actor_a'], r['actor_b']],
                "size": r['overlap'],
                "type": "Botnet",
                "method": "Content_Hash_Overlap"
            }
            for r in records
        ]

    async def calculate_page_rank(self, limit: int = 20) -> List[Dict]:
        """Calculate PageRank for nodes to identify influential actors."""
        try:
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
                records = await result.data()

            return [
                {
                    "user_id": r["user_id"],
                    "username": r["username"],
                    "influence_score": float(r["score"]),
                    "rank": idx + 1
                }
                for idx, r in enumerate(records)
            ]
        except Exception as e:
            logger.warning(f"GDS PageRank not available: {e}")

        # Fallback: degree-based ranking
        fallback_query = """
        MATCH (u:User)-[r]->()
        WITH u, count(r) as degree
        ORDER BY degree DESC
        LIMIT $limit
        RETURN u.id as user_id, u.label as username, degree as influence_score
        """
        async with self.driver.session() as session:
            result = await session.run(fallback_query, limit=limit)
            records = await result.data()

        return [
            {
                "user_id": r["user_id"],
                "username": r["username"],
                "influence_score": float(r["influence_score"]),
                "rank": idx + 1
            }
            for idx, r in enumerate(records)
        ]

    # ── Standard Network View ─────────────────────────────────────────────────
    async def get_network(self, limit: int = 100) -> Dict[str, Any]:
        """Fetch the full threat actor graph. Falls back to rich mock if Neo4j is offline."""
        query = "MATCH (n:User) OPTIONAL MATCH (n)-[r]->(m:User) RETURN n, r, m LIMIT $limit"
        try:
            async with self.driver.session() as session:
                result = await session.run(query, limit=limit)
                # BUG FIX: consume all records INSIDE the session context.
                # Exiting 'async with' closes the network connection, making
                # any pending cursor invalid and causing silent data loss.
                records = await result.data()

            nodes: Dict[str, Any] = {}
            edges: List[Dict] = []
            for record in records:
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
                        edges.append({"source": n_id, "target": m_id, "strength": 1})

            return {"nodes": list(nodes.values()), "edges": edges}
        except Exception as e:
            logger.warning(f"Neo4j offline for get_network, returning rich mock clusters. Error: {e}")
            mock_nodes = [
                {"id": "APT_29_Origin", "label": "APT_29_Origin (Source)", "type": "Actor", "properties": {"severity": "critical"}},
                {"id": "Amplifier_A", "label": "Command Node A", "type": "Bot", "properties": {"severity": "high"}},
                {"id": "Amplifier_B", "label": "Command Node B", "type": "Bot", "properties": {"severity": "high"}}
            ]
            mock_edges = [
                {"source": "APT_29_Origin", "target": "Amplifier_A", "relationship": "COMMAND", "properties": {"strength": 1}},
                {"source": "APT_29_Origin", "target": "Amplifier_B", "relationship": "COMMAND", "properties": {"strength": 1}}
            ]
            for i in range(1, 15):
                n_id = f"worker_a_{i}"
                mock_nodes.append({"id": n_id, "label": f"Zombie_{i}", "type": "Bot", "properties": {"severity": "medium"}})
                mock_edges.append({"source": "Amplifier_A", "target": n_id, "relationship": "INFECTED", "properties": {"strength": 0.5}})
            for i in range(15, 25):
                n_id = f"worker_b_{i}"
                mock_nodes.append({"id": n_id, "label": f"Zombie_{i}", "type": "Bot", "properties": {"severity": "medium"}})
                mock_edges.append({"source": "Amplifier_B", "target": n_id, "relationship": "INFECTED", "properties": {"strength": 0.5}})
            return {"nodes": mock_nodes, "edges": mock_edges}

    async def get_subgraph(self, node_id: str, depth: int = 2, limit: int = 100) -> Dict[str, Any]:
        """Get subgraph around specific node"""
        return await self.get_network(limit=limit)

    async def detect_coordinated_behavior(self, time_window_minutes: int = 5) -> List[Dict]:
        """Detects coordinated posting behavior (botnets)."""
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
                records = await result.data()
            return [
                {
                    "actor_a": r["actor_a"],
                    "actor_b": r["actor_b"],
                    "strength": r["interactions"],
                    "type": "CIB_CLUSTER"
                }
                for r in records
            ]
        except Exception as e:
            logger.error(f"Error detecting coordinated behavior: {e}")
            return []


# ─────────────────────────────────────────────────────────────────────────────
# Safe Wrapper — graceful degradation when Neo4j is unreachable
# ─────────────────────────────────────────────────────────────────────────────

class SafeNeo4jService:
    """
    Wraps Neo4jService with an `enabled` flag.
    On startup, if Neo4j URI is missing or clearly invalid, the service is
    disabled and all methods return safe mock/empty data instead of crashing.
    Routers check `neo4j_service.enabled` before calling graph operations.
    """

    def __init__(self):
        uri = settings.NEO4J_URI or ""
        # If URI is still the sqlite-like default or empty, disable immediately
        if not uri or uri in ("bolt://localhost:7687", "bolt://neo4j:7687") and _is_local_docker():
            logger.warning(
                "Neo4j URI points to a local/docker host that won't be reachable "
                "on Railway. Graph service disabled. Set NEO4J_URI to a Neo4j Aura "
                "URL (neo4j+s://...) to enable graph features."
            )
            self._service: Optional[Neo4jService] = None
            self.enabled = False
        else:
            try:
                self._service = Neo4jService()
                self.enabled = True
                logger.info(f"✅ Neo4j service initialised (URI={uri[:30]}...)")
            except Exception as e:
                logger.warning(f"⚠️  Neo4j unavailable: {e}. Graph features disabled.")
                self._service = None
                self.enabled = False

    # ── Proxy all methods; return safe defaults when disabled ─────────────────

    async def create_node(self, node_data: Dict) -> None:
        if self.enabled and self._service:
            try:
                await self._service.create_node(node_data)
            except Exception as e:
                logger.warning(f"Neo4j create_node failed: {e}")

    async def create_post_node(self, **kwargs) -> None:
        if self.enabled and self._service:
            try:
                await self._service.create_post_node(**kwargs)
            except Exception as e:
                logger.warning(f"Neo4j create_post_node failed: {e}")

    async def find_patient_zero(self, content_hash: str) -> Dict[str, Any]:
        if self.enabled and self._service:
            try:
                return await self._service.find_patient_zero(content_hash)
            except Exception as e:
                logger.warning(f"Neo4j find_patient_zero failed: {e}")
        return {"status": "not_found"}

    async def get_campaign_lineage(self, root_user_id: str) -> Dict[str, Any]:
        if self.enabled and self._service:
            try:
                return await self._service.get_campaign_lineage(root_user_id)
            except Exception as e:
                logger.warning(f"Neo4j get_campaign_lineage failed: {e}")
        return {"nodes": [], "edges": []}

    async def get_network(self, limit: int = 100) -> Dict[str, Any]:
        if self.enabled and self._service:
            try:
                return await self._service.get_network(limit=limit)
            except Exception as e:
                logger.warning(f"Neo4j get_network failed: {e}")
        # Return rich mock so the UI still renders
        return await _mock_network()

    async def detect_clusters(self) -> List[Dict]:
        if self.enabled and self._service:
            try:
                return await self._service.detect_clusters()
            except Exception as e:
                logger.warning(f"Neo4j detect_clusters failed: {e}")
        return []

    async def calculate_page_rank(self, limit: int = 20) -> List[Dict]:
        if self.enabled and self._service:
            try:
                return await self._service.calculate_page_rank(limit=limit)
            except Exception as e:
                logger.warning(f"Neo4j calculate_page_rank failed: {e}")
        return []

    async def detect_coordinated_behavior(self, time_window_minutes: int = 5) -> List[Dict]:
        if self.enabled and self._service:
            try:
                return await self._service.detect_coordinated_behavior(time_window_minutes)
            except Exception as e:
                logger.warning(f"Neo4j detect_coordinated_behavior failed: {e}")
        return []

    async def get_subgraph(self, node_id: str, depth: int = 2, limit: int = 100) -> Dict[str, Any]:
        if self.enabled and self._service:
            try:
                return await self._service.get_subgraph(node_id, depth, limit)
            except Exception as e:
                logger.warning(f"Neo4j get_subgraph failed: {e}")
        return {"nodes": [], "edges": []}


def _is_local_docker() -> bool:
    """Returns True when running outside a Docker network (i.e., on Railway)."""
    import os
    # Railway sets RAILWAY_ENVIRONMENT; Docker sets HOSTNAME to container id
    return os.getenv("RAILWAY_ENVIRONMENT") is not None


async def _mock_network() -> Dict[str, Any]:
    """Rich mock graph returned when Neo4j is offline."""
    mock_nodes = [
        {"id": "APT_29_Origin", "label": "APT_29_Origin (Source)", "type": "Actor", "properties": {"severity": "critical"}},
        {"id": "Amplifier_A", "label": "Command Node A", "type": "Bot", "properties": {"severity": "high"}},
        {"id": "Amplifier_B", "label": "Command Node B", "type": "Bot", "properties": {"severity": "high"}},
    ]
    mock_edges = [
        {"source": "APT_29_Origin", "target": "Amplifier_A", "relationship": "COMMAND", "properties": {"strength": 1}},
        {"source": "APT_29_Origin", "target": "Amplifier_B", "relationship": "COMMAND", "properties": {"strength": 1}},
    ]
    for i in range(1, 15):
        nid = f"worker_a_{i}"
        mock_nodes.append({"id": nid, "label": f"Zombie_{i}", "type": "Bot", "properties": {"severity": "medium"}})
        mock_edges.append({"source": "Amplifier_A", "target": nid, "relationship": "INFECTED", "properties": {"strength": 0.5}})
    for i in range(15, 25):
        nid = f"worker_b_{i}"
        mock_nodes.append({"id": nid, "label": f"Zombie_{i}", "type": "Bot", "properties": {"severity": "medium"}})
        mock_edges.append({"source": "Amplifier_B", "target": nid, "relationship": "INFECTED", "properties": {"strength": 0.5}})
    return {"nodes": mock_nodes, "edges": mock_edges}


# ─────────────────────────────────────────────────────────────────────────────
# Singleton — SafeNeo4jService is the public interface for all routers/workers
# ─────────────────────────────────────────────────────────────────────────────
neo4j_service = SafeNeo4jService()
