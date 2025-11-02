"""Storm Disaster Agentic API"""
from fastapi import FastAPI
from .routers import auth, membership, contractor, leads, jobs, claims, payments, compliance
from .utils.events import EventBus
from .agents.supervisor import Supervisor
from .deps import build_dependencies


app = FastAPI(title="Storm Disaster Agentic API", version="0.1.0")


deps = build_dependencies()
bus = EventBus()
supervisor = Supervisor(deps)


@app.on_event("startup")
async def startup():
    # subscribe agent supervisor to event bus
    bus.subscribe(supervisor.handle_event)


# include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(membership.router, prefix="/membership", tags=["membership"])
app.include_router(contractor.router, prefix="/contractor", tags=["contractor"])
app.include_router(leads.router, prefix="/leads", tags=["leads"])
app.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
app.include_router(claims.router, prefix="/claims", tags=["claims"])
app.include_router(payments.router, prefix="/payments", tags=["payments"])
app.include_router(compliance.router, prefix="/compliance", tags=["compliance"])
