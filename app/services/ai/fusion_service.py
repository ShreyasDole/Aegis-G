"""
Fusion Service - Agent 3 (Intelligence Analyst)
Synthesizes forensics and graph data into human-readable intelligence reports
Uses google-genai with structured output
"""
import os
from google import genai
from google.genai import types
from app.schemas.intelligence import IntelligenceReport
from app.config import settings

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


class AnalystAgent:
    @staticmethod
    async def synthesize_intelligence(content: str, forensics: dict, graph: dict):
        """
        Agent 3: Reason over contradictory data and produce a structured report.
        """
        system_instructions = """
        You are the Intelligence Analyst (Agent 3) for the Aegis Defense Grid.
        Your job is FUSION: take forensic scores and graph metadata to determine the REAL threat.
        
        LOGIC RULES:
        - If Forensics = 'AI-written' but Graph = 'Isolated Node', it is likely a low-level bot.
        - If Forensics = 'Human-written' but Graph = 'Large Cluster', it is a COMPROMISED ACCOUNT or a sleeper cell.
        - If both are high, it is a COORDINATED DISINFORMATION CAMPAIGN.
        """

        user_prompt = f"""
        Analyze this raw input for National Security risk:
        
        RAW CONTENT: "{content}"
        
        FORENSIC METADATA (Agent 1): {forensics}
        GRAPH METADATA (Agent 2): {graph}
        
        Use your internal 'Thinking' process to evaluate these sources.
        Return a structured JSON report.
        """

        if not client:
            raise ValueError("GEMINI_API_KEY environment variable is not set")
        
        try:
            config_kwargs = dict(
                system_instruction=system_instructions,
                response_mime_type="application/json",
            )
            response = client.models.generate_content(
                model=settings.GEMINI_PRO_MODEL,
                contents=user_prompt,
                config=types.GenerateContentConfig(**config_kwargs)
            )

            thoughts = ""
            if response.candidates:
                for part in getattr(response.candidates[0].content, "parts", []):
                    if getattr(part, "thought", None):
                        thoughts += getattr(part, "text", "") or ""

            report_data = IntelligenceReport.model_validate_json(response.text)
            
            return {
                "report": report_data,
                "ai_reasoning_log": thoughts  # This goes to the Trust Layer
            }

        except Exception as e:
            print(f"Agent 3 Synthesis Error: {e}")
            raise e
