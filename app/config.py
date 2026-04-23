"""
Configuration Management
Environment variables and settings
"""
import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional


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
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    
    # CORS (merged in main.py with localhost list + CORS_EXTRA_ORIGINS env)
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]
    
    # Application
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    ENABLE_METRICS: bool = False

    # MCP (optional — mcp_client uses getattr too; fields here for .env discovery)
    MCP_GOOGLE_PROJECT_ID: Optional[str] = None
    MCP_SERVER_URL: Optional[str] = None
    MCP_SERVER_URLS: Optional[str] = None
    DEVELOPER_KNOWLEDGE_API_KEY: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",  # Ignore extra fields in .env
    )


settings = Settings()

