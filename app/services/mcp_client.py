"""
MCP Client Service - Model Context Protocol (Google AI MCP)
Connects to MCP servers (e.g. Google Chronicle, BigQuery) for enhanced threat intelligence.
Uses the official MCP Python SDK: https://github.com/modelcontextprotocol/python-sdk
Configure MCP_SERVER_URL in env to enable. See: https://docs.cloud.google.com/mcp
"""
import asyncio
import logging
from typing import Any, Dict, List

from app.config import settings

logger = logging.getLogger(__name__)

MCP_SERVER_URL = settings.MCP_SERVER_URL
MCP_ENABLED = bool(MCP_SERVER_URL)


async def get_mcp_tools() -> List[Dict[str, Any]]:
    """
    Get tools from the connected MCP server (Google AI MCP or any MCP-compatible server).
    Returns [] when MCP_SERVER_URL is not set or on any error.
    """
    if not MCP_ENABLED:
        return []
    try:
        from mcp import ClientSession
        from mcp.client.sse import sse_client
    except ImportError:
        logger.debug("MCP SDK not installed; pip install mcp")
        return []
    try:
        url = (MCP_SERVER_URL or "").strip()
        if not url:
            return []
        tools: List[Dict[str, Any]] = []
        async with sse_client(url=url) as (read_stream, write_stream):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                result = await session.list_tools()
                for t in getattr(result, "tools", []) or []:
                    tools.append({
                        "name": getattr(t, "name", ""),
                        "description": getattr(t, "description", "") or "",
                        "inputSchema": getattr(t, "inputSchema", None) or {},
                    })
        return tools
    except asyncio.CancelledError:
        raise
    except Exception as e:
        logger.warning("MCP tools unavailable: %s", e)
        return []
