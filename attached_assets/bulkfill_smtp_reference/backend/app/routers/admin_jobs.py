
from fastapi import APIRouter, Request, Response
from datetime import datetime
from ..utils.store import store
from ..utils.security import get_ctx, require_admin
from .utils_misc import _infer_state_from_zip

router = APIRouter()

def _fill_states_now():
    updated = 0
    scanned = 0
    details = []
    for job_id, job in list(store.jobs.items()):
        scanned += 1
        state = (job.get("state") or "").strip().upper()
        if not state:
            zipcode = (job.get("zip") or (job.get("address") or {}).get("zip") or (job.get("location") or {}).get("zip") or "").strip()
            guess = _infer_state_from_zip(zipcode)
            if guess:
                job["state"] = guess
                job.setdefault("timeline", []).append({"job_id": job_id, "kind":"note", "message": f"Auto-filled state to {guess} from ZIP {zipcode}", "when": datetime.utcnow().isoformat()})
                store.jobs[job_id] = job
                updated += 1
                details.append({'job_id': job_id, 'new_state': guess, 'zip': zipcode})
    return {"updated": updated, "scanned": scanned, "details": details}

@router.post("/admin/jobs/fill_states")
def fill_states(request: Request):
    ctx = get_ctx(request); require_admin(ctx)
    return _fill_states_now()

@router.post("/admin/jobs/fill_states.csv")
def fill_states_csv(request: Request):
    ctx = get_ctx(request); require_admin(ctx)
    res = _fill_states_now()
    lines = ["job_id,zip,new_state"]
    for d in (res.get("details") or []):
        lines.append(f"{d.get('job_id')},{d.get('zip') or ''},{d.get('new_state') or ''}")
    data = "\n".join(lines)
    return Response(content=data, media_type="text/csv", headers={"Content-Disposition":"attachment; filename=fill-states-results.csv"})
