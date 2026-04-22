# app/services/ai/explainability.py
import re
import os
import json
import logging
from typing import List, Dict, Any
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

class TokenExplainer:
    """Provides Explainable AI (XAI) token-level attribution.
    
    Uses Gemini 2.5 Flash to analyze text contextually and return specific 
    markers of AI-generation or malign patterns.
    """
    
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None
    
    async def explain(self, text: str, overall_risk: float) -> List[Dict[str, Any]]:
        """
        Analyze text and return word-by-word importance scores.
        Words flagged by Gemini will have high values.
        """
        gemini_flagged = set()
        
        if self.client and overall_risk > 0.4:
            try:
                prompt = f"""
                Analyze this content for AI-generation or disinformation signatures:
                "{text}"
                
                The assigned risk score is {overall_risk}.
                Return a JSON list of exactly 5 to 10 specific words (strings) from the text that most strongly contributed to this risk score. Do not return arrays of objects. Return a simple list of strings like ["word1", "word2"].
                """
                response = self.client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    )
                )
                try:
                    flagged_words = json.loads(response.text)
                    if isinstance(flagged_words, list):
                        for fw in flagged_words:
                            gemini_flagged.add(re.sub(r'[^a-zA-Z0-9]', '', str(fw).lower()))
                except Exception as json_err:
                    logger.warning(f"Failed to parse Gemini XAI JSON: {json_err}")
            except Exception as e:
                logger.warning(f"Gemini API Error in XAI: {e}")

        # Construct the dense map for the frontend renderer
        words = re.findall(r'\S+|\n', text)
        explanation = []
        
        for word in words:
            if word == '\n':
                explanation.append({
                    "word": "\n",
                    "importance": 0.0,
                })
                continue
                
            clean_word = re.sub(r'[^a-zA-Z0-9]', '', word.lower())
            
            # Base importance depends on the overall risk
            importance = 0.05
            if overall_risk > 0.4:
                importance = 0.2
                
            # If Gemini explicitly flagged this exact word, spike the importance!
            if clean_word and clean_word in gemini_flagged:
                importance = 0.95
            elif clean_word in {"delve", "testament", "landscape", "crucial", "multifaceted", "moreover"}:
                # Minor fallback heuristics simply as generic weights
                importance += 0.3
            
            importance = min(0.95, importance)
            
            explanation.append({
                "word": word,
                "importance": round(importance, 3)
            })
            
        return explanation

# Singleton instance
token_explainer = TokenExplainer()
