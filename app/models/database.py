"""
Database Configuration and Base Model
Central database setup for SQLAlchemy
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool
import os

# Get database URL from environment
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://aegis:aegis_password@localhost:5432/aegis"
)

# ── Engine configuration ────────────────────────────────────────────────────
# SQLite requires check_same_thread=False and StaticPool to work correctly
# when accessed from multiple threads (FastAPI async handlers, middleware,
# lifespan events, and tests all run in different threads).
# PostgreSQL does NOT need these overrides.
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    engine = create_engine(DATABASE_URL)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all models
Base = declarative_base()


def get_db():
    """Dependency for getting database sessions"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
