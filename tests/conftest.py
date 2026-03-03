"""
Pytest Fixtures and Configuration
Shared test fixtures for Aegis-G test suite
Updated: 2026-02-05 - Fixed email validation for tests
"""
import os
import sys
import types
import pytest
from typing import Generator
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Set test environment before importing app
os.environ["ENVIRONMENT"] = "testing"
# Use SECRET_KEY from environment if set (for CI), otherwise use default
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
# Force SQLite for tests (override CI's PostgreSQL setting)
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ.setdefault("NEO4J_URI", "bolt://localhost:7687")
os.environ.setdefault("NEO4J_PASSWORD", "test")
os.environ.setdefault("GEMINI_API_KEY", "test-key")

# Mock google.genai before app imports (app uses "from google import genai" and "from google.genai import types").
# Lets CI run without installing google-genai (which would pull httpx 0.28+ and break TestClient).
def _make_genai_mock():
    m = types.ModuleType("google.genai")
    m.types = MagicMock()
    m.Client = MagicMock()
    # Any other attribute (e.g. types.GenerateContentConfig) returns a MagicMock
    m.__getattr__ = lambda name: MagicMock()
    return m

if "google" not in sys.modules:
    sys.modules["google"] = types.ModuleType("google")
_genai_module = _make_genai_mock()
sys.modules["google.genai"] = _genai_module
sys.modules["google"].genai = _genai_module

# Import all models to register them with Base.metadata
import app.models  # This imports all models via __init__.py
from app.models.database import Base, get_db
from app.main import app


# ============================================
# Database Fixtures
# ============================================

# In-memory SQLite for testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session() -> Generator:
    """
    Creates a fresh database session for each test
    Tables are created before and dropped after each test
    """
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        # Drop all tables after test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session) -> Generator:
    """
    Test client with database dependency override
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


# ============================================
# User Fixtures
# ============================================

@pytest.fixture
def test_user_data():
    """Standard test user data"""
    return {
        "email": "test@aegis.com",
        "password": "TestPassword123!",
        "full_name": "Test User"
    }


@pytest.fixture
def test_admin_data():
    """Admin user data"""
    return {
        "email": "admin@aegis.com",
        "password": "AdminPassword123!",
        "full_name": "Admin User"
    }


@pytest.fixture
def registered_user(client, test_user_data):
    """Create and return a registered user"""
    response = client.post("/api/auth/register", json=test_user_data)
    assert response.status_code == 201
    return response.json()


@pytest.fixture
def auth_headers(client, test_user_data, registered_user):
    """Get authentication headers for a registered user"""
    response = client.post("/api/auth/login", json={
        "email": test_user_data["email"],
        "password": test_user_data["password"]
    })
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ============================================
# Threat Fixtures
# ============================================

@pytest.fixture
def sample_threat_data():
    """Sample threat data for testing"""
    return {
        "content": "Suspicious activity detected from IP 192.168.1.1",
        "source_platform": "network_monitor",
        "risk_score": 7.5
    }


# ============================================
# Utility Fixtures
# ============================================

@pytest.fixture
def mock_gemini_response():
    """Mock response from Gemini API"""
    return {
        "analysis": "This appears to be a potential reconnaissance attempt.",
        "risk_level": "medium",
        "recommendations": [
            "Monitor source IP for additional activity",
            "Review firewall logs",
            "Consider temporary IP block"
        ]
    }

