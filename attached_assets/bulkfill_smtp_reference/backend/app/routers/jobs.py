
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from ..utils.store import store
from ..utils.security import get_ctx, require_job_access

router = APIRouter()

class NewJob(BaseModel):
    job_id: str
    contractor_id: str
    zip: str | None = None
    state: str | None = None
    address: dict | None = None
    location: dict | None = None
    contract: dict | None = None

@router.post("/jobs")
def create_job(payload: NewJob, request: Request):
    ctx = get_ctx(request)
    if ctx.get("role") != "admin" and payload.contractor_id != ctx.get("user_id"):
        raise HTTPException(status_code=403, detail="Contractors can only create their own jobs")
    job = {"contractor_id": payload.contractor_id, "zip": payload.zip, "state": (payload.state or "").upper() if payload.state else None, "address": payload.address or {}, "location": payload.location or {}, "contract": payload.contract or {}, "reminders": [], "letters": [], "timeline": []}
    store.jobs[payload.job_id] = job
    return {"ok": True, "job_id": payload.job_id, "job": job}

@router.post("/jobs/{job_id}/state")
def set_job_state(job_id: str, state: str, request: Request):
    job = store.jobs.setdefault(job_id, {})
    ctx = get_ctx(request); require_job_access(ctx, job)
    first_time = not bool((store.jobs.get(job_id) or {}).get("state"))
    prev = (store.jobs.get(job_id) or {}).get("state")
    job["state"] = (state or "").upper()
    store.jobs[job_id] = job
    result = {"ok": True, "job_id": job_id, "state": job["state"], "first_time": first_time, "previous": prev}
    if first_time and job.get("state"):
        legal = store.settings.get("legal") or {}
        boiler = ((legal.get("boilerplate_by_state") or {}).get(job['state']) or {})
        welcome = ((legal.get("welcome_by_state") or {}).get(job['state']) or "")
        body = welcome or "<p>Welcome. This letter outlines homeowner rights and next steps for claims in your state.</p>"
        if not welcome and boiler.get("demand_text"):
            body += f"<p><b>State notes:</b> {boiler.get('demand_text')}</p>"
        letter = {"id": store.new_id(), "kind": "welcome_state", "to_emails": [], "subject": f"Important information for your state ({job['state']}) — Job {job_id}", "body": body, "due_at": __import__('datetime').datetime.utcnow().isoformat(), "status": "scheduled"}
        job.setdefault("letters", []).append(letter)
        store.jobs[job_id] = job
        # trigger run_letters if available
        try:
            from .letters import run_letters
            class DummyReq: ...
            run_letters(DummyReq())
        except Exception:
            pass
        result["auto_letter_id"] = letter["id"]
    return result
