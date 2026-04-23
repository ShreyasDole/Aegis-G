"""
Structured demo / degradation payloads for demo day when DB, Neo4j, Gemini, STIX, or workers fail.

Convention:
- Object responses: include ``demo_mode: True`` and ``fallback_reason: str`` where the schema allows
  (see ``ScanResponse``). Dict endpoints use the same keys at top level.
- List-only responses: callers should set header ``X-Aegis-Fallback: 1`` (see threats router).
"""
from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def content_hash_sha256(text: str) -> str:
    return hashlib.sha256((text or "").encode("utf-8", errors="replace")).hexdigest()


def stylometry_block(*, reason: str) -> Dict[str, Any]:
    return {
        "is_ai": True,
        "risk_score": 0.58,
        "perplexity": 42.0,
        "burstiness": 0.31,
        "artifacts": ["uniform_sentence_openings", "template_like_phrasing"],
        "details": f"Demo fallback stylometry — {reason}",
        "adversarial_detected": False,
        "adversarial_patterns": [],
    }


def scan_response_dict(*, content: str, reason: str) -> Dict[str, Any]:
    ch = content_hash_sha256(content)
    return {
        "threat_id": None,
        "content_hash": ch,
        "risk_score": 0.58,
        "is_ai_generated": True,
        "confidence": 0.61,
        "detected_model": "demo_fallback",
        "timestamp": _utcnow(),
        "recommendation": "Review in analyst console (pipeline used offline fallback).",
        "reasoning": reason,
        "denoised_text": None,
        "attribution": {"source": "demo_fallback", "note": reason},
        "explainability": [{"feature": "demo", "weight": 0.5}],
        "rag_memory": [],
        "is_conversational": False,
        "demo_mode": True,
        "fallback_reason": reason,
    }


def orchestrator_result_dict(*, content: str, reason: str) -> Dict[str, Any]:
    ch = content_hash_sha256(content)
    fd = {
        "is_ai_generated": True,
        "confidence": 0.6,
        "detected_model": "demo_fallback",
        "reasoning": reason,
        "denoised_text": "",
        "attribution": {},
        "explainability": [],
        "rag_memory": [],
    }
    return {
        "status": "PROCESSED",
        "risk_score": 0.58,
        "is_ai_generated": True,
        "confidence": 0.6,
        "detected_model": "demo_fallback",
        "graph_context": {"nodes": [], "edges": [], "demo_mode": True},
        "blockchain_hash": None,
        "recommendation": "Review",
        "reasoning": fd["reasoning"],
        "attribution": fd["attribution"],
        "explainability": fd["explainability"],
        "denoised_text": fd["denoised_text"],
        "rag_memory": fd["rag_memory"],
        "intelligence_report": None,
        "forensics": fd,
        "content_hash": ch,
        "demo_mode": True,
        "fallback_reason": reason,
    }


def forensic_summary_dict(*, threat_id: int, stored_risk: float, reason: str) -> Dict[str, Any]:
    styl = stylometry_block(reason=reason)
    signals = [
        "Demo fallback: stylometry block returned synthetic-but-bounded scores for UI continuity.",
        "Replace with live Agent 1 when ONNX / sentence-transformers stack is healthy.",
    ]
    return {
        "threat_id": threat_id,
        "summary": styl["details"],
        "status": "demo_fallback",
        "stored_risk_score": stored_risk,
        "detected_by": "demo_fallback",
        "stylometry": {
            "is_ai": styl.get("is_ai"),
            "risk_score": styl.get("risk_score"),
            "burstiness": styl.get("burstiness"),
            "perplexity": styl.get("perplexity"),
            "artifacts": list(styl.get("artifacts") or []),
            "adversarial_detected": styl.get("adversarial_detected"),
            "adversarial_patterns": list(styl.get("adversarial_patterns") or []),
        },
        "why_signals": signals,
        "demo_mode": True,
        "fallback_reason": reason,
    }


