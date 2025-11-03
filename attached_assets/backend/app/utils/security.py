
from fastapi import Request, HTTPException
import base64, json

def _b64url_decode(seg: str):
    try:
        seg += '=' * (-len(seg) % 4)
        return base64.urlsafe_b64decode(seg.encode('utf-8')).decode('utf-8')
    except Exception:
        return ''

def _claims_from_authz(authz: str) -> dict:
    if not authz or not authz.lower().startswith('bearer '):
        return {}
    token = authz.split(' ',1)[1].strip()
    parts = token.split('.')
    if len(parts) < 2: return {}
    try:
        payload = json.loads(_b64url_decode(parts[1]) or '{}')
        return payload if isinstance(payload, dict) else {}
    except Exception:
        return {}

def get_ctx(request: Request):
    # Prefer JWT claims if Authorization is present
    authz = request.headers.get('Authorization') or request.headers.get('authorization') or ''
    claims = _claims_from_authz(authz)
    role = (claims.get('role') or claims.get('app_role') or '').lower()
    sub = (claims.get('sub') or claims.get('user_id') or '')

    # Fallback to demo headers
    role_hdr = (request.headers.get("X-User-Role", "") or "").lower()
    user_hdr = request.headers.get("X-User-Id", "") or ""

    role_final = role or role_hdr or "contractor"
    user_final = sub or user_hdr or "demo-contractor"

    scopes = [s.strip() for s in (request.headers.get("X-Scopes","") or "").split(",") if s.strip()]
    return {"role": role_final, "user_id": user_final, "scopes": scopes}

def require_admin(ctx):
    if ctx.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

def require_job_access(ctx, job: dict):
    if ctx.get("role") == "admin": return
    if job and job.get("contractor_id") == ctx.get("user_id"): return
    raise HTTPException(status_code=403, detail="Not allowed for this job")
