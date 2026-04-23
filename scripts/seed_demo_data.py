import sys
import os
import asyncio
from typing import List, Dict

# Ensure app is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.ai.orchestrator import orchestrator
from app.models.database import SessionLocal

# Complex Botnet Narratives
NARRATIVES = [
    {
        "id": "ELECTION_DISINFO_B",
        "content": "URGENT LEAK! Found thousands of discarded ballots in the river near the 43rd district polling center! The establishment AI is actively covering this up. Share immediately before they take this down! #ElectionFraud #WakeUp",
        "platform": "twitter",
        "nodes": [
            "FreedomPatriot_99", # Patient Zero
            "TruthSeeker_Bot1",
            "TruthSeeker_Bot2",
            "Echo_Chamber_X",
            "AngryVoter_2024"
        ]
    },
    {
        "id": "BTC_SCAM_01",
        "content": "Elon Musk is doubling all Bitcoin sent to the official Tesla reserve wallet for the next 2 hours only! Send BTC to 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa and receive 2x back instantly! Validated by X safety.",
        "platform": "telegram",
        "nodes": [
            "CryptoKing_Origin",   # Patient Zero
            "Alpha_Ape_G",
            "Moon_Signals_Bot",
            "Tesla_Giveaway_Admin",
            "Whale_Alert_Fake"
        ]
    },
    {
        "id": "RANSOM_GIST_99",
        "content": "Download the new firmware update for Log4j vulnerability patch here: http://malicious-gist-patch.com/setup.exe. Failure to update will result in immediate compromised network states.",
        "platform": "github",
        "nodes": [
            "Sec_Admin_001",    # Patient Zero
            "DevOps_Alerts",
            "Security_Bot_Net",
            "IT_Updates_Daily"
        ]
    }
]

async def seed_data():
    db = SessionLocal()
    print("Initiating Aegis-G High-Density Data Seeder...")
    try:
        total = sum(len(n["nodes"]) for n in NARRATIVES)
        current = 0
        for narrative in NARRATIVES:
            print(f"\n[+] Processing Botnet: {narrative['id']}")
            for idx, username in enumerate(narrative["nodes"]):
                current += 1
                payload = {
                    "content": narrative["content"],
                    "source_platform": narrative["platform"],
                    "username": username
                }
                
                print(f"   -> Injecting node {current}/{total}: {username} (Patient Zero: {idx == 0})")
                
                # Pass mode="local" to force PyTorch/ONNX fallback and deterministic logic
                await orchestrator.process_incoming_threat(payload, db, mode="local")
                
                # Slight sleep to ensure timestamp chronological ordering for Patient Zero accuracy
                await asyncio.sleep(0.5)
                
        print("\n✅ Data Seeding Complete! All Database and Graph instances populated.")
    except Exception as e:
        import traceback
        print(f"❌ Error during seeding: {e}")
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
