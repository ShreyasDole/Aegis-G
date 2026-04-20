"""
Outlook / Microsoft Entra OAuth 2.0
Sign-in with Microsoft account; find or create user, issue JWT.
"""
import logging
import secrets
from typing import Optional
from urllib.parse import urlencode

from app.config import settings

logger = logging.getLogger(__name__)

OAUTH_SCOPES = "openid profile email"
OAUTH_AUTHORITY = "https://login.microsoftonline.com"
OAUTH_AUTHORIZE_PATH = "/oauth2/v2.0/authorize"
OAUTH_TOKEN_PATH = "/oauth2/v2.0/token"
GRAPH_ME = "https://graph.microsoft.com/v1.0/me"


def is_outlook_configured() -> bool:
    return bool(
        settings.OUTLOOK_CLIENT_ID
        and settings.OUTLOOK_TENANT_ID
        and settings.OUTLOOK_CLIENT_SECRET
    )


def get_redirect_uri(api_base: str) -> str:
    """Callback URL must match Azure app registration."""
    base = (api_base or "").rstrip("/")
    return f"{base}/api/auth/outlook/callback"


def get_authorize_url(redirect_uri: str, state: Optional[str] = None) -> str:
    """Build Microsoft authorize URL for redirect."""
    state = state or secrets.token_urlsafe(32)
    params = {
        "client_id": settings.OUTLOOK_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": redirect_uri,
        "scope": OAUTH_SCOPES,
        "response_mode": "query",
        "state": state,
    }
    authority = f"{OAUTH_AUTHORITY}/{settings.OUTLOOK_TENANT_ID}"
    return f"{authority}{OAUTH_AUTHORIZE_PATH}?{urlencode(params)}"


async def exchange_code_for_user_info(code: str, redirect_uri: str) -> dict:
    """
    Exchange authorization code for tokens and fetch user profile from Microsoft Graph.
    Returns dict with email, name (displayName), id (oid).
    """
    import httpx

    token_url = f"{OAUTH_AUTHORITY}/{settings.OUTLOOK_TENANT_ID}{OAUTH_TOKEN_PATH}"
    data = {
        "client_id": settings.OUTLOOK_CLIENT_ID,
        "client_secret": settings.OUTLOOK_CLIENT_SECRET,
        "code": code,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            token_url,
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=15.0,
        )
        token_res.raise_for_status()
        tokens = token_res.json()
    access_token = tokens.get("access_token")
    if not access_token:
        raise ValueError("No access_token in OAuth response")

    async with httpx.AsyncClient() as client:
        me_res = await client.get(
            GRAPH_ME,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10.0,
        )
        me_res.raise_for_status()
        me = me_res.json()
    return {
        "email": (me.get("mail") or me.get("userPrincipalName") or "").lower(),
        "name": me.get("displayName") or me.get("mail") or "User",
        "oid": me.get("id"),
    }
