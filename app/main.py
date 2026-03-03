"""
Aegis-G: Cognitive Shield Command Center
FastAPI Application Entry Point
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import system, auth, admin, ai, analyst, websocket, graph, threats, sharing, detection
from app.middleware import AuthorizationMiddleware
from app.middleware.audit import AuditMiddleware
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Aegis-G API",
    description="National Security Defense against AI-driven Malign Information Operations",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Update for production
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
app.include_router(websocket.router, tags=["WebSocket"])


@app.on_event("startup")
async def startup():
    """Run on application startup"""
    logger.info("Aegis-G Starting Up...")
    logger.info("Authorization Engine: Loaded")
    logger.info("Audit Logging: Active")
    logger.info("AI Services: Ready")
    # Skip seed in testing (tests use their own DB and fixtures)
    if os.getenv("ENVIRONMENT") == "testing":
        return
    # Seed default test/admin users if they don't exist
    try:
        from app.seed import seed_default_users
        seed_default_users()
    except Exception as e:
        logger.warning(f"Seed users skipped (tables may not exist yet): {e}")


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

