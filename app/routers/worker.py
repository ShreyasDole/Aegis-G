"""
Worker Router
Endpoints for managing background processing workers
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.workers.ingest_stream import StreamIngestWorker
from typing import Optional

router = APIRouter()
worker_instance: Optional[StreamIngestWorker] = None


@router.post("/ingest/start")
async def start_ingest_worker(background_tasks: BackgroundTasks):
    """
    Start the stream ingest worker
    Processes social media feeds in the background
    """
    global worker_instance
    
    if worker_instance and worker_instance.is_running:
        return {"status": "already_running", "message": "Worker is already running"}
    
    worker_instance = StreamIngestWorker()
    
    # Start worker in background
    background_tasks.add_task(worker_instance.start_stream_processing, None)
    
    return {
        "status": "started",
        "message": "Stream ingest worker started"
    }


@router.post("/ingest/stop")
async def stop_ingest_worker():
    """Stop the stream ingest worker"""
    global worker_instance
    
    if not worker_instance or not worker_instance.is_running:
        return {"status": "not_running", "message": "Worker is not running"}
    
    worker_instance.stop()
    
    return {
        "status": "stopped",
        "message": "Stream ingest worker stopped"
    }


@router.post("/ingest/process-file")
async def process_file(file_path: str = "data/social_feed.json"):
    """
    Process items from a JSON file
    Useful for batch processing mock data
    """
    try:
        worker = StreamIngestWorker()
        results = await worker.ingest_from_file(file_path)
        
        success_count = sum(1 for r in results if r.get("status") == "success")
        high_risk_count = sum(
            1 for r in results 
            if r.get("analysis", {}).get("risk_score", 0) > 0.7
        )
        
        return {
            "status": "completed",
            "total_processed": len(results),
            "successful": success_count,
            "high_risk_items": high_risk_count,
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")


@router.get("/ingest/status")
async def get_worker_status():
    """Get current status of the ingest worker"""
    global worker_instance
    
    if not worker_instance:
        return {
            "status": "not_initialized",
            "is_running": False
        }
    
    return {
        "status": "running" if worker_instance.is_running else "stopped",
        "is_running": worker_instance.is_running,
        "queue_size": worker_instance.processing_queue.qsize() if hasattr(worker_instance.processing_queue, 'qsize') else 0
    }

