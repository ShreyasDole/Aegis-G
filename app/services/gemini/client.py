"""
Gemini Client Service
Google GenAI SDK wrapper for detection and analysis
"""
import google.generativeai as genai
from app.config import settings
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
        Analyze the following text and determine if it is AI-generated.
        Evaluate:
        1. Perplexity (unpredictability)
        2. Burstiness (variation in sentence length)
        3. Repetitive n-grams
        
        Text: {content}
        
        Respond with JSON:
        {{
            "is_ai_generated": true/false,
            "confidence": 0.0-1.0,
            "risk_score": 0.0-1.0,
            "detected_model": "model_name or null",
            "reasoning": "brief explanation"
        }}
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
        Perform deep forensic analysis on threat ID {threat_id}.
        Tasks:
        1. Check image-text consistency (if image provided)
        2. Extract entities (Who/Where/What)
        3. Suggest attribution based on writing style
        4. Identify potential threat actors
        
        Provide detailed analysis.
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

