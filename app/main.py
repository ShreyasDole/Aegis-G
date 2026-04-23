"""
Aegis-G: Cognitive Shield Command Center
FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import system, auth, admin, ai, analyst, websocket, graph, threats, sharing, detection, forensics, worker, scan_core
from app.middleware import AuthorizationMiddleware
from app.middleware.audit import AuditMiddleware
from app.config import settings, validate_production_settings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events — runs on startup and shutdown"""
    # ── Step 0: Validate production settings ───────────────────────────────
    # BUG FIX: fail fast with a clear error message if critical env vars
    # (DATABASE_URL, SECRET_KEY, GEMINI_API_KEY) are missing or insecure.
    # This is a no-op in development (ENVIRONMENT=development).
    try:
        validate_production_settings()
    except RuntimeError as e:
        logger.critical(f"Startup aborted due to configuration error: {e}")
        raise

    # ── Step 1: Ensure all database tables exist ───────────────────────────
    # Import all models so they're registered with Base.metadata, then
    # create any missing tables. This is idempotent (safe on every restart)
    # and works for both SQLite (dev) and PostgreSQL (prod).
    try:
        import app.models  # registers all ORM models with Base.metadata
        from app.models.database import Base, engine
        from sqlalchemy import text
        
        # Initialize pgvector extension BEFORE creating tables
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            conn.commit()
            
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified / created (including pgvector).")
    except Exception as e:
        logger.error(f"Database table creation failed: {e}")

    # ── Step 2: Startup banner ─────────────────────────────────────────────
    logger.info("Aegis-G Starting Up...")
    logger.info("Authorization Engine: Loaded")
    logger.info("Audit Logging: Active")
    logger.info("AI Services: Ready")

    # ── Step 3: Seed default users (dev/test only) ─────────────────────────
    try:
        from app.seed import seed_default_users
        seed_default_users()
    except Exception as e:
        logger.warning(f"Seed users skipped: {e}")

    yield
    # ── Shutdown (nothing to clean up currently) ───────────────────────────


app = FastAPI(
    title="Aegis-G API",
    description="National Security Defense against AI-driven Malign Information Operations",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Configuration
# BUG FIX: use settings.CORS_ORIGINS instead of "*" so production deployments
# (Railway backend + Vercel frontend) are locked to specific origins.
cors_origins = list(settings.CORS_ORIGINS)
if settings.FRONTEND_URL and settings.FRONTEND_URL not in cors_origins:
    cors_origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Authorization Middleware (checks permissions)
app.add_middleware(AuthorizationMiddleware)

# Add Audit Middleware (logs all requests)
app.add_middleware(AuditMiddleware)

# Mount static files (for local storage)
try:
    app.mount("/storage", StaticFiles(directory="storage"), name="storage")
except Exception as e:
    logger.warning(f"Storage directory not found: {e}")

# Include Routers
app.include_router(system.router, prefix="/api/system", tags=["System"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(analyst.router, prefix="/api/analyst", tags=["Intelligence Analyst"])
app.include_router(graph.router, prefix="/api/network", tags=["Graph"])
app.include_router(threats.router, prefix="/api/threats", tags=["Threats"])
app.include_router(sharing.router, prefix="/api/sharing", tags=["Intelligence Sharing"])
app.include_router(detection.router, prefix="/api/scan", tags=["Detection"])
app.include_router(scan_core.router, prefix="/api/scan", tags=["Detection Core"])
app.include_router(forensics.router, prefix="/api/forensics", tags=["Forensics"])
app.include_router(worker.router, prefix="/api/worker", tags=["Workers"])
app.include_router(websocket.router, tags=["WebSocket"])


@app.get("/")
async def root():
    return {
        "message": "Aegis-G API is Online", 
        "status": "active",
        "version": "2.0.0",
        "features": [
            "JWT Authentication",
            "Authorization Engine (RBAC)",
            "Audit Logging",
            "User Approval Workflow",
            "AI Policies",
            "AI Insights",
            "AI Chat Manager",
            "Redis Caching",
            "File Upload"
        ]
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for load balancers and monitoring"""
    from app.services.cache import cache
    
    return {
        "status": "healthy",
        "version": "2.0.0",
        "cache": "enabled" if cache.enabled else "disabled"
    }

