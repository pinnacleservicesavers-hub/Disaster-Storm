
from fastapi import APIRouter, Request
from pydantic import BaseModel, AnyHttpUrl
from ..utils.store import store
from ..utils.security import get_ctx, require_admin
import requests

router = APIRouter()

class OIDCConfig(BaseModel):
    issuer: AnyHttpUrl
    audience: str
    enforce: bool = True  # if True, reject unverified/absent tokens

@router.get("/admin/oidc")
def get_oidc(request: Request):
    ctx = get_ctx(request); require_admin(ctx)
    cfg = store.settings.get("oidc") or {}
    redacted = { **cfg }
    if "jwks" in redacted:
        redacted["jwks_keys"] = len((redacted.get("jwks") or {}).get("keys", []))
        redacted.pop("jwks", None)
    return { "oidc": redacted }

@router.post("/admin/oidc")
def set_oidc(body: OIDCConfig, request: Request):
    ctx = get_ctx(request); require_admin(ctx)
    store.settings["oidc"] = { "issuer": str(body.issuer).rstrip("/"), "audience": body.audience, "enforce": bool(body.enforce) }
    return { "ok": True, "oidc": store.settings["oidc"] }

@router.post("/admin/oidc/refresh_jwks")
def refresh_jwks(request: Request):
    ctx = get_ctx(request); require_admin(ctx)
    cfg = store.settings.get("oidc") or {}
    issuer = cfg.get("issuer")
    if not issuer:
        return { "ok": False, "error": "OIDC issuer not set" }
    url = issuer.rstrip("/") + "/.well-known/jwks.json"
    try:
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        jwks = r.json()
        store.settings.setdefault("oidc", {})["jwks"] = jwks
        return { "ok": True, "keys": len((jwks or {}).get("keys", [])) }
    except Exception as e:
        return { "ok": False, "error": str(e) }

class JWKSBody(BaseModel):
    jwks: dict

@router.post("/admin/oidc/jwks")
def set_jwks(body: JWKSBody, request: Request):
    ctx = get_ctx(request); require_admin(ctx)
    store.settings.setdefault("oidc", {})["jwks"] = body.jwks or {}
    return { "ok": True, "keys": len((body.jwks or {}).get("keys", [])) }
