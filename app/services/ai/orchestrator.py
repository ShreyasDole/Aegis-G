"""
Threat Orchestrator - Mission Control
Coordinates the Multi-Agent Defense Pipeline (Agents 1-5)
"""
import logging
import hashlib
from typing import Dict, Any
from sqlalchemy.orm import Session

# --- REAL SERVICES IMPORT ---
from app.services.ai.local_detection import local_classifier  # Agent 1 (Local)
from app.services.gemini.client import GeminiClient           # Agent 1 (Cloud)
from app.services.graph.neo4j import Neo4jService             # Agent 2 (Graph)
from app.services.ai.fusion_service import AnalystAgent       # Agent 3 (Analyst)
from app.services.ai.policy_guardian import policy_guardian   # Agent 4 (Guardian)
from app.core.blockchain import add_to_ledger                 # Trust Layer

logger = logging.getLogger(__name__)


class ThreatOrchestrator:
    """
    Mission Control: Coordinates the Multi-Agent Defense Pipeline.
    This is the heart of Aegis-G.
    """

    def __init__(self):
        self.gemini_client = GeminiClient()
        self.neo4j_service = Neo4jService()

    async def process_incoming_threat(self, payload: Dict[str, Any], db: Session, mode: str = "local") -> Dict[str, Any]:
        """
        The Master Pipeline:
        1. Ingest -> 2. Forensic Scan -> 3. Graph Mapping -> 4. Policy Check -> 5. Blockchain Log
        """
        content = payload.get("content", "")
        image_base64 = payload.get("image_base64", None)
        source_platform = payload.get("source_platform", "unknown")
        username = payload.get("username", "anonymous")
        analyst_id = payload.get("analyst_id")  # For blockchain audit
        content_hash = hashlib.sha256((content + str(image_base64)).encode()).hexdigest()

        # ---------------------------------------------------------
        # PHASE 1 – FORENSIC ANALYSIS
        # ---------------------------------------------------------
        logger.info(f"🔍 Agent 1 Scanning ({mode} mode)...")
        
        # Branch 1: Visual Payload (Multimodal)
        if image_base64:
            logger.info("📸 Visual Payload detected. Routing to Multimodal Vision Engine...")
            try:
                forensics_data = await self.gemini_client.detect_image_content(image_base64, text_context=content)
            except Exception as e:
                logger.error(f"Vision routing failed: {e}")
                forensics_data = {
                    "risk_score": 0.8,
                    "is_ai_generated": True,
                    "confidence": 0.7,
                    "detected_model": "unknown_vision_error",
                    "reasoning": f"Could not process visual payload: {str(e)}"
                }
        # Branch 2: Text Payload (Local or Cloud)
        else:
            if mode == "local":
                denoised = self.denoiser.normalize(content)
                if self.onnx_attributor:
                    try:
                        attribution = self.onnx_attributor.predict(denoised)
                    except Exception as e:
                        logger.warning(
                            f"ONNX inference failed ({e}), falling back to PyTorch model"
                        )
                        attribution = self.attributor.predict(denoised)
                else:
                    attribution = self.attributor.predict(denoised)
                risk_score_text = max(attribution.values()) if attribution else 0.0
                forensics_data = {
                    "risk_score": risk_score_text,
                    "is_ai_generated": any(
                        attribution.get(model, 0) > 0.5 for model in ["gpt-4", "claude-3", "llama-3"]
                    ),
                    "confidence": risk_score_text,
                    "detected_model": max(attribution, key=attribution.get) if attribution else "unknown",
                    "attribution": attribution,
                    "denoised_text": denoised,
                    "explainability": await token_explainer.explain(denoised, risk_score_text),
                }
            else:
                # Cloud fallback – use Gemini text
                try:
                    forensics_data = await self.gemini_client.detect_ai_content(content)
                except Exception as e:
                    logger.error(f"Gemini text failed, falling back to local: {e}")
                    denoised = self.denoiser.normalize(content)
                    attribution = self.attributor.predict(denoised)
                    risk_score_text = max(attribution.values())
                    forensics_data = {
                        "risk_score": risk_score_text,
                        "is_ai_generated": any(
                            attribution.get(model, 0) > 0.5 for model in ["gpt-4", "claude-3", "llama-3"]
                        ),
                        "confidence": risk_score_text,
                        "detected_model": max(attribution, key=attribution.get),
                        "attribution": attribution,
                        "denoised_text": denoised,
                        "explainability": await token_explainer.explain(denoised, risk_score_text),
                    }
        
        risk_score = float(forensics_data.get("risk_score", 0.0))
        logger.info(f"📊 Agent 1 results: Risk={risk_score:.2f}")

        # RAG Memory Context
        logger.info("🧠 Agent 1b Contextualizing with RAG Memory...")
        try:
            # We skip real embeddings generation and just pass mock vector array for performance in dev
            similar_hits = await self.embedding_service.find_similar([]) 
            forensics_data["rag_memory"] = similar_hits
        except Exception as e:
            logger.warning(f"RAG lookup failed: {e}")
            forensics_data["rag_memory"] = []

        # ---------------------------------------------------------
        # PHASE 2: GRAPH MAPPING (Agent 2)
        # ---------------------------------------------------------
        logger.info("🕸️ Agent 2 Mapping Nodes...")
        
        # Create/Update the User Node in Neo4j
        await self.neo4j_service.create_node({
            "id": username,
            "label": username,
            "type": "User",
            "properties": {
                "risk_score": risk_score,
                "platform": source_platform,
                "last_seen": "now()"
            }
        })

        # Create Post node and link to User
        from datetime import datetime
        await self.neo4j_service.create_post_node(
            content_hash=content_hash,
            user_id=username,
            timestamp=datetime.utcnow(),
            risk_score=risk_score
        )

        # Create SIMILAR_TO edges to other high-risk posts on same platform (Louvain signal)
        if risk_score > 0.5:
            await self.neo4j_service.create_similar_to_edges(
                post_hash=content_hash,
                platform=source_platform,
                risk_score=risk_score
            )

        # Check for Botnet Clusters (Patient Zero)
        patient_zero_data = await self.neo4j_service.find_patient_zero(content_hash)
        
        graph_metadata = {
            "node_created": True,
            "patient_zero": patient_zero_data.get("username", "Self") if patient_zero_data.get("status") == "found" else "Self",
            "cluster_risk": "High" if patient_zero_data.get("status") == "found" else "Low"
        }

        # ---------------------------------------------------------
        # PHASE 3: POLICY GUARDRAILS (Agent 4)
        # ---------------------------------------------------------
        logger.info("🛡️ Agent 4 Checking Policies...")

        guardrail_result = {"should_block": False}
        matched_policy = None
        active_dsl = None

        policy_context = {
            "content": content,
            "ai_score": round(risk_score * 100, 2),  # normalize to 0-100 to match DSL syntax (e.g. ai_score > 85)
            "graph_cluster_size": 5 if patient_zero_data.get("status") == "found" else 1,
        }

        if db:
            try:
                from app.models.ai import AIPolicy
                active_policies = (
                    db.query(AIPolicy)
                    .filter(AIPolicy.is_active == True)
                    .order_by(AIPolicy.priority.desc())
                    .all()
                )
                logger.info(f"Loaded {len(active_policies)} active firewall rules.")

                for policy in active_policies:
                    active_dsl = policy.translated_dsl or policy.content
                    if not active_dsl:
                        continue
                    result = policy_guardian.execute_dsl_rule(active_dsl, policy_context)
                    if result.get("should_block"):
                        guardrail_result = result
                        guardrail_result["reason"] = f"Violated active policy: {policy.name}"
                        matched_policy = policy
                        break

            except Exception as e:
                logger.warning(f"Could not fetch active policies from DB: {e}")

        if guardrail_result.get("should_block") and matched_policy:
            logger.warning(f"🚫 BLOCKED by Agent 4: {guardrail_result.get('reason')}")

            try:
                from app.models.ai import BlockedContent
                blocked_record = BlockedContent(
                    content_hash=content_hash,
                    content_preview=content[:500],
                    source_platform=source_platform,
                    source_username=username,
                    policy_id=matched_policy.id,
                    policy_name=matched_policy.name,
                    rule_name=f"rule_{matched_policy.id:02d}.aegis",
                    dsl_logic=active_dsl,
                    matched_conditions=str(guardrail_result.get("matched_conditions", [])),
                    action_taken="BLOCK_AND_LOG",
                    ai_score=risk_score,
                    graph_cluster_size=policy_context["graph_cluster_size"],
                    narrative_keywords=str(guardrail_result.get("matched_conditions", [])),
                )
                db.add(blocked_record)
                db.commit()
                db.refresh(blocked_record)

                from app.routers.websocket import notify_blocked_content
                import asyncio
                asyncio.create_task(notify_blocked_content({
                    "id": blocked_record.id,
                    "content_preview": blocked_record.content_preview,
                    "policy_name": matched_policy.name,
                    "action_taken": "BLOCK_AND_LOG",
                    "blocked_at": blocked_record.blocked_at.isoformat() if blocked_record.blocked_at else None,
                    "source_platform": source_platform,
                }))
            except Exception as db_err:
                logger.error(f"Failed to write block log to DB: {db_err}")

            # Also mint a blockchain block for blocked content
            try:
                ledger_hash = await add_to_ledger(
                    report_id=0,
                    recipient_agency="Policy-Enforcement",
                    content=f"BLOCKED | Policy: {matched_policy.name} | Score: {risk_score} | Source: {username}"
                )
                logger.info(f"Blockchain block minted for blocked content: {ledger_hash[:16]}...")
            except Exception as e:
                logger.error(f"Blockchain logging failed for blocked content: {e}")

            return {
                "status": "BLOCKED",
                "risk_score": risk_score,
                "action": guardrail_result,
                "forensics": forensics_data,
                "graph_context": graph_metadata,
                "content_hash": content_hash,
            }

        # ---------------------------------------------------------
        # PHASE 4: IMMUTABLE AUDIT (Trust Layer)
        # ---------------------------------------------------------
        # Only log High Risk items to Blockchain to save resources
        ledger_hash = None
        if risk_score > 0.7:
            logger.info("🔗 High Risk Detected - Mining Block...")
            try:
                ledger_hash = await add_to_ledger(
                    report_id=0,  # In prod, this comes from DB ID
                    recipient_agency="Internal-Audit",
                    content=f"Threat Detected: {risk_score} | Source: {username}"
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
            "content_hash": content_hash
        }


# Global Instance
orchestrator = ThreatOrchestrator()
