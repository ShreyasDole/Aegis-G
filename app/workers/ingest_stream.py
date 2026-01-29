"""
Stream Ingest Worker
Background process for high-volume social media feed processing
Uses asyncio for concurrent processing to keep the API responsive
"""
import asyncio
import json
import aiohttp
from typing import List, Dict, Any
from datetime import datetime
from app.services.gemini.client import GeminiClient
from app.services.graph.neo4j import Neo4jService
from app.core.blockchain import generate_hash
import hashlib


class StreamIngestWorker:
    """
    Background worker for processing social media streams
    Processes items asynchronously to prevent API blocking
    """
    
    def __init__(self):
        self.gemini_client = GeminiClient()
        self.neo4j_service = Neo4jService()
        self.processing_queue: asyncio.Queue = asyncio.Queue()
        self.is_running = False
    
    async def process_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a single social media item
        Returns analysis result
        """
        try:
            content = item.get("content", "")
            platform = item.get("platform", "unknown")
            username = item.get("username", "unknown")
            
            # Step 1: Detect AI content using Gemini Flash (async)
            analysis = await self.gemini_client.detect_ai_content(content)
            
            # Step 2: Generate content hash
            content_hash = hashlib.sha256(content.encode()).hexdigest()
            
            # Step 3: If malicious, create graph nodes
            if analysis.get("risk_score", 0) > 0.6:
                await self.neo4j_service.create_node({
                    "id": f"user_{username}",
                    "label": username,
                    "type": "User",
                    "properties": {
                        "platform": platform,
                        "risk_score": analysis.get("risk_score", 0)
                    }
                })
            
            return {
                "item_id": item.get("id"),
                "content_hash": content_hash,
                "analysis": analysis,
                "processed_at": datetime.utcnow().isoformat(),
                "status": "success"
            }
        except Exception as e:
            return {
                "item_id": item.get("id"),
                "status": "error",
                "error": str(e)
            }
    
    async def process_batch(self, items: List[Dict[str, Any]], max_concurrent: int = 10) -> List[Dict[str, Any]]:
        """
        Process multiple items concurrently
        Uses semaphore to limit concurrent API calls
        """
        semaphore = asyncio.Semaphore(max_concurrent)
        results = []
        
        async def process_with_semaphore(item):
            async with semaphore:
                return await self.process_item(item)
        
        tasks = [process_with_semaphore(item) for item in items]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions
        valid_results = [
            r for r in results 
            if not isinstance(r, Exception)
        ]
        
        return valid_results
    
    async def ingest_from_file(self, file_path: str = "data/social_feed.json"):
        """
        Ingest items from JSON file
        Useful for testing and mock data processing
        """
        try:
            with open(file_path, 'r') as f:
                items = json.load(f)
            
            print(f"📥 Ingesting {len(items)} items from {file_path}")
            results = await self.process_batch(items)
            
            success_count = sum(1 for r in results if r.get("status") == "success")
            print(f"✅ Processed {success_count}/{len(items)} items successfully")
            
            return results
        except Exception as e:
            print(f"❌ Error ingesting from file: {str(e)}")
            return []
    
    async def start_stream_processing(self, stream_source: Any):
        """
        Start continuous stream processing
        Can be connected to real-time social media APIs
        """
        self.is_running = True
        print("🚀 Stream ingest worker started")
        
        while self.is_running:
            try:
                # In production, this would poll a real API or message queue
                # For now, process items from queue
                if not self.processing_queue.empty():
                    item = await self.processing_queue.get()
                    await self.process_item(item)
                else:
                    await asyncio.sleep(1)  # Wait before checking again
            except Exception as e:
                print(f"❌ Error in stream processing: {str(e)}")
                await asyncio.sleep(5)  # Back off on error
    
    def stop(self):
        """Stop the stream processing worker"""
        self.is_running = False
        print("🛑 Stream ingest worker stopped")


async def main():
    """Main function for running the worker standalone"""
    worker = StreamIngestWorker()
    
    # Process mock data
    results = await worker.ingest_from_file("data/social_feed.json")
    
    # Print summary
    high_risk = [r for r in results if r.get("analysis", {}).get("risk_score", 0) > 0.7]
    print(f"\n📊 Summary:")
    print(f"   Total processed: {len(results)}")
    print(f"   High-risk items: {len(high_risk)}")


if __name__ == "__main__":
    asyncio.run(main())

