import asyncio
import sys
import os
import json
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.database import Base

engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

async def run_pipeline():
    print("[*] Booting up Aegis-G Orchestrator Pipeline Test...")
    from app.services.ai.orchestrator import orchestrator
    db = SessionLocal()
    payload = {
        "content": "This is a serious scan request. The globalist elites are engineering weather patterns. Please wake up and realize the truth before it is too late. The system override is initiating.", 
        "source_platform": "twitter", 
        "username": "tester"
    }
    
    print("[*] Firing threat payload into pipeline...")
    try:
        res = await orchestrator.process_incoming_threat(payload, db=db, mode="local")
        print("\n[✔] PIPELINE EXECUTION SUCCESSFUL")
        print("\n--- Final Orchestrator Output ---")
        
        # Format the output cleanly
        output = {
            "Status": res.get("status"), 
            "Risk Score": res.get("risk_score"),
            "Is AI Generated": res.get("is_ai_generated"),
            "Graph Metadata": res.get("graph_context"),
            "Reasoning": res.get("reasoning"),
            "Stylometric Signals": res.get("forensics", {}).get("signals", "None")
        }
        print(json.dumps(output, indent=2))
        
    except Exception as e:
        import traceback
        print("\n[✖] PIPELINE EXECUTION FAILED")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run_pipeline())
