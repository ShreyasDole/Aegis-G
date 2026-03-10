"""
Configuration Management
Environment variables and settings
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List, Optional

# Project root (parent of app/) so .env is found regardless of cwd
_ROOT_DIR = Path(__file__).resolve().parent.parent
_ENV_FILE = _ROOT_DIR / ".env"


class Settings(BaseSettings):
    # API Configuration
    API_V1_PREFIX: str = "/api"
    PROJECT_NAME: Optional[str] = "Aegis-G"
    API_V1_STR: Optional[str] = "/api/v1"
    
    # Gemini API
    GEMINI_API_KEY: str = "test-key"
    GEMINI_FLASH_MODEL: str = "gemini-2.5-flash"
    
    # Database Configuration
    DATABASE_URL: str = "sqlite:///:memory:"
    POSTGRES_USER: Optional[str] = "aegis"
    POSTGRES_PASSWORD: Optional[str] = "aegis_password"
    POSTGRES_DB: Optional[str] = "aegis"
    
    # Neo4j Configuration
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "test"
    NEO4J_AUTH: Optional[str] = None
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    # Outlook / Microsoft OAuth (login)
    OUTLOOK_CLIENT_ID: Optional[str] = None
    OUTLOOK_TENANT_ID: Optional[str] = None
    OUTLOOK_CLIENT_SECRET: Optional[str] = None
    ENCRYPTION_KEY: Optional[str] = None
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # MCP (Model Context Protocol) - Google/Google Cloud remote MCP servers
    # Docs: https://docs.cloud.google.com/mcp/overview
    # Manage: https://docs.cloud.google.com/mcp/manage-mcp-servers
    # Products: https://docs.cloud.google.com/mcp/supported-products
    # Auth: https://docs.cloud.google.com/mcp/authenticate-mcp
    MCP_SERVER_URL: Optional[str] = None
    MCP_SERVER_URLS: Optional[str] = None  # Comma-separated list for multiple servers
    MCP_GOOGLE_PROJECT_ID: Optional[str] = None  # x-goog-user-project header (GCP MCP)
    # Developer Knowledge MCP (search Google docs): https://developers.google.com/knowledge/mcp
    DEVELOPER_KNOWLEDGE_API_KEY: Optional[str] = None  # Optional; API key auth for developerknowledge.googleapis.com/mcp

    # Application
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    ENABLE_METRICS: bool = False
    
    class Config:
        env_file = str(_ENV_FILE) if _ENV_FILE.exists() else ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields in .env


settings = Settings()

