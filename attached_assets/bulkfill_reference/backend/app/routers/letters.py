
from fastapi import APIRouter, Request, Response
from pydantic import BaseModel
from datetime import datetime, timedelta
import re, os, smtplib, ssl
from email.message import EmailMessage
from ..utils.store import store
from ..utils.security import get_ctx, require_job_access
from ..utils.pdfsimple import make_pdf_html

router = APIRouter()

class LetterSchedule(BaseModel):
    job_id: str
    kind: str  # 'late' or 'demand'
    to_emails: list[str]
    days_from_now: int = 0

TEMPLATES = {
    "late": {
        "subject": "Late notice — Job {job_id}",
        "body": "This is a friendly late notice for Job {job_id}. Payment is due upon completion per the contract."
    },
    "demand": {
        "subject": "60-day demand — Job {job_id}",
        "body": "This is a demand letter for Job {job_id}. Per the contract and law, payment in full is requested."
    }
}

@router.post("/letters/schedule")
def schedule_letter(body: LetterSchedule, request: Request):
    job = store.jobs.setdefault(body.job_id, {})
    ctx = get_ctx(request); require_job_access(ctx, job)
    due_at = (datetime.utcnow() + timedelta(days=int(body.days_from_now))).isoformat()
    item = {
        "id": str(uuid4()),
        "kind": body.kind,
        "to_emails": body.to_emails,
        "subject": TEMPLATES[body.kind]["subject"].format(job_id=body.job_id),
        "body": TEMPLATES[body.kind]["body"].format(job_id=body.job_id),
        "due_at": due_at,
        "status": "scheduled"
    }
    job.setdefault("letters", []).append(item)
    job.setdefault("timeline", []).append({"job_id": body.job_id, "kind":"note", "message": f"Letter scheduled ({body.kind}) for {due_at}", "when": datetime.utcnow().isoformat()})
    store.jobs[body.job_id] = job
    return {"ok": True, "letter": item}

@router.get("/letters/{job_id}")
def list_letters(job_id: str, request: Request):
    job = store.jobs.get(job_id, {})
    ctx = get_ctx(request); require_job_access(ctx, job)
    return {"letters": job.get("letters", [])}

@router.patch("/letters/{job_id}/{letter_id}")
def update_letter(job_id: str, letter_id: str, payload: dict, request: Request):
    job = store.jobs.get(job_id, {})
    ctx = get_ctx(request); require_job_access(ctx, job)
    for L in job.get("letters", []):
        if L.get("id") == letter_id:
            if "subject" in payload: L["subject"] = payload["subject"]
            if "body" in payload: L["body"] = payload["body"]
            store.jobs[job_id] = job
            return {"ok": True, "letter": L}
    return {"error": "not found"}

@router.post("/letters/send_now")
def send_now(job_id: str, letter_id: str, request: Request):
    job = store.jobs.get(job_id, {})
    ctx = get_ctx(request); require_job_access(ctx, job)
    now = datetime.utcnow().isoformat()
    for L in job.get("letters", []):
        if L.get("id") == letter_id:
            L["due_at"] = now
            store.jobs[job_id] = job
            return {"ok": True, "letter": L}
    return {"error": "not found"}

def _send_email(smtp_host,smtp_port,smtp_user,smtp_pass,to_list,subject,text):
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = smtp_user or "no-reply@stormdisaster.local"
    msg["To"] = ", ".join(to_list)
    msg.set_content(text)
    try:
        ctx = ssl.create_default_context()
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls(context=ctx)
            if smtp_user: server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        return True, None
    except Exception as e:
        return False, str(e)

@router.post("/letters/run")
def run_letters(request: Request):
    now = datetime.utcnow().isoformat()
    processed = []
    for job_id, job in store.jobs.items():
        for L in job.get("letters", []):
            if L.get("status") == "scheduled" and L.get("due_at") <= now:
                # strip HTML to text for email body
                text = re.sub(r"<br\s*/?>", "\n", L.get("body") or "", flags=re.I)
                text = re.sub(r"</p>", "\n\n", text, flags=re.I)
                text = re.sub(r"<[^>]+>", "", text)
                ok, err = _send_email(os.getenv("SMTP_HOST","smtp.example.com"), int(os.getenv("SMTP_PORT","587")), os.getenv("SMTP_USER","user@example.com"), os.getenv("SMTP_PASS","pass"), L.get("to_emails") or [], L.get("subject") or "", text)
                L["status"] = "sent" if ok else f"error:{err}"
                job.setdefault("timeline", []).append({"job_id": job_id, "kind":"note", "message": f"Letter {L['id']} ({L['kind']}) {L['status']}", "when": datetime.utcnow().isoformat()})
                processed.append({"job_id": job_id, "letter_id": L["id"], "status": L["status"]})
        store.jobs[job_id] = job
    return {"processed": processed}

@router.get("/letters/{job_id}/{letter_id}.pdf")
def get_letter_pdf(job_id: str, letter_id: str, request: Request):
    job = store.jobs.get(job_id, {})
    ctx = get_ctx(request); require_job_access(ctx, job)
    for L in job.get("letters", []):
        if L.get("id") == letter_id:
            subj = L.get("subject") or f"Letter {letter_id}"
            body = L.get("body") or ""
            body = re.sub(r"<br\s*/?>", "\n", body, flags=re.I)
            body = re.sub(r"</p>", "\n\n", body, flags=re.I)
            body = re.sub(r"<[^>]+>", "", body)
            pdf = make_pdf_html(subj, L.get('body') or '', footer_text='Storm Disaster • Generated report')
            return Response(content=pdf, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=letter-{job_id}-{letter_id}.pdf"})
    return Response(content=b"Not found", media_type="text/plain", status_code=404)
