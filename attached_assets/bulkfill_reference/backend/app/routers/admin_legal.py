from fastapi import APIRouter
router=APIRouter()


from fastapi import Request
from pydantic import BaseModel
from ..utils.store import store
from ..utils.security import get_ctx, require_admin

class ZipMap(BaseModel):
    # prefix_to_state: {"005": "NY", "006": "PR", ...} or {"00": "MA"} etc.
    mapping: dict

@router.get("/admin/legal/zipmap")
def get_zipmap(request: Request):
    ctx = get_ctx(request); require_admin(ctx)
    m = (store.settings.get("legal") or {}).get("zip_prefix_map", {})
    return {"count": len(m), "sample": {k:m[k] for k in list(m)[:10]}}

@router.post("/admin/legal/zipmap")
def set_zipmap(body: ZipMap, request: Request):
    ctx = get_ctx(request); require_admin(ctx)
    store.settings.setdefault("legal", {})["zip_prefix_map"] = {str(k):str(v).upper() for k,v in (body.mapping or {}).items()}
    return {"ok": True, "count": len(store.settings['legal']['zip_prefix_map'])}


from fastapi import Request
from ..utils.store import store
from ..utils.security import get_ctx, require_admin
import json, os

@router.post("/admin/legal/zipmap/load_default")
def load_default_zipmap(request: Request):
    ctx = get_ctx(request); require_admin(ctx)
    path = os.path.join(os.path.dirname(__file__), "..", "data", "zip_prefix_map.default.json")
    path = os.path.normpath(path)
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        store.settings.setdefault("legal", {})["zip_prefix_map"] = {str(k): str(v).upper() for k,v in (data or {}).items()}
        return {"ok": True, "count": len(store.settings['legal']['zip_prefix_map'])}
    except Exception as e:
        return {"ok": False, "error": str(e)}
