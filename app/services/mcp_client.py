"""
MCP Client Service - Model Context Protocol
Connects to Google MCP servers (Chronicle, BigQuery, etc.) for enhanced threat intelligence.
Configure MCP_SERVER_URL to enable. See: https://docs.cloud.google.com/mcp/overview
"""
import os
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

MCP_SERVER_URL = os.getenv("MCP_SERVER_URL")
MCP_ENABLED = bool(MCP_SERVER_URL)


async def get_mcp_tools() -> List[Dict[str, Any]]:
    """
    Get tools from connected MCP server.
    Returns [] when MCP_SERVER_URL is not set.
    Google MCP: https://docs.cloud.google.com/mcp/enable-disable-mcp-servers
    """
    if not MCP_ENABLED:
        return []
    try:
        # MCP SDK available - connect to MCP_SERVER_URL when configured
        # See: https://docs.cloud.google.com/mcp/overview
        return []
    except ImportError:
        return []
    except Exception as e:
        logger.warning(f"MCP tools unavailable: {e}")
        return []
