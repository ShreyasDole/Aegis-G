"""
AI Policy Service
Translates natural language policies to DSL using Gemini
"""
import os
import json
from typing import Dict, List
from google import genai
from app.config import settings

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


POLICY_TRANSLATION_PROMPT = """
You are a policy translation AI. Convert natural language business rules into a simple DSL (Domain Specific Language) for threat detection.

DSL Syntax:
- IF <condition> THEN <action>
- Conditions: contains(field, "text"), equals(field, value), greater_than(field, value), matches_pattern(field, regex)
- Actions: flag_threat(severity), alert(target), block(), log(message)
- Logical operators: AND, OR, NOT

Examples:
Natural: "Flag any login attempts from China as high risk"
DSL: IF contains(geo_location, "China") AND equals(event_type, "login") THEN flag_threat("high")

Natural: "Block transactions over $10,000 without manager approval"
DSL: IF greater_than(amount, 10000) AND NOT equals(approved_by_role, "manager") THEN block()

Now translate this policy:
{policy}

Return JSON with:
{{
  "dsl": "the translated DSL",
  "confidence": 0.0-1.0,
  "explanation": "brief explanation of translation"
}}
"""


class PolicyService:
    """Service for translating and managing AI policies"""
    
    @staticmethod
    async def translate_natural_language_to_dsl(policy: str) -> Dict:
        """
        Translate natural language policy to DSL using Gemini
        """
        if not client:
            return {
                "dsl": "# AI translation requires GEMINI_API_KEY",
                "confidence": 0.0,
                "explanation": "API key not configured"
            }
        
        try:
            prompt = POLICY_TRANSLATION_PROMPT.format(policy=policy)
            response = client.models.generate_content(
                model=settings.GEMINI_FLASH_MODEL,
                contents=prompt
            )
            text = response.text
            
            # Extract JSON from response
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            result = json.loads(text)
            return result
            
        except Exception as e:
            return {
                "dsl": f"# Translation error: {str(e)}",
                "confidence": 0.0,
                "explanation": "Failed to translate policy"
            }
    
    @staticmethod
    def validate_dsl(dsl: str) -> Dict:
        """Validate DSL syntax"""
        # Basic validation
        required_keywords = ["IF", "THEN"]
        has_keywords = all(keyword in dsl.upper() for keyword in required_keywords)
        
        return {
            "valid": has_keywords,
            "errors": [] if has_keywords else ["Missing required keywords: IF, THEN"]
        }
    
    @staticmethod
    def detect_policy_conflicts(policies: List[Dict]) -> List[Dict]:
        """Detect conflicting policies"""
        conflicts = []
        
        # Simple conflict detection
        # In production, this would be more sophisticated
        for i, policy1 in enumerate(policies):
            for policy2 in policies[i+1:]:
                if policy1.get("category") == policy2.get("category"):
                    # Check for contradictions
                    if "NOT" in policy1.get("content", "") and "NOT" not in policy2.get("content", ""):
                        conflicts.append({
                            "policy1_id": policy1.get("id"),
                            "policy2_id": policy2.get("id"),
                            "reason": "Potential contradiction detected"
                        })
        
        return conflicts


policy_service = PolicyService()

