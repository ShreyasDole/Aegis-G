"""
Configuration Management
Environment variables and settings
"""
import os
from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    # API Configuration
    API_V1_PREFIX: str = "/api"
    PROJECT_NAME: Optional[str] = "Aegis-G"
    API_V1_STR: Optional[str] = "/api/v1"
    
    # Gemini API
    GEMINI_API_KEY: str = "test-key"
    GEMINI_FLASH_MODEL: str = "gemini-2.0-flash"
    GEMINI_PRO_MODEL: str = "gemini-2.0-flash"
    
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
    
    # Keycloak (if using)
    KEYCLOAK_URL: str = "http://localhost:8080"
    KEYCLOAK_REALM: str = "aegis"
    KEYCLOAK_CLIENT_ID: Optional[str] = None
    KEYCLOAK_CLIENT_SECRET: Optional[str] = None
    
    # Application
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    ENABLE_METRICS: bool = False
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields in .env


settings = Settings()

