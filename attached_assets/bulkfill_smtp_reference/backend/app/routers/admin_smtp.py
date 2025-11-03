
from fastapi import APIRouter, Request
from pydantic import BaseModel
from ..utils.store import store
from ..utils.security import get_ctx, require_admin
import smtplib, ssl

router = APIRouter()

class SMTPSettings(BaseModel):
    host: str
    port: int = 587
    user: str | None = None
    password: str | None = None
    use_tls: bool = True

@router.get("/admin/smtp")
def get_smtp(request: Request):
    ctx = get_ctx(request); require_admin(ctx)
    s = (store.settings.get("smtp") or {}).copy()
    if "password" in s: s["password"] = "***"
    return {"smtp": {"host": s.get("host"), "port": s.get("port",587), "user": s.get("user"), "use_tls": bool(s.get("use_tls", True))}}

@router.post("/admin/smtp")
def set_smtp(body: SMTPSettings, request: Request):
    ctx = get_ctx(request); require_admin(ctx)
    store.settings["smtp"] = {"host": body.host, "port": int(body.port), "user": body.user or "", "password": body.password or "", "use_tls": bool(body.use_tls)}
    return {"ok": True}

@router.post("/admin/smtp/test")
def test_smtp(to: str, request: Request):
    ctx = get_ctx(request); require_admin(ctx)
    s = store.settings.get("smtp") or {}
    host=s.get("host"); port=int(s.get("port",587)); user=s.get("user"); password=s.get("password"); use_tls=bool(s.get("use_tls",True))
    if not host: return {"ok": False, "error":"No SMTP host configured"}
    try:
        msg = f"Subject: SMTP Test\nFrom: {user or 'no-reply@stormdisaster.local'}\nTo: {to}\n\nThis is a test email from Storm Disaster."
        if use_tls:
            context = ssl.create_default_context()
            with smtplib.SMTP(host, port, timeout=15) as server:
                server.starttls(context=context)
                if user: server.login(user, password or "")
                server.sendmail(user or "no-reply@stormdisaster.local", [to], msg)
        else:
            with smtplib.SMTP(host, port, timeout=15) as server:
                if user: server.login(user, password or "")
                server.sendmail(user or "no-reply@stormdisaster.local", [to], msg)
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}
