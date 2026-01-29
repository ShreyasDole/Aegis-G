"""
Aegis-G: Cognitive Shield Command Center
FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import detection, forensics, graph, sharing, worker

app = FastAPI(
    title="Aegis-G API",
    description="National Security Defense against AI-driven Malign Information Operations",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(detection.router, prefix="/api/scan", tags=["Detection"])
app.include_router(forensics.router, prefix="/api/analyze", tags=["Forensics"])
app.include_router(graph.router, prefix="/api/network", tags=["Graph"])
app.include_router(sharing.router, prefix="/api/federated", tags=["Sharing"])
app.include_router(worker.router, prefix="/api/worker", tags=["Workers"])


@app.get("/")
async def root():
    return {"message": "Aegis-G Cognitive Shield API", "status": "operational"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

