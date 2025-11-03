
from fastapi import Request, HTTPException

def get_ctx(request: Request):
    role = request.headers.get("X-User-Role", "").lower() or "contractor"
    user_id = request.headers.get("X-User-Id", "") or "demo-contractor"
    scopes = [s.strip() for s in (request.headers.get("X-Scopes","") or "").split(",") if s.strip()]
    return {"role": role, "user_id": user_id, "scopes": scopes}

def require_admin(ctx):
    if ctx.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

def require_job_access(ctx, job: dict):
    if ctx.get("role") == "admin": return
    if job and job.get("contractor_id") == ctx.get("user_id"): return
    raise HTTPException(status_code=403, detail="Not allowed for this job")
