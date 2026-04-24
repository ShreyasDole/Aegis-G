import requests
import time

print("Seeding default users...")
# Wait, I can just call the python module directly without HTTP
import os
import sys

from app.models.database import engine, Base, SessionLocal
from app.seed import seed_default_users

print("Creating tables if missing...")
Base.metadata.create_all(bind=engine)

print("Running seed_default_users...")
seed_default_users()

print("Triggering botnet seeder API...")
# To hit the local API, let's start it in background or just use orchestrator directly
import asyncio
from app.services.ai.orchestrator import orchestrator

async def seed_botnet():
    db = SessionLocal()
    NARRATIVES = [
        {
            "id": "ELECTION_DISINFO_B",
            "content": "URGENT LEAK! Found thousands of discarded ballots... The establishment AI is actively covering this up. deepfake video included",
            "platform": "twitter",
            "nodes": ["FreedomPatriot_99", "TruthSeeker_Bot1", "Echo_Chamber_X"]
        },
        {
            "id": "BTC_SCAM_01",
            "content": "Elon Musk is doubling all Bitcoin! Send BTC... Validated by elevenlabs generated voice.",
            "platform": "telegram",
            "nodes": ["CryptoKing_Origin", "Moon_Signals_Bot", "Tesla_Giveaway_Admin"]
        },
        {
            "id": "RANSOM_GIST_99",
            "content": "Download the new firmware update for Log4j vulnerability patch here... AI generated payload",
            "platform": "github",
            "nodes": ["Sec_Admin_001", "DevOps_Alerts", "Security_Bot_Net"]
        }
    ]
    for narrative in NARRATIVES:
        for username in narrative["nodes"]:
            payload = {
                "content": narrative["content"],
                "source_platform": narrative["platform"],
                "username": username
            }
            try:
                await orchestrator.process_incoming_threat(payload, db, mode="local")
                print(f"Seeded narrative node: {username}")
            except Exception as e:
                print(f"Error seeding {username}: {e}")
            time.sleep(0.5)
    db.close()

asyncio.run(seed_botnet())
print("Data Seed Complete!")
