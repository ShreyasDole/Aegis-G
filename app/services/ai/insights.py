"""
AI Insights Service
Generates proactive insights and recommendations
Uses google-genai SDK (latest)
"""
import os
import json
from typing import List, Dict
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from google import genai
from app.config import settings

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


INSIGHT_GENERATION_PROMPT = """
You are a cybersecurity analyst AI. Analyze the provided threat intelligence data and generate actionable insights.

Data Summary:
- Total Threats: {threat_count}
- High Risk Threats: {high_risk_count}
- Recent Attack Patterns: {patterns}
- Time Range: Last {days} days

Generate 3-5 insights with:
1. Title (concise)
2. Description (detailed finding)
3. Severity (critical/warning/recommendation)
4. Category (one of: threat_detection, vulnerability, compliance, performance, optimization)
5. Suggested Actions (list of 2-3 specific actions)
6. Impact Estimate (what happens if not addressed)
7. Confidence Score (0.0-1.0)

Return JSON array of insights.
"""


class InsightService:
    """Service for generating AI-powered insights"""

    @staticmethod
    async def generate_insights(db: Session) -> List[Dict]:
        """
        Generate insights based on system data
        """
        if not client:
            return InsightService.operational_summaries(db)

        try:
            from app.models.threat import Threat

            threat_count = db.query(Threat).count()
            high_risk_count = db.query(Threat).filter(
                or_(Threat.risk_score >= 0.65, Threat.risk_score >= 6.5)
            ).count()

            recent_threats = db.query(Threat)\
                .filter(Threat.timestamp >= datetime.utcnow() - timedelta(days=7))\
                .limit(10)\
                .all()

            patterns = [t.source_platform for t in recent_threats]

            prompt = INSIGHT_GENERATION_PROMPT.format(
                threat_count=threat_count,
                high_risk_count=high_risk_count,
                patterns=", ".join(set(patterns)) if patterns else "None",
                days=7
            )

            response = client.models.generate_content(
                model=settings.GEMINI_FLASH_MODEL,
                contents=prompt
            )
            text = response.text

            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()

            insights = json.loads(text)
            return insights

        except Exception as e:
            print(f"Insight generation error: {e}")
            return InsightService.operational_summaries(db)

    @staticmethod
    def operational_summaries(db: Session) -> List[Dict]:
        """Deterministic insights from live DB tables (no LLM)."""
        from app.models.threat import Threat
        from app.models.ai import AIPolicy, BlockedContent

        out: List[Dict] = []
        total = int(db.query(func.count(Threat.id)).scalar() or 0)
        high = int(
            db.query(func.count(Threat.id))
            .filter(or_(Threat.risk_score >= 0.65, Threat.risk_score >= 6.5))
            .scalar()
            or 0
        )
        avg_r = db.query(func.avg(Threat.risk_score)).scalar()
        avg_risk = float(avg_r) if avg_r is not None else 0.0

        top_plat = (
            db.query(Threat.source_platform, func.count(Threat.id).label("c"))
            .group_by(Threat.source_platform)
            .order_by(func.count(Threat.id).desc())
            .limit(4)
            .all()
        )
        plat_txt = ", ".join(f"{p or 'unknown'} ({c})" for p, c in top_plat) if top_plat else "n/a"

        active_policies = int(
            db.query(func.count(AIPolicy.id)).filter(AIPolicy.is_active.is_(True)).scalar() or 0
        )
        blocked_24h = int(
            db.query(func.count(BlockedContent.id))
            .filter(BlockedContent.blocked_at >= datetime.now(timezone.utc) - timedelta(hours=24))
            .scalar()
            or 0
        )

        if total > 0:
            sev = "critical" if high > total * 0.3 else "warning" if high > 0 else "recommendation"
            out.append(
                {
                    "title": f"Threat inventory: {total} records",
                    "description": f"High-risk count (model score ≥0.65 or legacy ≥6.5): {high}. Mean risk score: {avg_risk:.3f}. Top platforms: {plat_txt}.",
                    "severity": sev,
                    "category": "threat_detection",
                    "suggested_actions": [
                        "Review /forensics for top IDs",
                        "Tune policies on /policy criteria builder",
                        "Run graph community view for coordination",
                    ],
                    "impact_estimate": "Drives detection backlog and analyst queue depth",
                    "confidence_score": 0.99,
                    "data_source": "sql.threats_aggregate",
                }
            )
        else:
            out.append(
                {
                    "title": "No threats ingested yet",
                    "description": "Pipeline has no rows in `threats`. Run /scans or detection ingest to populate intelligence.",
                    "severity": "recommendation",
                    "category": "optimization",
                    "suggested_actions": [
                        "POST /api/scan/core with sample content",
                        "Verify workers and Neo4j connectivity",
                    ],
                    "impact_estimate": "Reports and graph stay cold until ingest",
                    "confidence_score": 1.0,
                    "data_source": "sql.threats_empty",
                }
            )

        out.append(
            {
                "title": f"Active policies: {active_policies}",
                "description": "Guardrails currently armed in ai_policies. Inactive policies do not participate in ingest-time DSL evaluation.",
                "severity": "warning" if active_policies == 0 else "recommendation",
                "category": "compliance",
                "suggested_actions": [
                    "Author rules under Policy → Visual builder",
                    "Arm policies after validation in Management tab",
                ],
                "impact_estimate": "Zero active policies → enforcement relies on defaults only",
                "confidence_score": 0.95,
                "data_source": "sql.ai_policies",
            }
        )

        out.append(
            {
                "title": f"Blocks (24h): {blocked_24h}",
                "description": "Rows in blocked_content ledger for policy enforcement in the last 24 hours.",
                "severity": "recommendation",
                "category": "performance",
                "suggested_actions": ["Review Live Block Log on Policy page", "Correlate with policy priority"],
                "impact_estimate": "Spike may indicate aggressive rules or coordinated campaign",
                "confidence_score": 0.9,
                "data_source": "sql.blocked_content",
            }
        )
        return out[:8]

    @staticmethod
    def analyze_trend(data_points: List[float]) -> Dict:
        """Analyze trend in numerical data"""
        if len(data_points) < 2:
            return {"trend": "insufficient_data"}

        avg_change = sum(data_points[i] - data_points[i-1] for i in range(1, len(data_points))) / (len(data_points) - 1)

        if avg_change > 0.1:
            trend = "increasing"
        elif avg_change < -0.1:
            trend = "decreasing"
        else:
            trend = "stable"

        return {
            "trend": trend,
            "average_change": avg_change,
            "current": data_points[-1],
            "previous": data_points[0]
        }


insight_service = InsightService()
