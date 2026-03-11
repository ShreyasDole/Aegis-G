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
from app.services.ai.stylometry import forensic_investigator  # Agent 1 (Stylometry)

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
        source_platform = payload.get("source_platform", "unknown")
        username = payload.get("username", "anonymous")
        
        # Generate ID if not present
        content_hash = hashlib.sha256(content.encode()).hexdigest()

        # ---------------------------------------------------------
        # PHASE 1: FORENSIC ANALYSIS (Agent 1)
        # ---------------------------------------------------------
        logger.info(f"🔍 Agent 1 Scanning ({mode} mode)...")

        if mode == "local":
            # Uses Offline ONNX Model
            forensics_data = await local_classifier.predict(content)
        else:
            # Uses Google Gemini Cloud
            try:
                forensics_data = await self.gemini_client.detect_ai_content(content)
            except Exception as e:
                logger.error(f"Gemini failed, falling back to local: {e}")
                forensics_data = await local_classifier.predict(content)

        risk_score = forensics_data.get("risk_score", 0.0)
        logger.info(f"📊 Agent 1 results: Risk={risk_score:.2f}")

        # ---------------------------------------------------------
        # PHASE 2: GRAPH MAPPING (Agent 2)
        # ---------------------------------------------------------
        logger.info("🕸️ Agent 2 Mapping Nodes...")

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
        
        # Fetch active policy (simplified)
        active_dsl = "IF ai_score > 0.85 THEN BLOCK_AND_LOG"  # Default fallback
        
        # Try to fetch from database
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
        
        # Prepare context for the policy engine
        policy_context = {
            "content": content,
            "ai_score": risk_score,
            "graph_cluster_size": 1 if patient_zero_data.get("status") == "not_found" else 5
        }

        guardrail_result = policy_guardian.execute_dsl_rule(active_dsl, policy_context)

        if guardrail_result.get("should_block"):
            logger.warning(f"🚫 BLOCKED by Policy: {guardrail_result.get('reason', 'Policy violation')}")
            return {
                "status": "BLOCKED",
                "risk_score": risk_score,
                "action": guardrail_result,
                "forensics": forensics_data,
                "graph_context": graph_metadata
            }

        # ---------------------------------------------------------
        # PHASE 4: IMMUTABLE AUDIT (Trust Layer)
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
                )
                logger.info(f"Blockchain hash: {ledger_hash[:16]}...")
            except Exception as e:
                logger.error(f"Blockchain logging failed: {e}")

        return {
            "status": "PROCESSED",
            "risk_score": risk_score,
            "is_ai_generated": forensics_data.get("is_ai_generated", forensics_data.get("is_ai", False)),
            "graph_context": graph_metadata,
            "blockchain_hash": ledger_hash,
            "recommendation": "Review" if risk_score > 0.5 else "Ignore",
            "forensics": forensics_data,
            "content_hash": content_hash
        }


# Global Instance
orchestrator = ThreatOrchestrator()
