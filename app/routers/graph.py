import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import ValidationError

from app.schemas.graph import GraphResponse
from app.services.graph.neo4j import neo4j_service
from app.services.graph import demo_graph

router = APIRouter()
logger = logging.getLogger(__name__)


def _normalize_edges(edges: Any) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    if not isinstance(edges, list):
        return out
    for e in edges:
        if not isinstance(e, dict):
            continue
        src = e.get("source")
        tgt = e.get("target")
        if src is None or tgt is None:
            continue
        rel = e.get("type") or e.get("relationship") or "RELATED"
        props = e.get("properties") if isinstance(e.get("properties"), dict) else None
        out.append(
            {
                "source": str(src),
                "target": str(tgt),
                "relationship": str(rel),
                "properties": props,
            }
        )
    return out


def _coerce_nodes(raw: Any) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    if not isinstance(raw, list):
        return out
    for n in raw:
        if not isinstance(n, dict):
            continue
        nid = n.get("id")
        if nid is None:
            continue
        label = n.get("label") if n.get("label") is not None else nid
        ntype = n.get("type") if n.get("type") is not None else "User"
        rs = n.get("risk_score")
        try:
            risk = float(rs) if rs is not None and rs != "" else None
        except (TypeError, ValueError):
            risk = None
        cap = n.get("caption")
        if cap is not None:
            cap = str(cap)[:2000]
        plat = n.get("platform")
        plat_s = str(plat) if plat is not None else None
        sev = n.get("severity")
        sev_s = str(sev) if sev is not None else None
        props = n.get("properties") if isinstance(n.get("properties"), dict) else None
        out.append(
            {
                "id": str(nid),
                "label": str(label),
                "type": str(ntype),
                "severity": sev_s,
                "platform": plat_s,
                "caption": cap,
                "risk_score": risk,
                "properties": props,
            }
        )
    return out


def _graph_response(data: dict, demo: bool) -> GraphResponse:
    edges = _normalize_edges(data.get("edges", []))
    nodes = _coerce_nodes(data.get("nodes"))
    stats: Optional[Dict[str, Any]] = {"demo_mode": True, "source": "offline_seed"} if demo else None
    try:
        return GraphResponse(nodes=nodes, edges=edges, stats=stats)
    except ValidationError as err:
        logger.warning("GraphResponse validation failed, using minimal demo: %s", err)
        fb = demo_graph.demo_network()
        return GraphResponse(
            nodes=_coerce_nodes(fb.get("nodes")),
            edges=_normalize_edges(fb.get("edges")),
            stats={"demo_mode": True, "source": "validation_fallback"},
        )


@router.get("", response_model=GraphResponse)
@router.get("/", response_model=GraphResponse)
async def get_network(limit: int = 100):
    demo = False
    try:
        data = await neo4j_service.get_network(limit=limit)
        nodes = data.get("nodes") or []
        edges = data.get("edges") or []
        if not nodes and not edges:
            data = demo_graph.demo_network()
            demo = True
        return _graph_response(data, demo)
    except Exception as e:
        logger.warning("get_network neo4j failed, serving demo graph: %s", e)
        return _graph_response(demo_graph.demo_network(), True)

@router.get("/campaign/{root_id}", response_model=GraphResponse)
async def get_campaign_view(root_id: str):
    """Get the propagation tree for a specific campaign origin (Source -> Botnet -> Targets)."""
    try:
        data = await neo4j_service.get_campaign_lineage(root_id)
        nodes = data.get("nodes") or []
        edges = data.get("edges") or []
        if not nodes and not edges:
            return _graph_response(demo_graph.demo_campaign(root_id), True)
        return _graph_response(data, False)
    except Exception as e:
        logger.warning("get_campaign_lineage failed, demo tree: %s", e)
        return _graph_response(demo_graph.demo_campaign(root_id), True)

@router.get("/clusters")
async def get_bot_clusters():
    try:
        clusters = await neo4j_service.detect_clusters()
        if clusters:
            return {"clusters": clusters}
        return {"clusters": demo_graph.demo_clusters()}
    except Exception as e:
        logger.warning("detect_clusters failed, demo clusters: %s", e)
        return {"clusters": demo_graph.demo_clusters()}


@router.get("/pagerank")
async def get_influencers(limit: int = 20):
    try:
        influencers = await neo4j_service.calculate_page_rank(limit=limit)
        if influencers:
            return {"influencers": influencers}
        return {"influencers": demo_graph.demo_pagerank(limit)}
    except Exception as e:
        logger.warning("pagerank failed, demo ranking: %s", e)
        return {"influencers": demo_graph.demo_pagerank(limit)}


@router.get("/patient-zero/{content_hash}")
async def trace_patient_zero(content_hash: str):
    """
    Temporal Patient Zero Identification.
    Traverses SHARED/REPOSTED relationships backwards to find the C2 origin.
    """
    try:
        result = await neo4j_service.find_patient_zero(content_hash)
        if result.get("status") == "not_found":
            demo = demo_graph.demo_patient_zero(content_hash)
            if demo.get("status") == "found":
                return {**demo, "demo_mode": True}
            raise HTTPException(status_code=404, detail="No origin found for this content hash")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.warning("find_patient_zero failed: %s", e)
        demo = demo_graph.demo_patient_zero(content_hash)
        if demo.get("status") == "found":
            return {**demo, "demo_mode": True}
        raise HTTPException(status_code=404, detail="No origin found for this content hash")


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
        logger.warning("Neo4j seed failed (UI still has offline demo graph): %s", e)
        return {
            "seeded": False,
            "neo4j_error": str(e),
            "offline_demo_available": True,
            "hint": "GET /api/network/ returns demo graph when DB is empty or unreachable.",
        }
