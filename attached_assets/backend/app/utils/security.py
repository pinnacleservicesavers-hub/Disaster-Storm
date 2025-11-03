
from fastapi import Request, HTTPException
import base64, json, time
from typing import Any, Dict, Optional
import jwt  # PyJWT
from jwt import algorithms
from ..utils.store import store

def _b64url_decode(seg: str) -> str:
    try:
        seg += '=' * (-len(seg) % 4)
        return base64.urlsafe_b64decode(seg.encode('utf-8')).decode('utf-8')
    except Exception:
        return ''

def _parse_unverified(token: str) -> Dict[str, Any]:
    parts = token.split('.')
    if len(parts) < 2: return {}
    try:
        payload = json.loads(_b64url_decode(parts[1]) or '{}')
        header = json.loads(_b64url_decode(parts[0]) or '{}')
        return {"header": header, "payload": payload}
    except Exception:
        return {"header": {}, "payload": {}}

def _select_key(jwks: dict, kid: Optional[str]) -> Optional[dict]:
    if not jwks: return None
    keys = jwks.get("keys", [])
    if kid:
        for k in keys:
            if k.get("kid") == kid:
                return k
    return keys[0] if keys else None

def _verify_with_jwks(token: str) -> Dict[str, Any]:
    cfg = store.settings.get("oidc") or {}
    issuer = cfg.get("issuer"); audience = cfg.get("audience")
    jwks = cfg.get("jwks") or {}
    if not issuer or not audience or not jwks:
        raise HTTPException(status_code=401, detail="OIDC/JWKS not configured")

    parts = _parse_unverified(token)
    kid = (parts.get("header") or {}).get("kid")
    keyobj = _select_key(jwks, kid)
    if not keyobj:
        raise HTTPException(status_code=401, detail="Signing key not found")

    alg = (parts.get("header") or {}).get("alg") or "RS256"
    if alg not in ("RS256","RS384","RS512","ES256","ES384","ES512","PS256","PS384","PS512"):
        raise HTTPException(status_code=401, detail=f"Unsupported alg {alg}")

    pubkey = algorithms.RSAAlgorithm.from_jwk(json.dumps(keyobj)) if alg.startswith("RS") or alg.startswith("PS") else algorithms.ECAlgorithm.from_jwk(json.dumps(keyobj))
    try:
        claims = jwt.decode(token, key=pubkey, algorithms=[alg], audience=audience, issuer=issuer)
        return claims
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

def get_ctx(request: Request):
    # Pull Authorization header
    authz = request.headers.get('Authorization') or request.headers.get('authorization') or ''
    token = ''
    if authz.lower().startswith('bearer '):
        token = authz.split(' ',1)[1].strip()

    cfg = store.settings.get("oidc") or {}
    enforce = bool(cfg.get("enforce", False))

    role_final = "contractor"
    user_final = "demo-contractor"
    scopes = [s.strip() for s in (request.headers.get("X-Scopes","") or "").split(",") if s.strip()]

    if token:
        try:
            claims = _verify_with_jwks(token) if enforce else (_parse_unverified(token).get("payload") or {})
            role_final = (claims.get('role') or claims.get('app_role') or role_final).lower()
            user_final = (claims.get('sub') or claims.get('user_id') or user_final)
        except HTTPException:
            if enforce:
                raise
        except Exception:
            if enforce:
                raise HTTPException(status_code=401, detail="Token processing failed")

    # Fallback to demo headers if not enforcing or no token
    if not token or not enforce:
        role_hdr = (request.headers.get("X-User-Role", "") or "").lower()
        user_hdr = request.headers.get("X-User-Id", "") or ""
        role_final = role_hdr or role_final
        user_final = user_hdr or user_final

    return {"role": role_final, "user_id": user_final, "scopes": scopes}

def require_admin(ctx):
    if ctx.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

def require_job_access(ctx, job: dict):
    if ctx.get("role") == "admin": return
    if job and job.get("contractor_id") == ctx.get("user_id"): return
    raise HTTPException(status_code=403, detail="Not allowed for this job")
