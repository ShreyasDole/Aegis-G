"""
Aegis-G: Base Scaffold
FastAPI Application Entry Point - Simplified for Infrastructure Testing
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import system

app = FastAPI(title="Aegis-G Base API")

# Allow Frontend to talk to Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In prod, change to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the basic router
app.include_router(system.router, prefix="/api/system", tags=["System"])


@app.get("/")
def root():
    return {"message": "Aegis-G API is Online", "status": "active"}