def forensic_analyze_dict(*, threat_id: int, reason: str) -> Dict[str, Any]:
    styl = stylometry_block(reason=reason)
    gemini_off = {"status": "unavailable", "error": reason, "demo_mode": True}
    return {
        "threat_id": threat_id,
        "stylometry": {
            "is_ai_generated": styl["is_ai"],
            "risk_score": styl["risk_score"],
            "burstiness": styl["burstiness"],
            "perplexity": styl["perplexity"],
            "artifacts": styl["artifacts"],
            "adversarial_detected": styl["adversarial_detected"],
            "adversarial_patterns": styl["adversarial_patterns"],
        },
        "blockchain_hash": None,
        "ai_analysis": gemini_off,
        "entities": {},
        "attribution": {},
        "recommendations": ["Restore Gemini / DB and re-run full forensic pass."],
        "demo_mode": True,
        "fallback_reason": reason,
    }


def stylometry_endpoint_dict(*, reason: str) -> Dict[str, Any]:
    return {
        "status": "demo_fallback",
        "analysis": stylometry_block(reason=reason),
        "agent": "Agent 1 - Forensic Investigator (offline)",
        "demo_mode": True,
        "fallback_reason": reason,
    }


def fusion_bundle_dict(*, threat_id: int, reason: str) -> Dict[str, Any]:
    report = {
        "threat_title": "Demo fusion — analyst unavailable",
        "executive_summary": reason,
        "threat_type": "Disinformation",
        "risk_level": "Medium",
        "confidence": 0.55,
        "evidence": [
            {"source": "Agent 1 (Forensics)", "finding": "Heuristic placeholder while fusion service recovers.", "weight": 0.5},
            {"source": "Agent 2 (Graph)", "finding": "No graph context in fallback path.", "weight": 0.2},
        ],
        "recommendations": [
            {"action": "Re-run fusion after API/DB health is green.", "priority": "Routine"},
        ],
    }
    return {
        "report": report,
        "thought_process": [reason],
        "ledger_hash": None,
        "status": "Demo fallback (Agent 3)",
        "demo_mode": True,
        "fallback_reason": reason,
    }


def stix_bundle_json(*, threat_id: int, reason: str) -> str:
    bundle_id = str(uuid.uuid4())
    obj = {
        "type": "bundle",
        "id": f"bundle--{bundle_id}",
        "objects": [
            {
                "type": "report",
                "id": f"report--{bundle_id}",
                "created": _utcnow().isoformat(),
                "name": f"AEGIS demo STIX export (threat {threat_id})",
                "description": reason,
                "labels": ["aegis-demo-fallback"],
            }
        ],
        "demo_mode": True,
        "fallback_reason": reason,
    }
    return json.dumps(obj, indent=2)


def share_result_dict(*, report_id: int, recipient_agency: str, reason: str, shared_by: str) -> Dict[str, Any]:
    return {
        "report_id": report_id,
        "recipient_agency": recipient_agency,
        "ledger_hash": None,
        "status": "demo_fallback",
        "pii_redacted": True,
        "shared_by": shared_by,
        "demo_mode": True,
        "fallback_reason": reason,
    }


def ledger_integrity_dict(*, reason: str) -> Dict[str, Any]:
    return {
        "is_valid": True,
        "status": "DEMO_FALLBACK",
        "timestamp": _utcnow().isoformat(),
        "demo_mode": True,
        "fallback_reason": reason,
    }


def ledger_chain_verify_dict(*, reason: str) -> Dict[str, Any]:
    return {
        "valid": True,
        "blocks_checked": 0,
        "message": f"Demo fallback — {reason}",
        "demo_mode": True,
        "fallback_reason": reason,
    }


def ledger_history_dict(*, reason: str) -> Dict[str, Any]:
    return {
        "entries": [
            {
                "id": -1,
                "previous_hash": "0" * 64,
                "current_hash": "f" * 64,
                "report_id": 0,
                "recipient_agency": "demo-fallback",
                "timestamp": _utcnow().isoformat(),
                "verified": True,
                "content_preview": reason[:100],
            }
        ],
        "total": 1,
        "limit": 100,
        "offset": 0,
        "demo_mode": True,
        "fallback_reason": reason,
    }


