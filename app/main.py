"""
Disaster Direct - FastAPI Backend
AI-powered storm prediction and contractor deployment platform
"""
import os
from contextlib import asynccontextmanager
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
from app.deps import get_deps
from app.database import init_db, close_db


# Global supervisor instance
supervisor: Supervisor | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle manager for FastAPI application
    Handles startup and shutdown events
    """
    # Startup
    print("🚀 Initializing Disaster Direct API...")
    
    # Initialize database
    await init_db()
    print("✅ Database connected")
    
    # Initialize dependencies (services, tools, etc.)
    deps = await get_deps()
    
    # Initialize agent orchestration system
    global supervisor
    supervisor = Supervisor(deps)
    print("🤖 Agent Orchestration System initialized")
    print(f"   - Agents: Legal, Weather, Vision, Dispatch, Claims, Negotiator, Finance")
    
    print("✅ Disaster Direct API ready")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down Disaster Direct API...")
    await close_db()
    print("✅ Cleanup complete")


# Initialize FastAPI app
app = FastAPI(
    title="Disaster Direct API",
    description="AI-powered storm prediction and contractor deployment platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)


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
        "service": "Disaster Direct API",
        "status": "operational",
        "version": "1.0.0",
        "docs": "/api/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "orchestration": "active" if supervisor else "initializing"
    }


# Agent Orchestration Endpoints
@app.post("/api/orchestration/task")
async def execute_task(request: Request):
    """
    Execute a single agent task
    
    Body:
    {
        "type": "weather_analysis" | "dispatch_contractor" | "create_claim" | ...,
        "data": { ... },
        "priority": "low" | "medium" | "high" | "urgent"
    }
    """
    if not supervisor:
        return JSONResponse(
            status_code=503,
            content={"error": "Agent orchestration system not initialized"}
        )
    
    body = await request.json()
    result = await supervisor.handle_event(body)
    return result


@app.post("/api/orchestration/event")
async def handle_event(request: Request):
    """
    Handle business events that trigger agent workflows
    
    Supported event types:
    - WEATHER_IMPACT: Trigger contractor deployment
    - UPLOAD_CONTRACT: Legal validation
    - MEDIA_UPLOADED: Damage analysis
    - INVOICE_DISPUTED: Prepare negotiation rebuttal
    - PAYMENT_DUE: Payment reminders
    
    Body:
    {
        "type": "WEATHER_IMPACT" | "UPLOAD_CONTRACT" | ...,
        "data": { ... }
    }
    """
    if not supervisor:
        return JSONResponse(
            status_code=503,
            content={"error": "Agent orchestration system not initialized"}
        )
    
    body = await request.json()
    result = await supervisor.handle_event(body)
    return result


@app.get("/api/orchestration/agents")
async def list_agents():
    """List all available agents and their capabilities"""
    if not supervisor:
        return JSONResponse(
            status_code=503,
            content={"error": "Agent orchestration system not initialized"}
        )
    
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


# Register routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(membership.router, prefix="/api/membership", tags=["Membership"])
app.include_router(contractor.router, prefix="/api/contractor", tags=["Contractor"])
app.include_router(leads.router, prefix="/api/leads", tags=["Leads"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(claims.router, prefix="/api/claims", tags=["Claims"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(compliance.router, prefix="/api/compliance", tags=["Compliance"])


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
