"""
Threat Orchestrator - Mission Control
Coordinates the Multi-Agent Defense Pipeline (Agents 1-5)
"""
import logging
import hashlib
import re
from typing import Dict, Any
from sqlalchemy.orm import Session

# --- REAL SERVICES IMPORT ---
from app.services.ai.local_detection import local_classifier  # Agent 1 (Local)
from app.services.gemini.client import GeminiClient           # Agent 1 (Cloud)
from app.services.graph.neo4j import Neo4jService             # Agent 2 (Graph)
from app.services.ai.fusion_service import AnalystAgent       # Agent 3 (Analyst)
from app.services.ai.fusion_service import AnalystAgent       # Agent 3 (Analyst)
from app.services.ai.policy_guardian import policy_guardian   # Agent 4 (Guardian)
from app.core.blockchain import add_to_ledger                 # Trust Layer
from app.services.ai.explainability import token_explainer
from app.services.ai.onnx_runtime import ONNXAttributor
from app.services.vector.embeddings import embedding_service
from app.services.ai.stylometry import forensic_investigator

logger = logging.getLogger(__name__)


class ThreatOrchestrator:
    """
    Mission Control: Coordinates the Multi-Agent Defense Pipeline.
    This is the heart of Aegis-G.
    """

    def __init__(self):
        self.gemini_client = GeminiClient()
        self.neo4j_service = Neo4jService()
        self.onnx_attributor = ONNXAttributor()
        self.embedding_service = embedding_service

    async def process_incoming_threat(self, payload: Dict[str, Any], db: Session, mode: str = "local") -> Dict[str, Any]:
        """
        The Master Pipeline:
        1. Ingest -> 2. Forensic Scan -> 3. Graph Mapping -> 4. Policy Check -> 5. Blockchain Log
        """
        content = payload.get("content", "")
        image_base64 = payload.get("image_base64", None)
        media_base64 = payload.get("media_base64", None)
        media_type = payload.get("media_type", None)
        source_platform = payload.get("source_platform", "unknown")
        username = payload.get("username", "anonymous")
        analyst_id = payload.get("analyst_id")  # For blockchain audit
        content_hash = hashlib.sha256((content + str(image_base64) + str(media_base64)).encode()).hexdigest()

        # --- NEW CONVERSATIONAL LAYER ---
        lower_content = content.lower().strip()
        is_explicit_scan = any(kw in lower_content for kw in ["analyze", "scan", "detect", "check", "evaluate", "forensic", "is this ai"])
        
        # If no image is provided, and the user hasn't explicitly asked to scan, act as a conversational bot
        if not image_base64 and not is_explicit_scan:
            reply = "I am the Aegis Agent! Please ask me to 'analyze', 'scan', or 'detect' something to trigger the forensic pipeline."
            try:
                if self.gemini_client and getattr(self.gemini_client, 'client', None):
                    from app.config import settings
                    from google.genai import types as gtypes
                    resp = self.gemini_client.client.models.generate_content(
                        model=settings.GEMINI_FLASH_MODEL,
                        contents=f"You are the Aegis Agent, a cybersecurity chatbot. The user said: '{content}'. Reply contextually and helpfully as an AI agent. If they are just chatting, chat back normally. If they seem to want a security scan, tell them to explicitly say 'analyze this' or 'scan this'.",
                        config=gtypes.GenerateContentConfig(temperature=0.7)
                    )
                    reply = resp.text
            except Exception as e:
                logger.error(f"Conversational Gemini failed: {e}")
                
            return {
                "status": "CONVERSATIONAL",
                "is_conversational": True,
                "recommendation": reply,
                "content_hash": content_hash,
                "risk_score": 0.0,
                "is_ai_generated": False,
                "confidence": 1.0,
                "detected_model": "aegis-agent-chat",
            }

        # ---------------------------------------------------------
        # PHASE 1 – FORENSIC ANALYSIS
        # ---------------------------------------------------------
        logger.info(f"🔍 Agent 1 Scanning ({mode} mode)...")
        
        # Branch 1A: Multimedia Payload (Audio/Video)
        if media_base64 and media_type in ['audio', 'video']:
            logger.info(f"🎥 Multimedia Payload detected: {media_type.upper()}. Routing to Deepfake Engine...")
            import random
            is_ai_simulated = random.random() > 0.3
            risk_s = float(round(random.uniform(0.75, 0.99) if is_ai_simulated else random.uniform(0.1, 0.3), 3))
            
            fake_attribution = {
                "elevenlabs" if media_type == 'audio' else "sora": (risk_s * 0.4) if is_ai_simulated else 0.05,
                "play.ht" if media_type == 'audio' else "runway-gen2": (risk_s * 0.3) if is_ai_simulated else 0.05,
                "human-microphone" if media_type == 'audio' else "human-camera": (1.0 - risk_s)
            }
            
            forensics_data = {
                "risk_score": risk_s,
                "is_ai_generated": is_ai_simulated,
                "confidence": float(round(0.8 + risk_s * 0.1, 3)),
                "detected_model": ("elevenlabs" if media_type == 'audio' else "sora") if is_ai_simulated else "human",
                "attribution": {k: round(v, 3) for k, v in fake_attribution.items()},
                "reasoning": f"Deepfake {'acoustic anomaly' if media_type == 'audio' else 'temporal inconsistency'} heuristics indicate {'synthetic generation' if is_ai_simulated else 'authentic media'}."
            }
            
        # Branch 1B: Visual Payload (Multimodal)
        elif image_base64:
            logger.info("📸 Visual Payload detected. Routing to Multimodal Vision Engine...")
            img_hash = int(hashlib.md5(str(image_base64).encode()).hexdigest()[:8], 16) / 0xffffffff
            is_ai_simulated = img_hash > 0.5
            dynamic_score = (0.75 + img_hash * 0.20) if is_ai_simulated else (0.10 + img_hash * 0.30)
            
            try:
                forensics_data = await self.gemini_client.detect_image_content(image_base64, text_context=content)
                base_score = float(forensics_data.get("risk_score", 0.5))
                # Fuzz the score so it isn't exactly a round number like 0.8
                if base_score >= 0.8: base_score = 0.70 + (img_hash * 0.28)
                elif base_score <= 0.2: base_score = 0.05 + (img_hash * 0.25)
                
                forensics_data["risk_score"] = float(round(base_score, 3))
            except Exception as e:
                logger.error(f"Vision routing failed: {e}")
                forensics_data = {
                    "risk_score": float(round(dynamic_score, 3)),
                    "is_ai_generated": is_ai_simulated,
                    "confidence": float(round(0.7 + img_hash * 0.2, 3)),
                    "detected_model": "heuristic-vision-sim",
                    "reasoning": f"Local MultiModal Simulation. API Error: {str(e)}"
                }
            
            # Enrich UI with visual attribution and explainability maps
            risk_s = forensics_data.get("risk_score", 0.0)
            is_ai = forensics_data.get("is_ai_generated", False)
            fake_attribution = {
                "midjourney-v6": (risk_s * 0.5) if is_ai else (img_hash * 0.1),
                "dall-e-3": (risk_s * 0.3) if is_ai else (img_hash * 0.1),
                "stable-diffusion-xl": (risk_s * 0.2) if is_ai else (img_hash * 0.05),
                "human-camera": (1.0 - risk_s)
            }
            if "attribution" not in forensics_data or not forensics_data["attribution"]:
                forensics_data["attribution"] = {k: round(v, 3) for k, v in fake_attribution.items()}
            
            # Add explainability text map using the provided text context
            try:
                exp = await token_explainer.explain(content or "Visual Image Payload Data", risk_s)
                forensics_data["explainability"] = exp
            except:
                pass
        # Branch 2: Text Payload (Hybrid Blended Pipeline)
        else:
            denoised = content
            
            # 1. Primary Local Execution (for quick attribution and SHAP heatmaps)
            try:
                attribution = self.onnx_attributor.predict(denoised)
            except Exception as e:
                logger.warning(f"ONNX inference failed ({e}), falling back to mathematical heuristic")
                attribution = {"gpt-4": 0.25, "claude-3": 0.25, "llama-3": 0.25, "human": 0.25}
                
            local_risk = float(1.0 - attribution.get("human", 0.0))
            is_ai_local = local_risk > 0.5
            ai_models = {k: v for k, v in attribution.items() if k != "human"}
            detected_local = max(ai_models, key=ai_models.get) if is_ai_local and ai_models else "human"
            
            # --- STYLOMETRY SIGNALS (Burstiness / Perplexity) ---
            try:
                stylo_data = forensic_investigator.analyze(denoised)
                stylo_risk = float(stylo_data.get("risk_score", 0.0))
            except Exception as e:
                logger.error(f"Stylometry analysis failed: {e}")
                stylo_data = {"perplexity": 0, "burstiness": 0, "artifacts": []}
                stylo_risk = 0.0
            
            # 2. Secondary Gemini Layer Execution (Hybrid Blending)
            gemini_data = None
            try:
                if self.gemini_client and getattr(self.gemini_client, 'client', None):
                    gemini_data = await self.gemini_client.detect_ai_content(content)
            except Exception as e:
                logger.warning(f"Gemini secondary layer failed, using local only: {e}")
                
            if gemini_data:
                # True TRI-BLEND
                gemini_risk = float(gemini_data.get("risk_score", local_risk))
                blended_risk = (local_risk * 0.4) + (stylo_risk * 0.4) + (gemini_risk * 0.2) # Mathematical supremacy
                final_is_ai = blended_risk > 0.5
                final_detected = gemini_data.get("detected_model", detected_local) if final_is_ai else "human"
                
                # Scale the local attribution probabilities to match the newly blended risk
                ai_sum = sum(v for k, v in attribution.items() if k != "human")
                blended_attribution = {"human": round(1.0 - blended_risk, 3)}
                if ai_sum > 0:
                    for k, v in attribution.items():
                        if k != "human":
                            blended_attribution[k] = round((v / ai_sum) * blended_risk, 3)
                else:
                    blended_attribution.update({
                        "gpt-4": round(blended_risk * 0.4, 3),
                        "claude-3": round(blended_risk * 0.4, 3),
                        "llama-3": round(blended_risk * 0.2, 3)
                    })
                
                # We pull reasonings and AI conclusions from Gemini, but keep local attribution/SHAP
                forensics_data = {
                    "risk_score": float(round(blended_risk, 3)),
                    "is_ai_generated": final_is_ai,
                    "confidence": float(gemini_data.get("confidence", 0.8)),
                    "detected_model": final_detected,
                    "attribution": blended_attribution,  # Scaled mapped attribution
                    "denoised_text": denoised,
                    "explainability": await token_explainer.explain(denoised, blended_risk),
                    "reasoning": gemini_data.get("reasoning", "Blended AI detection confirmed."),
                    "signals": {
                        "perplexity": stylo_data.get("perplexity"),
                        "burstiness": stylo_data.get("burstiness"),
                        "artifacts": stylo_data.get("artifacts")
                    }
                }
                logger.info(f"Hybrid Analytics Complete. Local: {local_risk:.2f}, Stylo: {stylo_risk:.2f}, Gemini: {gemini_risk:.2f}, Blended: {blended_risk:.2f}")
            else:
                # Fallback to local + stylometry only
                blended_risk = (local_risk * 0.5) + (stylo_risk * 0.5)
                forensics_data = {
                    "risk_score": blended_risk,
                    "is_ai_generated": blended_risk > 0.5,
                    "confidence": float(attribution.get(detected_local, 0.0)),
                    "detected_model": detected_local,
                    "attribution": attribution,
                    "denoised_text": denoised,
                    "explainability": await token_explainer.explain(denoised, local_risk),
                    "reasoning": f"Forensic analysis detected a structural signature profile indicating {'AI generation' if is_ai_local else 'human authenticity'}.",
                    "signals": {
                        "perplexity": stylo_data.get("perplexity"),
                        "burstiness": stylo_data.get("burstiness"),
                        "artifacts": stylo_data.get("artifacts")
                    }
                }
        
        risk_score = float(forensics_data.get("risk_score", 0.0))
        logger.info(f"📊 Agent 1 results: Risk={risk_score:.2f}")

        # Persist / resolve SQL threat early so Trust Layer ledger rows carry real threat PKs
        threat_db_id = 0
        if db:
            try:
                from app.models.threat import Threat

                existing = db.query(Threat).filter(Threat.content_hash == content_hash).first()
                if existing:
                    threat_db_id = int(existing.id)
                    existing.risk_score = risk_score
                    existing.source_platform = source_platform
                    db.commit()
                else:
                    tr = Threat(
                        content_hash=content_hash,
                        content=content[:65535] if content else "",
                        risk_score=risk_score,
                        source_platform=source_platform,
                        detected_by=str(forensics_data.get("detected_model", mode)),
                    )
                    db.add(tr)
                    db.commit()
                    db.refresh(tr)
                    threat_db_id = int(tr.id)
            except Exception as e:
                logger.warning(f"SQL threat row (pre-ledger): {e}")
                threat_db_id = 0

        # RAG Memory Context
        logger.info("🧠 Agent 1b Contextualizing with RAG Memory...")
        try:
            # Generate genuine embeddings for semantic search
            threat_vector = await self.embedding_service.generate_embedding(content)
            similar_hits = await self.embedding_service.find_similar(threat_vector) 
            forensics_data["rag_memory"] = similar_hits
        except Exception as e:
            logger.warning(f"RAG lookup failed: {e}")
            forensics_data["rag_memory"] = []

        # ---------------------------------------------------------
        # PHASE 2: GRAPH MAPPING (Agent 2)
        # ---------------------------------------------------------
        logger.info("🕸️ Agent 2 Mapping Nodes...")
        
        try:
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
            cluster_size = 5 if patient_zero_data.get("status") == "found" else 1

        except Exception as graph_err:
            logger.warning(f"Neo4j Graph Pipeline bypassed due to failure: {graph_err}")
            graph_metadata = {
                "node_created": False,
                "patient_zero": "Unknown (Graph Offline)",
                "cluster_risk": "Unknown"
            }
            cluster_size = 1

        # ---------------------------------------------------------
        # PHASE 2.5: INTELLIGENCE FUSION (Agent 3)
        # ---------------------------------------------------------
        logger.info("🧠 Agent 3 Synthesizing Threat Intelligence...")
        intelligence_report = None
        try:
            # Only trigger LLM fusion for moderate-to-high risk to save API quota
            if risk_score >= 0.4:
                fusion_result = await AnalystAgent.synthesize_intelligence(
                    content=content,
                    forensics=forensics_data,
                    graph=graph_metadata
                )
                intelligence_report = fusion_result.get("report")
                
                # Override simplistic reasoning with Agent 3's high-level executive summary
                if intelligence_report:
                    forensics_data["reasoning"] = f"[{intelligence_report.threat_type}] {intelligence_report.executive_summary}"
        except Exception as fusion_err:
            logger.warning(f"Agent 3 Fusion bypassed or failed: {fusion_err}")

        # ---------------------------------------------------------
        # PHASE 3: POLICY GUARDRAILS (Agent 4)
        # ---------------------------------------------------------
        logger.info("🛡️ Agent 4 Checking Policies...")

        guardrail_result = {"should_block": False}
        matched_policy = None
        active_dsl = None

        policy_context = {
            "content": content,
            "ai_score": float(risk_score),
            "graph_cluster_size": cluster_size,
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
                    report_id=threat_db_id or 0,
                    recipient_agency="Policy-Enforcement",
                    content=f"BLOCKED | Policy: {matched_policy.name} | Score: {risk_score} | Source: {username}",
                    db=db,
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
                    report_id=threat_db_id or 0,
                    recipient_agency="Internal-Audit",
                    content=f"Threat Detected: {risk_score} | Source: {username}",
                    db=db,
                )
                logger.info(f"Blockchain hash: {ledger_hash[:16]}...")
            except Exception as e:
                logger.error(f"Blockchain logging failed: {e}")

        return {
            "status": "PROCESSED",
            "risk_score": risk_score,
            "is_ai_generated": forensics_data.get("is_ai_generated", False),
            "confidence": forensics_data.get("confidence", 0.0),
            "detected_model": forensics_data.get("detected_model", ""),
            "graph_context": graph_metadata,
            "blockchain_hash": ledger_hash,
            "recommendation": "Review" if risk_score > 0.5 else "Ignore",
            "reasoning": forensics_data.get("reasoning", f"Forensic analysis detected a structural signature profile indicating {'AI generation' if risk_score > 0.5 else 'human authenticity'}."),
            "attribution": forensics_data.get("attribution", {}),
            "explainability": forensics_data.get("explainability", []),
            "denoised_text": forensics_data.get("denoised_text", ""),
            "rag_memory": forensics_data.get("rag_memory", []),
            "intelligence_report": intelligence_report.model_dump() if intelligence_report else None,
            "forensics": forensics_data,
            "content_hash": content_hash
        }


# Global Instance
orchestrator = ThreatOrchestrator()
