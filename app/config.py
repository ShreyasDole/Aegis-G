"""
Configuration Management
Environment variables and settings
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # API Configuration
    API_V1_PREFIX: str = "/api"
    
    # Gemini API
    GEMINI_API_KEY: str
    GEMINI_FLASH_MODEL: str = "gemini-1.5-flash"
    GEMINI_PRO_MODEL: str = "gemini-1.5-pro"
    
    # Database Configuration
    DATABASE_URL: str
    NEO4J_URI: str
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    # Keycloak (if using)
    KEYCLOAK_URL: str = "http://localhost:8080"
    KEYCLOAK_REALM: str = "aegis"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