def ledger_entry_verify_dict(*, hash_val: str, reason: str) -> Dict[str, Any]:
    return {
        "hash": hash_val,
        "verified": True,
        "report_id": 0,
        "recipient_agency": "demo-fallback",
        "timestamp": _utcnow().isoformat(),
        "previous_hash": "0" * 64,
        "status": True,
        "demo_mode": True,
        "fallback_reason": reason,
    }


def worker_file_process_dict(*, reason: str) -> Dict[str, Any]:
    return {
        "status": "demo_fallback",
        "total_processed": 0,
        "successful": 0,
        "high_risk_items": 0,
        "results": [],
        "demo_mode": True,
        "fallback_reason": reason,
    }


def demo_threat_rows() -> List[Dict[str, Any]]:
    ts = _utcnow().isoformat()
    return [
        {
            "id": -1,
            "content": "Synthetic coordinated inauthentic behavior narrative (demo).",
            "content_hash": "demo" + "0" * 60,
            "risk_score": 0.82,
            "source_platform": "demo_fallback",
            "timestamp": ts,
            "detected_by": "demo_fallback",
        },
        {
            "id": -2,
            "content": "Secondary demo threat for empty / failed DB list.",
            "content_hash": "demo" + "1" * 60,
            "risk_score": 0.71,
            "source_platform": "demo_fallback",
            "timestamp": ts,
            "detected_by": "demo_fallback",
        },
    ]


def demo_threat_detail(threat_id: int) -> Dict[str, Any]:
    ts = _utcnow().isoformat()
    return {
        "id": threat_id,
        "content": f"Demo threat detail for id={threat_id}. Database or row unavailable.",
        "content_hash": content_hash_sha256(f"demo-{threat_id}"),
        "risk_score": 0.65,
        "source_platform": "demo_fallback",
        "timestamp": ts,
        "detected_by": "demo_fallback",
        "demo_mode": True,
        "fallback_reason": "Threat row missing or DB error — showing synthetic record.",
    }


def ai_insight_fallback_dicts(*, reason: str) -> List[Dict[str, Any]]:
    ts = _utcnow()
    return [
        {
            "id": -101,
            "title": "Demo insight — pipeline degraded",
            "description": reason[:500],
            "severity": "warning",
            "category": "system",
            "suggested_actions": ["Check DB and Gemini connectivity", "Re-run insight generation after recovery"],
            "impact_estimate": "UI continuity only",
            "data_source": "demo_fallback",
            "confidence_score": 0.5,
            "created_at": ts,
            "viewed": False,
            "dismissed": False,
            "demo_mode": True,
            "fallback_reason": reason,
        },
        {
            "id": -102,
            "title": "Synthetic monitoring signal",
            "description": "Placeholder insight so dashboards stay populated during outage.",
            "severity": "recommendation",
            "category": "operations",
            "suggested_actions": ["Verify worker and Neo4j health"],
            "impact_estimate": None,
            "data_source": "demo_fallback",
            "confidence_score": 0.45,
            "created_at": ts,
            "viewed": False,
            "dismissed": False,
            "demo_mode": True,
            "fallback_reason": reason,
        },
    ]


def chat_response_dict(*, conversation_id: str, reason: str) -> Dict[str, Any]:
    cid = conversation_id or "demo-fallback"
    return {
        "message": (
            "AI Manager unavailable — demo response. "
            f"Reason: {reason[:280]}"
        ),
        "conversation_id": cid,
        "tool_calls": None,
        "suggestions": ["Retry when LLM credentials and network are healthy."],
        "demo_mode": True,
        "fallback_reason": reason,
    }


def admin_demo_users(*, reason: str) -> List[Dict[str, Any]]:
    ts = _utcnow()
    return [
        {
            "id": -20,
            "email": "demo.admin@aegis.local",
            "full_name": "Demo Admin",
            "role": "admin",
            "is_active": True,
            "status": "approved",
            "created_at": ts,
        },
        {
            "id": -21,
            "email": "demo.analyst@aegis.local",
            "full_name": "Demo Analyst",
            "role": "analyst",
            "is_active": True,
            "status": "approved",
            "created_at": ts,
        },
    ]
