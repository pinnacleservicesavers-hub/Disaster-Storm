
from fastapi import APIRouter, Request
from ..utils.store import store
from ..utils.security import get_ctx, require_job_access

router = APIRouter()

ZIP_STATE = { "32":"FL","33":"FL","34":"FL","70":"NJ","07":"NJ","10":"DE","20":"MD","21":"MD","60":"IL","61":"IL","73":"NJ","08":"NJ","90":"CA","91":"CA","92":"CA","93":"CA","94":"CA","95":"CA","85":"AZ","86":"AZ","75":"TX","76":"TX","77":"TX","78":"TX","79":"TX","80":"CO","81":"CO","55":"WI","53":"WA" }

def _infer_state_from_zip(zipcode: str) -> str | None:
    if not zipcode: return None
    z = "".join([c for c in zipcode if c.isdigit()])
    if len(z) < 2: return None
        # Check uploaded admin map first
    from ..utils.store import store
    m=(store.settings.get('legal') or {}).get('zip_prefix_map') or {}
    for k,v in m.items():
        if z.startswith(k): return v
    # fallback to built-in partial map
    for k,v in ZIP_STATE.items():
        if z.startswith(k): return v
    return None

@router.get("/utils/infer_state/{job_id}")
def infer_state(job_id: str, request: Request):
    job = store.jobs.get(job_id, {})
    ctx = get_ctx(request); require_job_access(ctx, job)
    zipcode = (job.get("zip") or (job.get("address") or {}).get("zip") or (job.get("location") or {}).get("zip") or "").strip()
    guess = _infer_state_from_zip(zipcode)
    return {"job_id": job_id, "zip": zipcode, "guessed_state": guess, "source": "zip-prefix", "confidence": 0.6 if guess else 0.0}
