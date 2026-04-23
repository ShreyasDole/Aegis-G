"""
Stream Ingest Worker
Background process for high-volume social media feed processing.

All item processing goes through ThreatOrchestrator (same pipeline as /api/scan).
"""
import asyncio
import json
import hashlib
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.services.ai.orchestrator import orchestrator
from app.models.database import SessionLocal


class StreamIngestWorker:
    """
    Background worker for processing social media streams.
    """

    def __init__(self, db_session=None):
        self.processing_queue: asyncio.Queue = asyncio.Queue()
        self.is_running = False
        self.db_session = db_session

    async def process_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Run the same multi-agent pipeline as API scan (forced forensic path)."""
        content = item.get("content", "") or ""
        platform = item.get("platform", "unknown")
        username = item.get("username", "unknown")

        db = self.db_session
        close_db = False
        if db is None:
            db = SessionLocal()
            close_db = True
        try:
            result = await orchestrator.process_incoming_threat(
                payload={
                    "content": content,
                    "source_platform": platform,
                    "username": username,
                    "force_forensic": True,
                },
                db=db,
                mode="local",
            )
            content_hash = result.get("content_hash") or hashlib.sha256(
                content.encode("utf-8", errors="replace")
            ).hexdigest()
            forensics = result.get("forensics") or {}

            if result.get("status") == "BLOCKED":
                action = result.get("action") or {}
                return {
                    "item_id": item.get("id"),
                    "content_hash": content_hash,
                    "status": "blocked",
                    "blocked_by": "ThreatOrchestrator (Policy Guardian)",
                    "policy": result.get("policy_name") or action.get("reason"),
                    "reason": action.get("reason", "Policy violation"),
                    "processed_at": datetime.utcnow().isoformat(),
                }

            return {
                "item_id": item.get("id"),
                "content_hash": content_hash,
                "analysis": {
                    "risk_score": result.get("risk_score", 0.0),
                    "is_ai_generated": result.get("is_ai_generated", False),
                    "confidence": forensics.get("confidence", result.get("confidence", 0.0)),
                    "detected_model": forensics.get("detected_model", result.get("detected_model")),
                },
                "processed_at": datetime.utcnow().isoformat(),
                "status": "success",
            }
        except Exception as e:
            return {
                "item_id": item.get("id"),
                "status": "error",
                "error": str(e),
            }
        finally:
            if close_db and db is not None:
                db.close()

    async def process_batch(self, items: List[Dict[str, Any]], max_concurrent: int = 10) -> List[Dict[str, Any]]:
        semaphore = asyncio.Semaphore(max_concurrent)
        results = []

        async def process_with_semaphore(it):
            async with semaphore:
                return await self.process_item(it)

        tasks = [process_with_semaphore(item) for item in items]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        return [r for r in results if not isinstance(r, Exception)]

    async def ingest_from_file(self, file_path: str = "data/social_feed.json"):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                items = json.load(f)

            print(f"Ingesting {len(items)} items from {file_path}")
            results = await self.process_batch(items)

            success_count = sum(1 for r in results if r.get("status") == "success")
            print(f"Processed {success_count}/{len(items)} items successfully")

            return results
        except Exception as e:
            print(f"Error ingesting from file: {str(e)}")
            return []

    async def start_stream_processing(self, stream_source: Any):
        self.is_running = True
        print("Stream ingest worker started")

        while self.is_running:
            try:
                if not self.processing_queue.empty():
                    item = await self.processing_queue.get()
                    await self.process_item(item)
                else:
                    await asyncio.sleep(1)
            except Exception as e:
                print(f"Error in stream processing: {str(e)}")
                await asyncio.sleep(5)

    def stop(self):
        self.is_running = False
        print("🛑 Stream ingest worker stopped")


async def main():
    worker = StreamIngestWorker()
    results = await worker.ingest_from_file("data/social_feed.json")
    high_risk = [r for r in results if r.get("analysis", {}).get("risk_score", 0) > 0.7]
    print("\n📊 Summary:")
    print(f"   Total processed: {len(results)}")
    print(f"   High-risk items: {len(high_risk)}")


if __name__ == "__main__":
    asyncio.run(main())
