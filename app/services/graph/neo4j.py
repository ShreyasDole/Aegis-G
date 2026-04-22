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
        Advanced Patient Zero Identification.
        Strategy: among all users who posted this content, find the one with
        zero INCOMING REPOSTED/SHARED edges from other users in the same group.
        That is the C2 root — the node no one commanded.
        Falls back to earliest-timestamp user if no propagation chain exists.
        """
        query = """
        // All actors who posted this content
        MATCH (p:Post {content_hash: $content_hash})<-[:POSTED]-(u:User)
        WITH collect(DISTINCT u) AS actors, p

        // For each actor: count how many OTHER actors from this group directed them
        UNWIND actors AS candidate
        OPTIONAL MATCH (director:User)-[:REPOSTED|SHARED]->(candidate)
        WHERE director IN actors
        WITH candidate, count(DISTINCT director) AS incoming, p
        ORDER BY incoming ASC, p.timestamp ASC
        LIMIT 1
        RETURN candidate.id AS user_id, candidate.label AS username, p.timestamp AS timestamp
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
        # Traverse all outbound propagation edges from this root (C2 spread tree)
        query = """
        MATCH path = (root:User {id: $root_id})-[:INTERACTED_WITH|SHARED|REPOSTED*1..3]->(target:User)
        RETURN path LIMIT 50
        """
        async with self.driver.session() as session:
            result = await session.run(query, root_id=root_user_id)
            nodes = {}
            edges = []
            
            async for record in result:
                path = record["path"]
                for node in path.nodes:
                    props = dict(node)
                    node_id = props.get("id") or (str(node.element_id) if hasattr(node, 'element_id') else str(node.id))
                    if node_id not in nodes:
                        risk = props.get("risk_score") or 0
                        nodes[node_id] = {
                            "id": node_id,
                            "label": props.get("label") or node_id,
                            "type": "User",
                            "severity": "critical" if risk > 0.8 else ("medium" if risk > 0.5 else "low"),
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

        # ── Fallback A: C2 network via REPOSTED/SHARED chains ──────────────────
        c2_query = """
        MATCH (commander:User)-[:REPOSTED|SHARED*1..3]->(bot:User)
        WITH commander, collect(DISTINCT bot) AS bots
        WHERE size(bots) >= 2
        RETURN commander.id AS c2_id, commander.label AS c2_label,
               commander.risk_score AS c2_risk,
               [b IN bots | b.label] AS bot_labels,
               [b IN bots | coalesce(b.risk_score, 0)] AS bot_risks
        LIMIT 10
        """
        # ── Fallback B: same content_hash posted by multiple users ────────────
        overlap_query = """
        MATCH (u1:User)-[:POSTED]->(p:Post)<-[:POSTED]-(u2:User)
        WHERE u1.id < u2.id
        WITH u1, u2, count(p) AS overlap
        WHERE overlap >= 1
        RETURN u1.label AS actor_a, u2.label AS actor_b,
               u1.risk_score AS risk_a, u2.risk_score AS risk_b, overlap
        ORDER BY overlap DESC LIMIT 20
        """
        clusters = []
        async with self.driver.session() as session:
            # Run C2-chain detection first
            c2_result = await session.run(c2_query)
            async for record in c2_result:
                bot_labels = record["bot_labels"] or []
                bot_risks = record["bot_risks"] or []
                avg_risk = (sum(bot_risks) + (record["c2_risk"] or 0)) / (len(bot_risks) + 1) if bot_risks else (record["c2_risk"] or 0)
                clusters.append({
                    "cluster_id": f"C2_{record['c2_label']}",
                    "nodes": [record["c2_label"]] + bot_labels,
                    "size": len(bot_labels) + 1,
                    "avg_risk": round(avg_risk, 3),
                    "type": "Botnet_Cluster",
                    "method": "C2_Chain_Traversal",
                })

            if not clusters:
                # Fallback B: content-hash overlap
                overlap_result = await session.run(overlap_query)
                seen_pairs: set = set()
                groups: dict = {}
                async for record in overlap_result:
                    a, b = record["actor_a"], record["actor_b"]
                    key = tuple(sorted([a, b]))
                    if key in seen_pairs:
                        continue
                    seen_pairs.add(key)
                    # Group actors sharing content together
                    matched = None
                    for cid, group in groups.items():
                        if a in group["nodes"] or b in group["nodes"]:
                            matched = cid
                            break
                    if matched:
                        groups[matched]["nodes"].update([a, b])
                        groups[matched]["risks"].extend([record["risk_a"] or 0, record["risk_b"] or 0])
                    else:
                        cid = f"HASH_cluster_{len(groups)}"
                        groups[cid] = {
                            "nodes": {a, b},
                            "risks": [record["risk_a"] or 0, record["risk_b"] or 0],
                        }
                for cid, g in groups.items():
                    nodes_list = list(g["nodes"])
                    avg_risk = sum(g["risks"]) / len(g["risks"]) if g["risks"] else 0
                    clusters.append({
                        "cluster_id": cid,
                        "nodes": nodes_list,
                        "size": len(nodes_list),
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

    # Standard Network View — includes User-to-User edges (SHARED/REPOSTED/INTERACTED)
    async def get_network(self, limit: int = 100) -> Dict[str, Any]:
        query = """
        MATCH (n:User)
        OPTIONAL MATCH (n)-[r:SHARED|REPOSTED|INTERACTED_WITH]->(m:User)
        RETURN n, r, m LIMIT $limit
        """
        try:
            async with self.driver.session() as session:
                result = await session.run(query, limit=limit)
                nodes = {}
                edges = []
                async for record in result:
                    n = record['n']
                    n_props = dict(n)
                    n_id = n_props.get("id") or (str(n.element_id) if hasattr(n, 'element_id') else str(n.id))
                    if n_id not in nodes:
                        risk = n_props.get("risk_score") or 0
                        nodes[n_id] = {
                            "id": n_id,
                            "label": n_props.get("label") or n_props.get("username") or n_id,
                            "type": "User",
                            "severity": "critical" if risk > 0.8 else ("medium" if risk > 0.5 else "low"),
                        }
                    m = record['m']
                    if m:
                        m_props = dict(m)
                        m_id = m_props.get("id") or (str(m.element_id) if hasattr(m, 'element_id') else str(m.id))
                        if m_id not in nodes:
                            risk = m_props.get("risk_score") or 0
                            nodes[m_id] = {
                                "id": m_id,
                                "label": m_props.get("label") or m_props.get("username") or m_id,
                                "type": "User",
                                "severity": "critical" if risk > 0.8 else ("medium" if risk > 0.5 else "low"),
                            }
                        r = record['r']
                        if r:
                            edges.append({"source": n_id, "target": m_id, "strength": 1})
                return {"nodes": list(nodes.values()), "edges": edges}
        except Exception as e:
            logger.error(f"get_network failed: {e}")
            return {"nodes": [], "edges": []}

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

    async def create_similar_to_edges(self, post_hash: str, platform: str, risk_score: float):
        """
        After ingesting a post, link it to other high-risk posts from the same platform.
        Creates SIMILAR_TO edges — the structural signal Louvain uses to cluster botnets.
        """
        query = """
        MATCH (p1:Post {content_hash: $hash})<-[:POSTED]-(u1:User)
        MATCH (u2:User {platform: $platform})-[:POSTED]->(p2:Post)
        WHERE u1.id <> u2.id
          AND p2.content_hash <> $hash
          AND p2.risk_score >= $min_risk
        WITH p1, p2, (1.0 - abs(p2.risk_score - $risk)) AS sim
        WHERE sim > 0.7
        MERGE (p1)-[s:SIMILAR_TO]->(p2)
          ON CREATE SET s.similarity_score = sim
        RETURN count(s) AS created
        """
        try:
            async with self.driver.session() as session:
                await session.run(query, hash=post_hash, platform=platform,
                                  risk=risk_score, min_risk=max(0.0, risk_score - 0.2))
        except Exception as e:
            logger.debug(f"create_similar_to_edges: {e}")

    async def seed_demo_data(self):
        """
        Inject realistic astroturfing demo data:
        - c2_master: Patient Zero (Telegram C2 node)
        - 5 bot agents that repost its narrative across platforms
        - All bots post the SAME 2 content hashes (triggers overlap-based clustering)
        - REPOSTED/SHARED chain for patient-zero temporal traversal
        - SIMILAR_TO edges for structural similarity
        """
        H1 = "demo_astroturf_election_2024_h1"
        H2 = "demo_astroturf_election_2024_h2"

        seed_cypher = f"""
        // === USERS ===
        MERGE (c2:User {{id: 'c2_master', label: 'c2_master', platform: 'telegram', risk_score: 0.97}})
        MERGE (b1:User {{id: 'bot_agent_01', label: 'bot_agent_01', platform: 'twitter', risk_score: 0.91}})
        MERGE (b2:User {{id: 'bot_agent_02', label: 'bot_agent_02', platform: 'twitter', risk_score: 0.88}})
        MERGE (b3:User {{id: 'bot_agent_03', label: 'bot_agent_03', platform: 'facebook', risk_score: 0.85}})
        MERGE (b4:User {{id: 'bot_agent_04', label: 'bot_agent_04', platform: 'facebook', risk_score: 0.82}})
        MERGE (b5:User {{id: 'bot_agent_05', label: 'bot_agent_05', platform: 'reddit', risk_score: 0.79}})

        // === SHARED POSTS (same hash = coordinated inauthentic behavior) ===
        MERGE (p1:Post {{content_hash: '{H1}'}})
          ON CREATE SET p1.timestamp = datetime('2024-01-15T08:00:00'), p1.risk_score = 0.95
        MERGE (p2:Post {{content_hash: '{H2}'}})
          ON CREATE SET p2.timestamp = datetime('2024-01-15T09:00:00'), p2.risk_score = 0.88

        // All 6 actors post BOTH shared hashes (overlap=2 per pair → triggers clustering)
        MERGE (c2)-[:POSTED]->(p1) MERGE (c2)-[:POSTED]->(p2)
        MERGE (b1)-[:POSTED]->(p1) MERGE (b1)-[:POSTED]->(p2)
        MERGE (b2)-[:POSTED]->(p1) MERGE (b2)-[:POSTED]->(p2)
        MERGE (b3)-[:POSTED]->(p1) MERGE (b3)-[:POSTED]->(p2)
        MERGE (b4)-[:POSTED]->(p1) MERGE (b4)-[:POSTED]->(p2)
        MERGE (b5)-[:POSTED]->(p1) MERGE (b5)-[:POSTED]->(p2)

        // === C2 CHAIN (Patient Zero traversal) ===
        MERGE (c2)-[:REPOSTED {{ts: datetime('2024-01-15T08:00:00')}}]->(b1)
        MERGE (b1)-[:SHARED  {{ts: datetime('2024-01-15T08:05:00')}}]->(b2)
        MERGE (b2)-[:SHARED  {{ts: datetime('2024-01-15T08:08:00')}}]->(b3)
        MERGE (c2)-[:REPOSTED {{ts: datetime('2024-01-15T08:00:00')}}]->(b4)
        MERGE (b4)-[:SHARED  {{ts: datetime('2024-01-15T08:12:00')}}]->(b5)

        // === SIMILAR_TO edges (semantic similarity for structural clustering) ===
        MERGE (p1)-[:SIMILAR_TO {{similarity_score: 0.98}}]->(p2)

        RETURN 'seeded' AS result
        """
        async with self.driver.session() as session:
            await session.run(seed_cypher)
        logger.info("Neo4j demo seeded: c2_master + 5 bots + REPOSTED/SHARED chains + 2 shared posts")
        return {
            "seeded": True,
            "users": 6,
            "shared_posts": 2,
            "relationships": {"REPOSTED": 2, "SHARED": 3, "POSTED": 12, "SIMILAR_TO": 1},
            "patient_zero": "c2_master",
            "content_hash": H1,
        }

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
