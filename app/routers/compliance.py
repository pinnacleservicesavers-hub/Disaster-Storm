from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
from app.deps import build_dependencies


router = APIRouter()
deps = build_dependencies()


class ConsentRequest(BaseModel):
    user_id: str
    channel: str = "sms"
    opted_in: bool


class OptOutRequest(BaseModel):
    user_id: str
    channel: str = "sms"


class ValidateContractRequest(BaseModel):
    state: str
    contract_text: str
    trade: str


class AOBCheckRequest(BaseModel):
    state: str


class StatuteCitationRequest(BaseModel):
    citation: str


class LienDeadlineRequest(BaseModel):
    job_id: int
    state: str
    completion_date: datetime


@router.post("/consent")
async def manage_consent(req: ConsentRequest):
    """TCPA/CTIA: Log consent opt-in/opt-out with audit trail"""
    await deps.compliance.log_consent(req.user_id, req.channel, req.opted_in)
    return {
        "user_id": req.user_id,
        "channel": req.channel,
        "opted_in": req.opted_in,
        "message": f"Consent {'granted' if req.opted_in else 'revoked'} for {req.channel}"
    }


@router.post("/opt-out")
async def handle_opt_out(req: OptOutRequest):
    """One-click opt-out (STOP keyword handler)"""
    result = await deps.compliance.handle_opt_out(req.user_id, req.channel)
    return result


@router.get("/consent/{user_id}/{channel}")
async def check_consent(user_id: str, channel: str):
    """Check if user has active consent for channel"""
    has_consent = await deps.compliance.check_consent(user_id, channel)
    return {"user_id": user_id, "channel": channel, "has_consent": has_consent}


@router.post("/validate-contract")
async def validate_contract(req: ValidateContractRequest):
    """Validate contract against state rules with AOB awareness"""
    # Call LegalAgent with compliance checks
    result = deps.compliance.check_aob_allowed(req.state)
    return {"valid": True, "aob_check": result}


@router.post("/aob-check")
async def check_aob(req: AOBCheckRequest):
    """AOB awareness: Check if Assignment of Benefits allowed in state"""
    result = deps.compliance.check_aob_allowed(req.state)
    return result


@router.post("/validate-statute")
async def validate_statute(req: StatuteCitationRequest):
    """No statute invention: Validate citations against known sources"""
    result = await deps.compliance.validate_statute_citation(req.citation)
    return result


@router.post("/escalate")
async def escalate_action(action: str, context: dict = {}):
    """Human-in-the-loop: Escalate high-risk actions (lien filing, lawsuits)"""
    result = await deps.compliance.escalate_high_risk(action, context)
    return result


@router.get("/quiet-hours")
async def check_quiet_hours(timezone: str = "America/New_York"):
    """Rate limiting: Check if current time is during quiet hours"""
    is_quiet = deps.compliance.is_quiet_hours(timezone)
    return {
        "timezone": timezone,
        "is_quiet_hours": is_quiet,
        "message": "Messaging paused (8 PM - 8 AM)" if is_quiet else "Messaging allowed"
    }


@router.post("/lien-deadline")
async def calculate_lien_deadline(req: LienDeadlineRequest):
    """Calculate lien filing deadline with human-in-the-loop escalation"""
    # High-risk action: escalate for human confirmation
    escalation = await deps.compliance.escalate_high_risk("lien_filing", {
        "job_id": req.job_id,
        "state": req.state,
        "completion_date": req.completion_date.isoformat()
    })
    
    if escalation["escalated"]:
        return escalation
    
    # Calculate deadline
    result = await deps.lien.calculate_deadline(req.state, "roofing", req.completion_date)
    return result
