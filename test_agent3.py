import asyncio
import os
import sys

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.services.ai.fusion_service import AnalystAgent
import json
from dotenv import load_dotenv

load_dotenv()

async def run_tests():
    print("[*] Testing Agent 3 Fusion...")
    
    forensics = {
        "risk_score": 0.69,
        "is_ai_generated": True,
        "confidence": 0.8,
        "detected_model": "gpt-4",
    }
    
    graph = {
        "node_created": True,
        "patient_zero": "Self",
        "cluster_risk": "Low"
    }

    try:
        result = await AnalystAgent.synthesize_intelligence(
            content="Artificial Intelligence (AI) is one of the most transformative technologies of the modern era. It refers to the simulation of human intelligence in machines...",
            forensics=forensics,
            graph=graph
        )
        print("✅ PASS: Agent 3 Synthesis succeeded.")
        print(result["report"].model_dump_json(indent=2))
        
    except Exception as e:
        print(f"❌ FAIL: {e}")

if __name__ == "__main__":
    asyncio.run(run_tests())
