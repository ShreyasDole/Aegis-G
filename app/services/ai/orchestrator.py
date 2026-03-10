"""
Threat Orchestrator - Mission Control
Coordinates the Multi-Agent Defense Pipeline (Agents 1-5)
"""
import logging
from typing import Dict, Any
from sqlalchemy.orm import Session

# Import the Agents
from app.services.ai.fusion_service import AnalystAgent  # Agent 3
from app.services.ai.policy_guardian import policy_guardian  # Agent 4
from app.core.blockchain import add_to_ledger  # Agent 5 / Trust Layer

# Import Prisha and Yash's services
from app.services.ai.stylometry import forensic_investigator  # Agent 1 (Prisha)
# from app.services.graph.neo4j import GraphOracle               # Agent 2 (Yash)

logger = logging.getLogger(__name__)


class ThreatOrchestrator:
    """
    Mission Control: Coordinates the Multi-Agent Defense Pipeline
    """

    @staticmethod
    async def process_incoming_threat(payload: Dict[str, Any], db: Session, mode: str = "local") -> Dict[str, Any]:
        """
        The main pipeline executing the Collaboration Workflow (The "Sync").
        mode: "local" = Prisha's CPU DistilRoBERTa (placeholder), "cloud" = Gemini API
        """
        content = payload.get("content", "")
        threat_id = payload.get("id", 0)

        # ---------------------------------------------------------
        # 1. ANALYSIS: Call Agent 1 (Forensics) & Agent 2 (Graph)
        # ---------------------------------------------------------
        # Agent 1: Prisha's Forensic Investigator (Stylometry Engine)
        logger.info(f"🔬 Calling Agent 1: Forensic Investigator")
        forensics_data = forensic_investigator.analyze(content)
        
        # mode parameter kept for future extension (local ML models vs cloud API)
        if mode == "cloud":
            # Future: Could enhance with Gemini API for additional context
            logger.info("Cloud mode: Using base forensic analysis")
        
        logger.info(f"📊 Agent 1 results: AI={forensics_data['is_ai']}, "
                   f"Risk={forensics_data['risk_score']:.2f}, "
                   f"Burstiness={forensics_data['burstiness']:.2f}")

        # graph_data = await GraphOracle.analyze_propagation(payload)
        graph_data = {
            "cluster_size": 45,
            "is_botnet": True,
            "patient_zero": "193.201.45.22",
        }

        # ---------------------------------------------------------
        # 2. MITIGATION: Call Agent 4 (Policy Guardian)
        # ---------------------------------------------------------
        # Check if we should block this immediately before deep analysis
        post_data = {
            "content": content,
            "ai_score": forensics_data["risk_score"],
            "graph_cluster_size": graph_data["cluster_size"],
        }

        # Fetch active DSL rule from DB when available, else use default
        active_dsl_rule = "IF ai_score > 0.8 AND graph_cluster_size > 10 THEN BLOCK_AND_LOG"
        if db:
            try:
                from app.models.ai import AIPolicy

                policy = (
                    db.query(AIPolicy)
                    .filter(AIPolicy.is_active)
                    .order_by(AIPolicy.priority.desc())
                    .first()
                )
                if policy and (policy.translated_dsl or policy.content):
                    active_dsl_rule = policy.translated_dsl or policy.content
            except Exception as e:
                logger.warning(f"Could not fetch active policy from DB: {e}")

        guardrail_result = policy_guardian.execute_dsl_rule(active_dsl_rule, post_data)

        if guardrail_result.get("should_block"):
            logger.info(
                f"🛑 Agent 4 blocked threat {threat_id}. Reason: {guardrail_result['reason']}"
            )
            # In production, save to BlockedContent DB here
            return {"status": "BLOCKED", "action": guardrail_result}

        # ---------------------------------------------------------
        # 3. SYNTHESIS: Call Agent 3 (Intelligence Analyst)
        # ---------------------------------------------------------
        # Pass the raw data to Gemini 3 for human-readable intelligence
        logger.info(f"🧠 Agent 3 synthesizing report for threat {threat_id}")
        fusion_result = await AnalystAgent.synthesize_intelligence(
            content=content,
            forensics=forensics_data,
            graph=graph_data,
        )

        # ---------------------------------------------------------
        # 4. LOGGING: Call Agent 5 - The Trust Layer (Blockchain)
        # ---------------------------------------------------------
        logger.info(f"🔗 Agent 5: Securing report {threat_id} to blockchain ledger")
        
        # Get analyst ID from payload or use system default
        analyst_id = payload.get("analyst_id", 1)  # Default to system analyst
        
        ledger_hash = await add_to_ledger(
            db=db,
            report_id=threat_id,
            analyst_id=analyst_id,
            content=f"Report: {fusion_result['report'].threat_title}",
            recipient_agency="Internal-Audit",
            thought_process=fusion_result['ai_reasoning_log']
        )

        return {
            "status": "PROCESSED",
            "report": fusion_result["report"],
            "blockchain_hash": ledger_hash,
        }


# Global Instance
orchestrator = ThreatOrchestrator()
