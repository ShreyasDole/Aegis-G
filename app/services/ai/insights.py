"""
AI Insights Service
Generates proactive insights and recommendations
"""
import os
import json
import random
from typing import List, Dict
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import google.generativeai as genai

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


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
        if not GEMINI_API_KEY:
            # Return demo insights when no API key
            return InsightService._get_demo_insights()
        
        try:
            # Gather system statistics
            from app.models.threat import Threat
            
            threat_count = db.query(Threat).count()
            high_risk_count = db.query(Threat).filter(Threat.risk_score >= 7.0).count()
            
            # Get recent patterns
            recent_threats = db.query(Threat)\
                .filter(Threat.timestamp >= datetime.utcnow() - timedelta(days=7))\
                .limit(10)\
                .all()
            
            patterns = [t.source_platform for t in recent_threats]
            
            # Generate insights using Gemini
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = INSIGHT_GENERATION_PROMPT.format(
                threat_count=threat_count,
                high_risk_count=high_risk_count,
                patterns=", ".join(set(patterns)) if patterns else "None",
                days=7
            )
            
            response = model.generate_content(prompt)
            text = response.text
            
            # Extract JSON
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            insights = json.loads(text)
            return insights
            
        except Exception as e:
            print(f"Insight generation error: {e}")
            return InsightService._get_demo_insights()
    
    @staticmethod
    def _get_demo_insights() -> List[Dict]:
        """Demo insights when API is unavailable"""
        return [
            {
                "title": "Unusual Login Pattern Detected",
                "description": "There has been a 45% increase in failed login attempts from Eastern European IP addresses over the past 48 hours. This pattern suggests a coordinated brute-force attack.",
                "severity": "critical",
                "category": "threat_detection",
                "suggested_actions": [
                    "Enable rate limiting on authentication endpoints",
                    "Implement CAPTCHA for repeated failures",
                    "Consider temporary IP blocking for suspicious sources"
                ],
                "impact_estimate": "Potential account compromise within 72 hours if unaddressed",
                "confidence_score": 0.89
            },
            {
                "title": "Outdated Security Policies",
                "description": "15 security policies haven't been reviewed in over 6 months. Industry standards recommend quarterly reviews.",
                "severity": "warning",
                "category": "compliance",
                "suggested_actions": [
                    "Schedule policy review meetings",
                    "Update policies to match current threat landscape",
                    "Document review process and outcomes"
                ],
                "impact_estimate": "Compliance audit findings, potential regulatory penalties",
                "confidence_score": 0.95
            },
            {
                "title": "Graph Query Performance Optimization",
                "description": "Neo4j graph queries for threat correlation are taking >2s on average. Database optimization could improve response time by 60%.",
                "severity": "recommendation",
                "category": "performance",
                "suggested_actions": [
                    "Add indexes on frequently queried node properties",
                    "Implement query result caching",
                    "Consider database query restructuring"
                ],
                "impact_estimate": "Faster threat analysis, improved user experience",
                "confidence_score": 0.82
            },
            {
                "title": "High-Value Target Identification",
                "description": "ML analysis identified 12 network nodes that are both highly connected and frequently involved in flagged activities. These may be key threat actors.",
                "severity": "warning",
                "category": "threat_detection",
                "suggested_actions": [
                    "Prioritize investigation of identified nodes",
                    "Increase monitoring on related connections",
                    "Cross-reference with known threat intelligence"
                ],
                "impact_estimate": "Early identification of major threat campaigns",
                "confidence_score": 0.76
            }
        ]
    
    @staticmethod
    def analyze_trend(data_points: List[float]) -> Dict:
        """Analyze trend in numerical data"""
        if len(data_points) < 2:
            return {"trend": "insufficient_data"}
        
        # Simple linear regression
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

