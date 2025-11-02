"""
Disaster Direct - FastAPI Backend
AI-powered storm prediction and contractor deployment platform
"""
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Routers
from app.routers import (
    auth,
    membership,
    contractor,
    leads,
    jobs,
    claims,
    payments,
    compliance
)

# Agent Orchestration
from app.agents.supervisor import Supervisor
from app.deps import build_dependencies
from app.utils.events import EventBus
from app.database import init_db, close_db


# Initialize FastAPI app
app = FastAPI(
    title="Storm Disaster Agentic API",
    description="AI-powered storm prediction and contractor deployment platform",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)


# Build dependencies and initialize orchestration
deps = build_dependencies()
bus = EventBus()
supervisor = Supervisor(deps)


@app.on_event("startup")
async def startup():
    """Initialize application on startup"""
    print("🚀 Initializing Storm Disaster Agentic API...")
    
    # Initialize database
    await init_db()
    print("✅ Database connected")
    
    # Subscribe supervisor to event bus
    bus.subscribe(supervisor.handle_event)
    print("🤖 Supervisor subscribed to event bus")
    print(f"   - Agents: Legal, Weather, Vision, Dispatch, Claims, Negotiator, Finance")
    
    print("✅ Storm Disaster API ready")


@app.on_event("shutdown")
async def shutdown():
    """Cleanup on shutdown"""
    print("🛑 Shutting down Storm Disaster API...")
    await close_db()
    print("✅ Cleanup complete")


# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/")
async def root():
    """Root endpoint - health check"""
    return {
        "service": "Storm Disaster Agentic API",
        "status": "operational",
        "version": "0.1.0",
        "docs": "/api/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "orchestration": "active",
        "event_bus": f"{len(bus.handlers)} handlers subscribed"
    }


# Event Bus Endpoints
@app.post("/api/events/publish")
async def publish_event(request: Request):
    """
    Publish event to event bus
    Supervisor will receive and route to appropriate agent
    
    Body:
    {
        "type": "WEATHER_IMPACT" | "UPLOAD_CONTRACT" | "MEDIA_UPLOADED" | ...,
        "data": { ... }
    }
    """
    event = await request.json()
    results = await bus.publish(event)
    
    # Return first result (from supervisor)
    return results[0] if results else {"ok": False, "error": "No handlers subscribed"}


@app.get("/api/events/handlers")
async def get_event_handlers():
    """Get number of subscribed event handlers"""
    return {
        "handlers": len(bus.handlers),
        "message": f"{len(bus.handlers)} event handler(s) subscribed"
    }


# Agent Orchestration Endpoints
@app.post("/api/orchestration/task")
async def execute_task(request: Request):
    """
    Execute a single agent task directly through supervisor
    
    Body:
    {
        "type": "weather_analysis" | "dispatch_contractor" | "create_claim" | ...,
        "data": { ... },
        "priority": "low" | "medium" | "high" | "urgent"
    }
    """
    task = await request.json()
    result = await supervisor.handle_event(task)
    return result


@app.get("/api/orchestration/agents")
async def list_agents():
    """List all available agents and their capabilities"""
    return {
        "agents": [
            {
                "name": "LegalAgent",
                "capabilities": ["validate_contract", "generate_contract", "check_lien_deadline"],
                "description": "Handles legal compliance, contracts, and state-specific regulations"
            },
            {
                "name": "WeatherAgent",
                "capabilities": ["weather_analysis", "hazard_detection", "forecast"],
                "description": "Analyzes weather patterns for contractor deployment"
            },
            {
                "name": "VisionAgent",
                "capabilities": ["analyze_image", "detect_damage", "estimate_cost"],
                "description": "AI-powered damage assessment from photos/videos"
            },
            {
                "name": "DispatchAgent",
                "capabilities": ["broadcast_leads", "notify_contractor", "calculate_eta"],
                "description": "Contractor deployment and notifications"
            },
            {
                "name": "ClaimAgent",
                "capabilities": ["create_claim", "analyze_damage", "update_status"],
                "description": "Insurance claim creation and management"
            },
            {
                "name": "NegotiatorAgent",
                "capabilities": ["prepare_rebuttal", "analyze_offer", "counter_offer"],
                "description": "Insurance claim negotiation and rebuttals"
            },
            {
                "name": "FinanceAgent",
                "capabilities": ["process_payment", "generate_invoice", "send_reminder"],
                "description": "Payment processing and invoicing"
            }
        ],
        "count": 7
    }


# Include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(membership.router, prefix="/membership", tags=["membership"])
app.include_router(contractor.router, prefix="/contractor", tags=["contractor"])
app.include_router(leads.router, prefix="/leads", tags=["leads"])
app.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
app.include_router(claims.router, prefix="/claims", tags=["claims"])
app.include_router(payments.router, prefix="/payments", tags=["payments"])
app.include_router(compliance.router, prefix="/compliance", tags=["compliance"])


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all exception handler"""
    print(f"❌ Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc) if os.getenv("ENV") == "development" else "An error occurred"
        }
    )


# Run with uvicorn (Replit-compatible)
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",  # Required for Replit
        port=port,
        reload=os.getenv("ENV") == "development",
        log_level="info"
    )
