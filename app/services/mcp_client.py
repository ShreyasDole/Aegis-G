"""
MCP Client Service - Model Context Protocol

Connects to Google and Google Cloud remote MCP servers for threat intelligence,
BigQuery, Chronicle, and the Developer Knowledge MCP (official Google docs search).

Latest docs:
  Overview:    https://docs.cloud.google.com/mcp/overview
  Manage:     https://docs.cloud.google.com/mcp/manage-mcp-servers
  Products:   https://docs.cloud.google.com/mcp/supported-products
  Auth:       https://docs.cloud.google.com/mcp/authenticate-mcp
  Dev Knowledge: https://developers.google.com/knowledge/mcp

Tools discovery uses the MCP tools/list method (no auth required for list).
"""
import logging
from typing import Any, Dict, List, Tuple

from app.config import settings

logger = logging.getLogger(__name__)

# Developer Knowledge MCP endpoint (Google official docs: Firebase, Cloud, Android, Maps)
DEVELOPER_KNOWLEDGE_MCP_URL = "https://developerknowledge.googleapis.com/mcp"


def _get_mcp_server_configs() -> List[Tuple[str, Dict[str, str]]]:
    """
    Build list of (base_url, headers) for each configured MCP server.
    Uses MCP_SERVER_URL, MCP_SERVER_URLS, and optionally Developer Knowledge with API key.
    """
    configs: List[Tuple[str, Dict[str, str]]] = []
    headers: Dict[str, str] = {"Content-Type": "application/json"}
    proj = getattr(settings, "MCP_GOOGLE_PROJECT_ID", None) or ""
    if str(proj).strip():
        headers["X-goog-user-project"] = str(proj).strip()

    # Single URL
    single = getattr(settings, "MCP_SERVER_URL", None) or ""
    if str(single).strip():
        url = str(single).strip().rstrip("/")
        if not url.startswith("http"):
            url = f"https://{url}"
        configs.append((url, dict(headers)))

    # Multiple URLs (comma-separated)
    multi = getattr(settings, "MCP_SERVER_URLS", None) or ""
    if str(multi).strip():
        for part in str(multi).split(","):
            url = part.strip().rstrip("/")
            if not url:
                continue
            if not url.startswith("http"):
                url = f"https://{url}"
            configs.append((url, dict(headers)))

    # Developer Knowledge MCP (search_documents, get_document, batch_get_documents)
    dk_key = getattr(settings, "DEVELOPER_KNOWLEDGE_API_KEY", None) or ""
    if str(dk_key).strip():
        dk_headers = dict(headers)
        dk_headers["X-Goog-Api-Key"] = str(dk_key).strip()
        if (DEVELOPER_KNOWLEDGE_MCP_URL, dk_headers) not in [(u, h) for u, h in configs]:
            configs.append((DEVELOPER_KNOWLEDGE_MCP_URL, dk_headers))

    return configs


def is_mcp_enabled() -> bool:
    """True if any MCP server is configured."""
    return len(_get_mcp_server_configs()) > 0


async def _list_tools_from_server(base_url: str, headers: Dict[str, str]) -> List[Dict[str, Any]]:
    """
    Call MCP tools/list on one server. Endpoint is POST {base_url} with JSON-RPC.
    Ref: https://docs.cloud.google.com/mcp/manage-mcp-servers#list-available-tools
    """
    try:
        import httpx
    except ImportError:
        logger.debug("httpx not available for MCP tools/list")
        return []

    # MCP JSON-RPC 2.0 tools/list
    payload = {"jsonrpc": "2.0", "id": 1, "method": "tools/list"}
    url = base_url if base_url.endswith("/mcp") else f"{base_url.rstrip('/')}/mcp"

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(url, json=payload, headers=headers)
            r.raise_for_status()
            data = r.json()
    except Exception as e:
        logger.warning("MCP tools/list failed for %s: %s", base_url, e)
        return []

    result = data.get("result")
    if not result:
        return []
    tools = result.get("tools")
    if not isinstance(tools, list):
        return []
    return [t for t in tools if isinstance(t, dict) and t.get("name")]


async def get_mcp_tools() -> List[Dict[str, Any]]:
    """
    Get tools from all configured Google/Google Cloud MCP servers.
    Returns a combined list; each tool dict includes name, description, input_schema, etc.
    Returns [] when no MCP servers are configured.
    """
    configs = _get_mcp_server_configs()
    if not configs:
        return []

    all_tools: List[Dict[str, Any]] = []
    for base_url, headers in configs:
        tools = await _list_tools_from_server(base_url, headers)
        for t in tools:
            t["_mcp_server"] = base_url
        all_tools.extend(tools)

    if all_tools:
        logger.info("MCP: discovered %s tools from %s server(s)", len(all_tools), len(configs))
    return all_tools
