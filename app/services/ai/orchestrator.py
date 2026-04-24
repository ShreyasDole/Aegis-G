# app/services/ai/orchestrator.py
"""Threat Orchestrator – core pipeline for Phase 1.

Coordinates the multi‑agent defense workflow:
1️⃣ Denoising + attribution (local or ONNX)
2️⃣ Graph mapping (Neo4j)
3️⃣ Policy guardrails
4️⃣ Immutable audit (blockchain)
"""

import logging
from datetime import datetime
import hashlib
from typing import Dict, Any
from sqlalchemy.orm import Session

# Real services imports
from app.services.gemini.client import GeminiClient  # Cloud AI fallback
from app.services.graph.neo4j import neo4j_service as _neo4j_singleton  # Safe singleton
from app.services.ai.fusion_service import AnalystAgent  # Analyst agent (placeholder)
from app.services.ai.policy_guardian import policy_guardian  # Policy engine
from app.core.blockchain import add_to_ledger  # Trust layer

# Phase 1 components (optional heavy deps handled inside the classes)
from app.services.ai.denoiser import AdversarialDenoiser
from app.services.ai.attribution import MultiClassAttributor
from app.services.ai.onnx_runtime import ONNXAttributor
from app.services.ai.explainability import token_explainer
from app.services.vector.embeddings import EmbeddingService

logger = logging.getLogger(__name__)


