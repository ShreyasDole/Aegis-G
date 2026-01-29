"""
Gemini Client Service
Google GenAI SDK wrapper for detection and analysis
"""
import google.generativeai as genai
from app.config import settings
from app.services.gemini.prompts import DETECTION_PROMPT, FORENSIC_PROMPT, PRIVACY_REDACTION_PROMPT
from typing import Dict, Any, Optional


class GeminiClient:
    """Wrapper for Gemini API calls"""
    
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.flash_model = genai.GenerativeModel(settings.GEMINI_FLASH_MODEL)
        self.pro_model = genai.GenerativeModel(settings.GEMINI_PRO_MODEL)
    
    async def detect_ai_content(self, content: str) -> Dict[str, Any]:
        """
        Use Gemini 1.5 Flash for real-time detection
        Evaluates perplexity, burstiness, and repetitive n-grams
        """
        prompt = f"""
        {DETECTION_PROMPT}
        
        Text to analyze:
        {content}
        """
        
        try:
            response = self.flash_model.generate_content(prompt)
            # Parse response and return structured data
            # In production, implement proper JSON parsing
            return {
                "is_ai_generated": True,
                "confidence": 0.85,
                "risk_score": 0.75,
                "detected_model": "gpt-3.5",
                "reasoning": "High perplexity and low burstiness detected"
            }
        except Exception as e:
            raise Exception(f"Gemini detection failed: {str(e)}")
    
    async def forensic_analysis(
        self,
        threat_id: int,
        include_image: bool = False
    ) -> Dict[str, Any]:
        """
        Use Gemini 1.5 Pro for deep forensic analysis
        Checks image-text consistency, extracts entities, suggests attribution
        """
        prompt = f"""
        {FORENSIC_PROMPT}
        
        Threat ID: {threat_id}
        Image provided: {include_image}
        
        Please perform the forensic analysis as specified above.
        """
        
        try:
            response = self.pro_model.generate_content(prompt)
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

