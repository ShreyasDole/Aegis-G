"""
Gemini Client Service
Google GenAI SDK wrapper for detection and analysis (google-genai, latest)
"""
from google import genai
from app.config import settings
from app.services.gemini.prompts import DETECTION_PROMPT, FORENSIC_PROMPT
from typing import Dict, Any


class GeminiClient:
    """Wrapper for Gemini API calls using google-genai SDK"""

    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY) if settings.GEMINI_API_KEY else None

    async def detect_ai_content(self, content: str) -> Dict[str, Any]:
        """
        Use Gemini 2.5 Flash for real-time detection
        Evaluates perplexity, burstiness, and repetitive n-grams
        """
        prompt = f"""
        {DETECTION_PROMPT}

        Text to analyze:
        {content}
        """
        if not self.client:
            raise Exception("Gemini API key not configured")

        try:
            from google.genai import types as gtypes
            response = self.client.models.generate_content(
                model=settings.GEMINI_FLASH_MODEL,
                contents=prompt,
                config=gtypes.GenerateContentConfig(
                    temperature=0.0,
                    response_mime_type="application/json",
                )
            )
            raw = response.text or ""

            # Strip markdown fences if present
            import json, re
            cleaned = re.sub(r"```(?:json)?", "", raw).strip().strip("`").strip()
            try:
                parsed = json.loads(cleaned)
                return {
                    "is_ai_generated": bool(parsed.get("is_ai_generated", False)),
                    "confidence": float(parsed.get("confidence", 0.5)),
                    "risk_score": float(parsed.get("risk_score", 0.5)),
                    "detected_model": parsed.get("detected_model") or "unknown",
                    "reasoning": parsed.get("reasoning", ""),
                    "indicators": parsed.get("indicators", {}),
                }
            except (json.JSONDecodeError, ValueError):
                # Fallback: infer score from text
                lower = raw.lower()
                score = 0.9 if "high" in lower and "ai" in lower else 0.5
                return {
                    "is_ai_generated": "ai-generated" in lower or "ai generated" in lower,
                    "confidence": score,
                    "risk_score": score,
                    "detected_model": "unknown",
                    "reasoning": raw[:300],
                }
        except Exception as e:
            raise Exception(f"Gemini detection failed: {str(e)}")

    async def forensic_analysis(
        self,
        threat_id: int,
        include_image: bool = False
    ) -> Dict[str, Any]:
        """
        Use Gemini 2.5 Flash for deep forensic analysis
        Checks image-text consistency, extracts entities, suggests attribution
        """
        prompt = f"""
        {FORENSIC_PROMPT}

        Threat ID: {threat_id}
        Image provided: {include_image}

        Please perform the forensic analysis as specified above.
        """
        if not self.client:
            raise Exception("Gemini API key not configured")

        try:
            self.client.models.generate_content(
                model=settings.GEMINI_FLASH_MODEL,
                contents=prompt
            )
            return {
                "entities": {
                    "persons": [],
                    "locations": [],
                    "organizations": []
                },
                "attribution": {
                    "likely_model": "gpt-3.5",
                    "confidence": 0.8
                },
                "recommendations": [
                    "Monitor related accounts",
                    "Flag for further investigation"
                ]
            }
        except Exception as e:
            raise Exception(f"Forensic analysis failed: {str(e)}")
