"""
Offline demo graph — same narrative as Neo4j seed_demo_data.
Used when Neo4j is unreachable or graph is empty so UI still shows motion + intent.
"""
from typing import Any, Dict, List

DEMO_NODES: List[Dict[str, Any]] = [
    {
        "id": "c2_master",
        "label": "Primary operator · Telegram C2",
        "type": "User",
        "severity": "critical",
        "platform": "telegram",
        "caption": "Originates coordinated URLs; zero incoming REPOSTED from cohort (patient-zero signature).",
        "risk_score": 0.97,
    },
    {
        "id": "bot_agent_01",
        "label": "Amplifier @EUWatch_fake · X",
        "type": "User",
        "severity": "critical",
        "platform": "twitter",
        "caption": "Reposts within 5m of C2; identical URL slugs to cluster peers.",
        "risk_score": 0.91,
    },
    {
        "id": "bot_agent_02",
        "label": "Amplifier @PolicyAlertEU · X",
        "type": "User",
        "severity": "critical",
        "platform": "twitter",
        "caption": "Cross-posts to FB groups; stylometry overlap with b1 (ONNX attribution).",
        "risk_score": 0.88,
    },
    {
        "id": "bot_agent_03",
        "label": 'Group admin · FB "EU Transparency"',
        "type": "User",
        "severity": "medium",
        "platform": "facebook",
        "caption": "Seeds narrative into 40+ groups; high betweenness in graph projection.",
        "risk_score": 0.85,
    },
    {
        "id": "bot_agent_04",
        "label": "Page operator · FB",
        "type": "User",
        "severity": "medium",
        "platform": "facebook",
        "caption": "Paid reach spike correlated with GRU-style posting hours (UTC).",
        "risk_score": 0.82,
    },
    {
        "id": "bot_agent_05",
        "label": "Sockpuppet · Reddit r/europolitics",
        "type": "User",
        "severity": "medium",
        "platform": "reddit",
        "caption": "Karma farm then pivot to election-interference talking points; SIMILAR_TO same hashes.",
        "risk_score": 0.79,
    },
]

DEMO_EDGES: List[Dict[str, Any]] = [
    {"source": "c2_master", "target": "bot_agent_01", "type": "REPOSTED"},
    {"source": "c2_master", "target": "bot_agent_04", "type": "REPOSTED"},
    {"source": "bot_agent_01", "target": "bot_agent_02", "type": "SHARED"},
    {"source": "bot_agent_02", "target": "bot_agent_03", "type": "SHARED"},
    {"source": "bot_agent_04", "target": "bot_agent_05", "type": "SHARED"},
    {"source": "bot_agent_03", "target": "bot_agent_05", "type": "INTERACTED_WITH"},
]


def demo_network() -> Dict[str, Any]:
    return {"nodes": [dict(n) for n in DEMO_NODES], "edges": [dict(e) for e in DEMO_EDGES]}


def demo_clusters() -> List[Dict[str, Any]]:
    members = [{"id": n["id"], "label": n["label"]} for n in DEMO_NODES]
    ids = [n["id"] for n in DEMO_NODES]
    avg = sum(float(n["risk_score"] or 0) for n in DEMO_NODES) / len(DEMO_NODES)
    return [
        {
            "cluster_id": "DEMO_COORDINATED_RING",
            "nodes": ids,
            "members": members,
            "size": len(members),
            "avg_risk": round(avg, 3),
            "type": "Botnet_Cluster",
            "method": "Offline_Demo",
        }
    ]


def demo_campaign(root_id: str) -> Dict[str, Any]:
    """Subgraph reachable from root along demo edges (both directions for display)."""
    root = (root_id or "c2_master").strip() or "c2_master"
    node_ids = {root}
    edges_out: List[Dict[str, Any]] = []
    for e in DEMO_EDGES:
        s, t = e["source"], e["target"]
        if s == root or t == root:
            node_ids.add(s)
            node_ids.add(t)
            edges_out.append(dict(e))
    # expand one hop from any collected node
    for e in DEMO_EDGES:
        s, t = e["source"], e["target"]
        if s in node_ids or t in node_ids:
            node_ids.add(s)
            node_ids.add(t)
    edges_out = []
    seen = set()
    for e in DEMO_EDGES:
        s, t = e["source"], e["target"]
        if s in node_ids and t in node_ids:
            key = (s, t, e["type"])
            if key not in seen:
                seen.add(key)
                edges_out.append(dict(e))
    nodes = [dict(n) for n in DEMO_NODES if n["id"] in node_ids]
    return {"nodes": nodes, "edges": edges_out}


def demo_patient_zero(content_hash: str) -> Dict[str, Any]:
    h = (content_hash or "").strip()
    if h == "demo_astroturf_election_2024_h1":
        return {
            "status": "found",
            "username": "Primary operator · Telegram C2",
            "user_id": "c2_master",
            "origin_time": "2024-01-15T08:00:00",
        }
    return {"status": "not_found"}


def demo_pagerank(limit: int = 20) -> List[Dict[str, Any]]:
    ranked = sorted(DEMO_NODES, key=lambda n: float(n.get("risk_score") or 0), reverse=True)[:limit]
    out = []
    for i, n in enumerate(ranked, start=1):
        out.append(
            {
                "user_id": n["id"],
                "username": n["label"],
                "influence_score": float(n.get("risk_score") or 0),
                "rank": i,
            }
        )
    return out
