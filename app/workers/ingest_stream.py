"""
Stream Ingest Worker
Background process for high-volume social media feed processing
Uses asyncio for concurrent processing to keep the API responsive
"""
import asyncio
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.services.gemini.client import GeminiClient
from app.services.graph.neo4j import neo4j_service as _neo4j_singleton  # SafeNeo4jService
from app.services.ai.policy_guardian import policy_guardian
import hashlib


class StreamIngestWorker:
    """
    Background worker for processing social media streams
    Processes items asynchronously to prevent API blocking
    """
    
    def __init__(self, db_session=None):
        self.gemini_client = GeminiClient()
        # BUG FIX: use safe singleton — never crash if Neo4j is unavailable
        self.neo4j_service = _neo4j_singleton
        self.processing_queue: asyncio.Queue = asyncio.Queue()
        self.is_running = False
        self.db_session = db_session  # For accessing active policies
    
    async def apply_guardrails(self, item: Dict[str, Any], analysis: Dict[str, Any], graph_data: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
        """
        Agent 4: Apply policy guardrails to incoming post
        Returns blocking decision or None if post should pass
        """
        if not self.db_session:
            return None  # No DB session, skip guardrails
        
        try:
            from app.models.ai import AIPolicy, BlockedContent
            
            # Fetch all active policies
            active_policies = self.db_session.query(AIPolicy).filter(
                AIPolicy.is_active
            ).order_by(AIPolicy.priority.desc()).all()
            
            if not active_policies:
                return None  # No active policies
            
            content = item.get("content", "")
            content_hash = hashlib.sha256(content.encode()).hexdigest()
            
            # Prepare post data for DSL evaluation
            post_data = {
                "content": content,
                "ai_score": analysis.get("risk_score", 0.0),
                "graph_cluster_size": graph_data.get("cluster_size", 0) if graph_data else 0,
                "platform": item.get("platform", "unknown"),
                "username": item.get("username", "unknown")
            }
            
            # Check each active policy
            for policy in active_policies:
                dsl_logic = policy.translated_dsl or policy.content
                
                if not dsl_logic:
                    continue
                
                # Execute DSL rule
                result = policy_guardian.execute_dsl_rule(dsl_logic, post_data)
                
                if result.get("should_block"):
                    # Block and log
                    blocked_record = BlockedContent(
                        content_hash=content_hash,
                        content_preview=content[:500],
                        source_platform=item.get("platform"),
                        source_username=item.get("username"),
                        policy_id=policy.id,
                        policy_name=policy.name,
                        rule_name=f"rule_{policy.id:02d}.aegis",
                        dsl_logic=dsl_logic,
                        matched_conditions=json.dumps(result.get("matched_conditions", [])),
                        action_taken=result.get("action", "BLOCK_AND_LOG"),
                        ai_score=post_data.get("ai_score"),
                        graph_cluster_size=post_data.get("graph_cluster_size"),
                        narrative_keywords=json.dumps(result.get("matched_conditions", []))
                    )
                    
                    self.db_session.add(blocked_record)
                    self.db_session.commit()
                    self.db_session.refresh(blocked_record)
                    
                    # Notify WebSocket clients
                    try:
                        from app.routers.websocket import notify_blocked_content
                        asyncio.create_task(notify_blocked_content({
                            "id": blocked_record.id,
                            "content_preview": blocked_record.content_preview,
                            "policy_name": policy.name,
                            "action_taken": result.get("action", "BLOCK_AND_LOG"),
                            "blocked_at": blocked_record.blocked_at.isoformat() if blocked_record.blocked_at else None,
                            "source_platform": item.get("platform")
                        }))
                    except Exception as e:
                        print(f"WebSocket notification error: {e}")
                    
                    return {
                        "blocked": True,
                        "policy_id": policy.id,
                        "policy_name": policy.name,
                        "reason": result.get("reason", "Policy violation"),
                        "action": result.get("action", "BLOCK_AND_LOG")
                    }
            
            return None  # No policy matched, allow through
            
        except Exception as e:
            print(f"Guardrail error: {str(e)}")
            return None  # On error, allow through (fail open)
    
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
            
            # Step 3: Agent 4 - Apply guardrails (BEFORE processing)
            graph_data = None
            if analysis.get("risk_score", 0) > 0.6:
                # Get graph cluster info if available
                graph_data = {"cluster_size": 1}  # Simplified - in production, query Neo4j
            
            guardrail_result = await self.apply_guardrails(item, analysis, graph_data)
            
            if guardrail_result and guardrail_result.get("blocked"):
                # Post was blocked by Agent 4
                return {
                    "item_id": item.get("id"),
                    "content_hash": content_hash,
                    "status": "blocked",
                    "blocked_by": "Agent 4 (Policy Guardian)",
                    "policy": guardrail_result.get("policy_name"),
                    "reason": guardrail_result.get("reason"),
                    "processed_at": datetime.utcnow().isoformat()
                }
            
            # Step 4: If malicious, create graph nodes (only if not blocked)
            if analysis.get("risk_score", 0) > 0.6 and self.neo4j_service.enabled:
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
            
            print(f"Ingesting {len(items)} items from {file_path}")
            results = await self.process_batch(items)
            
            success_count = sum(1 for r in results if r.get("status") == "success")
            print(f"Processed {success_count}/{len(items)} items successfully")
            
            return results
        except Exception as e:
            print(f"Error ingesting from file: {str(e)}")
            return []
    
    async def start_stream_processing(self, stream_source: Any):
        """
        Start continuous stream processing
        Can be connected to real-time social media APIs
        """
        self.is_running = True
        print("Stream ingest worker started")
        
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
                print(f"Error in stream processing: {str(e)}")
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
    print("\n📊 Summary:")
    print(f"   Total processed: {len(results)}")
    print(f"   High-risk items: {len(high_risk)}")


if __name__ == "__main__":
    asyncio.run(main())

