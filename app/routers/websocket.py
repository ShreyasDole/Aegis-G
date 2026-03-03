"""
WebSocket Router
Real-time notifications for blocked content (Agent 4)
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict, Any
import json
import asyncio
from datetime import datetime

router = APIRouter()

# Active WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    
    async def broadcast_blocked_content(self, blocked_data: Dict[str, Any]):
        """Broadcast blocked content to all connected clients"""
        message = {
            "type": "blocked_content",
            "timestamp": datetime.utcnow().isoformat(),
            "data": blocked_data
        }
        
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error sending to WebSocket: {e}")
                disconnected.append(connection)
        
        # Remove disconnected clients
        for conn in disconnected:
            self.disconnect(conn)
    
    async def broadcast_stats_update(self, stats: Dict[str, Any]):
        """Broadcast stats update to all connected clients"""
        message = {
            "type": "stats_update",
            "timestamp": datetime.utcnow().isoformat(),
            "data": stats
        }
        
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error sending stats update: {e}")
                disconnected.append(connection)
        
        for conn in disconnected:
            self.disconnect(conn)


# Global connection manager
manager = ConnectionManager()


@router.websocket("/ws/blocked-content")
async def websocket_blocked_content(websocket: WebSocket):
    """
    WebSocket endpoint for real-time blocked content notifications
    Clients receive updates when content is blocked by Agent 4
    """
    await manager.connect(websocket)
    
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connected",
            "message": "Connected to Agent 4 blocked content stream",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Keep connection alive and handle incoming messages
        while True:
            # Wait for any message (ping/pong for keepalive)
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                # Echo ping messages
                if data == "ping":
                    await websocket.send_json({"type": "pong"})
            except asyncio.TimeoutError:
                # Send keepalive
                await websocket.send_json({"type": "keepalive"})
            except WebSocketDisconnect:
                break
                
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket)


# Function to notify about blocked content (called from worker)
async def notify_blocked_content(blocked_data: Dict[str, Any]):
    """Notify all WebSocket clients about blocked content"""
    await manager.broadcast_blocked_content(blocked_data)