class ThreatOrchestrator:
    """Mission Control – coordinates the multi‑agent defense pipeline.
    """

    def __init__(self):
        # Core services
        self.gemini_client = GeminiClient()
        self.neo4j_service = _neo4j_singleton  # BUG FIX: use SafeNeo4jService singleton
        self.analyst_agent = AnalystAgent()
        self.policy_guardian = policy_guardian

        # Phase 1 & 2 services – ONNX is optional
        self.denoiser = AdversarialDenoiser()
        self.attributor = MultiClassAttributor()
        self.embedding_service = EmbeddingService()
        try:
            self.onnx_attributor = ONNXAttributor()
        except Exception as e:
            self.onnx_attributor = None
            logger.warning(f"ONNXAttributor not available ({e}); will use PyTorch fallback.")

    async def process_incoming_threat(
        self, payload: Dict[str, Any], db: Session, mode: str = "local"
    ) -> Dict[str, Any]:
        """Run the full pipeline for a single incoming threat.

        Returns a dict suitable for the API response.
        """
        content = payload.get("content", "")
        source_platform = payload.get("source_platform", "unknown")
        username = payload.get("username", "anonymous")
        analyst_id = payload.get("analyst_id")  # For blockchain audit
        content_hash = hashlib.sha256(content.encode()).hexdigest()

        # ---------------------------------------------------------
        # PHASE 1 – FORENSIC ANALYSIS
        # ---------------------------------------------------------
        logger.info(f"🔍 Agent 1 Scanning ({mode} mode)...")
        forensics_data = None
        
        if mode == "cloud" or mode == "gemini":
            try:
                media_bytes = payload.get("media_bytes")
                mime_type = payload.get("mime_type")
                forensics_data = await self.gemini_client.detect_multimodal_content(content, media_bytes, mime_type)
            except Exception as e:
                logger.error(f"Gemini failed, falling back to local: {e}")
                mode = "local" # Fallback to local
                
        if mode == "local" or not forensics_data:
            denoised = self.denoiser.normalize(content)
            if self.onnx_attributor:
                try:
                    attribution = self.onnx_attributor.predict(denoised)
                except Exception as e:
                    logger.warning(f"ONNX inference failed ({e}), falling back to PyTorch model")
                    attribution = self.attributor.predict(denoised)
            else:
                attribution = self.attributor.predict(denoised)
            risk_score = float(max(attribution.values()) if attribution else 0.0)
            forensics_data = {
                "risk_score": risk_score,
                "is_ai_generated": any(attribution.get(model, 0) > 0.5 for model in ["gpt-4", "claude-3", "llama-3"]),
                "confidence": risk_score,
                "detected_model": max(attribution, key=attribution.get) if attribution else "unknown",
                "attribution": attribution,
                "denoised_text": denoised,
                "explainability": await token_explainer.explain(denoised, risk_score),
            }

        risk_score = float(forensics_data.get("risk_score", 0.0))
        logger.info(f"📊 Agent 1 results: Risk={risk_score:.2f}")

        # RAG Memory Context — generate real embedding and query pgvector ANN
        logger.info("🧠 Agent 1b Contextualizing with RAG Memory...")
        try:
            rag_embedding = await self.embedding_service.generate_embedding(denoised)
            similar_hits = await self.embedding_service.find_similar(rag_embedding)
            forensics_data["rag_memory"] = similar_hits
        except Exception as e:
            logger.warning(f"RAG lookup failed: {e}")
            forensics_data["rag_memory"] = []

        # ---------------------------------------------------------
        # ASYNC SAVE FOR RAG MEMORY RECORDING
        # ---------------------------------------------------------
        try:
            await self._save_to_pgvector(content_hash, content, risk_score, source_platform, db)
        except Exception as e:
            logger.warning(f"Could not persist to memory bank: {e}")

        # ---------------------------------------------------------
        # PHASE 2 – GRAPH MAPPING (Neo4j)
        # ---------------------------------------------------------
        logger.info("🕸️ Agent 2 Mapping Nodes...")
        graph_metadata = {
            "node_created": False,
            "patient_zero": "Self",
            "cluster_risk": "Low",
        }
        patient_zero_data = {}
        try:
            await self.neo4j_service.create_node(
                {
                    "id": username,
                    "label": username,
                    "type": "User",
                    "properties": {
                        "risk_score": risk_score,
                        "platform": source_platform,
                        "last_seen": "now()",
                    },
                }
            )
            await self.neo4j_service.create_post_node(
                content_hash=content_hash,
                user_id=username,
                timestamp=datetime.utcnow(),
                risk_score=risk_score,
            )
            patient_zero_data = await self.neo4j_service.find_patient_zero(content_hash)
            graph_metadata = {
                "node_created": True,
                "patient_zero": (
                    patient_zero_data.get("username", "Self")
                    if patient_zero_data.get("status") == "found"
                    else "Self"
                ),
                "cluster_risk": "High"
                if patient_zero_data.get("status") == "found"
                else "Low",
            }
        except Exception as e:
            logger.warning(f"Neo4j Agent 2 mapping failed ({e}). Graph metadata will be limited.")

        # ---------------------------------------------------------
        # PHASE 3 – POLICY GUARDRAILS
        # ---------------------------------------------------------
        logger.info("🛡️ Agent 4 Checking Policies...")
        active_dsl = "IF ai_score > 0.85 THEN BLOCK_AND_LOG"  # Default fallback
        if db:
            try:
                from app.models.ai import AIPolicy

                policy = (
                    db.query(AIPolicy)
                    .filter(AIPolicy.is_active == True)
                    .order_by(AIPolicy.priority.desc())
                    .first()
                )
                if policy and (policy.translated_dsl or policy.content):
                    active_dsl = policy.translated_dsl or policy.content
                    logger.info(f"Using active policy: {policy.name}")
            except Exception as e:
                logger.warning(f"Could not fetch active policy from DB: {e}")
        policy_context = {
            "content": content,
            "ai_score": risk_score,
            "graph_cluster_size": 1
            if patient_zero_data.get("status") == "not_found"
            else 5,
        }
        guardrail_result = self.policy_guardian.execute_dsl_rule(active_dsl, policy_context)
        if guardrail_result.get("should_block"):
            logger.warning(
                f"🚫 BLOCKED by Policy: {guardrail_result.get('reason', 'Policy violation')}"
            )
            return {
                "status": "BLOCKED",
                "risk_score": risk_score,
                "action": guardrail_result,
                "forensics": forensics_data,
                "graph_context": graph_metadata,
            }

        # ---------------------------------------------------------
        # PHASE 4 – IMMUTABLE AUDIT (blockchain)
        # ---------------------------------------------------------
        ledger_hash = None
        if risk_score > 0.7:
            logger.info("🔗 High Risk Detected - Mining Block...")
            try:
                ledger_hash = await add_to_ledger(
                    report_id=0,
                    recipient_agency="Internal-Audit",
                    content=f"Threat Detected: {risk_score} | Source: {username}",
                    db=db,
                    analyst_id=analyst_id,
                )
                logger.info(f"Blockchain hash: {ledger_hash[:16]}...")
            except Exception as e:
                logger.error(f"Blockchain logging failed: {e}")

        return {
            "status": "PROCESSED",
            "risk_score": risk_score,
            "is_ai_generated": forensics_data.get("is_ai_generated", False),
            "graph_context": graph_metadata,
            "blockchain_hash": ledger_hash,
            "recommendation": "Review" if risk_score > 0.5 else "Ignore",
            "forensics": forensics_data,
            "content_hash": content_hash,
            # UI‑friendly extra fields
            "denoised_text": forensics_data.get("denoised_text", ""),
            "attribution": forensics_data.get("attribution", {}),
            "explainability": forensics_data.get("explainability", []),
            "rag_memory": forensics_data.get("rag_memory", []),
            "timestamp": datetime.utcnow(),
        }
        
    async def _save_to_pgvector(self, content_hash: str, content: str, risk: float, platform: str, db: Session):
        """Save threat to PGVector to power future RAG searches."""
        if not db:
            return
        try:
            from app.models.threat import Threat
            import numpy as np
            
            # Use real sentence-transformers to calculate the pgvector array
            vector = await self.embedding_service.generate_embedding(content)
            
            # Upsert into PostgreSQL Database
            threat_entry = db.query(Threat).filter(Threat.content_hash == content_hash).first()
            if not threat_entry:
                new_threat = Threat(
                    content_hash=content_hash,
                    content=content,
                    risk_score=risk,
                    source_platform=platform,
                    embedding=vector
                )
                db.add(new_threat)
                db.commit()
        except Exception as e:
            logger.error(f"Failed to save RAG vector: {e}")
            if db:
                db.rollback()


# Global singleton instance used by the API router
orchestrator = ThreatOrchestrator()
