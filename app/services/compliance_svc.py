import os
from datetime import datetime, time


class ComplianceService:
    """TCPA/CTIA compliance, consent management, and safety guardrails"""
    
    def __init__(self):
        self.quiet_hours_start = time(21, 0)  # 9 PM
        self.quiet_hours_end = time(8, 0)     # 8 AM
        self.aob_prohibited_states = ["TX", "LA", "SC", "OK", "KY"]
        self.consent_db = {}  # Replace with real DB
    
    async def check_consent(self, user_id: str, channel: str = "sms") -> bool:
        """TCPA/CTIA: Verify opt-in consent before SMS/voice"""
        consent = self.consent_db.get(user_id, {})
        return consent.get(channel, False)
    
    async def log_consent(self, user_id: str, channel: str, opted_in: bool):
        """Log consent for audit trail"""
        self.consent_db[user_id] = {
            channel: opted_in,
            "timestamp": datetime.utcnow().isoformat(),
            "ip": "127.0.0.1"  # Capture from request
        }
        print(f"📋 Consent logged: {user_id} {channel}={opted_in}")
    
    async def handle_opt_out(self, user_id: str, channel: str = "sms"):
        """One-click opt-out (STOP keyword)"""
        await self.log_consent(user_id, channel, False)
        return {"opted_out": True, "message": "You've been unsubscribed. Reply START to opt back in."}
    
    def is_quiet_hours(self, timezone: str = "America/New_York") -> bool:
        """Respect quiet hours by location (8 PM - 8 AM)"""
        from datetime import datetime
        import pytz
        
        try:
            tz = pytz.timezone(timezone)
            local_time = datetime.now(tz).time()
            
            if self.quiet_hours_start > self.quiet_hours_end:
                return local_time >= self.quiet_hours_start or local_time < self.quiet_hours_end
            else:
                return self.quiet_hours_start <= local_time < self.quiet_hours_end
        except:
            return False
    
    def check_aob_allowed(self, state: str) -> dict:
        """AOB awareness: Block if state prohibits Assignment of Benefits"""
        allowed = state.upper() not in self.aob_prohibited_states
        return {
            "allowed": allowed,
            "state": state,
            "message": f"AOB {'permitted' if allowed else 'PROHIBITED'} in {state}",
            "action": "include_aob" if allowed else "block_aob_and_alert"
        }
    
    async def validate_statute_citation(self, citation: str) -> dict:
        """No statute invention: Validate citations against known sources"""
        known_sources = {
            "FL Stat § 713": "https://www.flsenate.gov/Laws/Statutes/2024/Chapter713",
            "TX Prop Code § 53": "https://statutes.capitol.texas.gov/Docs/PR/htm/PR.53.htm",
            "OSHA 1926": "https://www.osha.gov/laws-regs/regulations/standardnumber/1926"
        }
        
        for known, url in known_sources.items():
            if known in citation:
                return {"valid": True, "source_url": url, "citation": citation}
        
        return {
            "valid": False,
            "warning": "⚠️ Unverified statute - cannot cite without source doc",
            "citation": citation
        }
    
    async def escalate_high_risk(self, action: str, context: dict) -> dict:
        """Human-in-the-loop: Escalate high-risk actions for confirmation"""
        high_risk_actions = ["lien_filing", "lawsuit", "foreclosure", "contract_termination"]
        
        if action in high_risk_actions:
            return {
                "escalated": True,
                "action": action,
                "requires_human": True,
                "message": f"⚠️ High-risk action '{action}' requires human approval",
                "context": context
            }
        
        return {"escalated": False, "action": action, "auto_approved": True}
    
    def minimal_data_policy(self, data: dict) -> dict:
        """Privacy: Store only essential data, redact sensitive info"""
        allowed_fields = ["name", "address", "phone", "email", "property_id"]
        redacted_fields = ["ssn", "dob", "credit_card", "bank_account"]
        
        filtered = {}
        for key, val in data.items():
            if key in allowed_fields:
                filtered[key] = val
            elif key in redacted_fields:
                filtered[key] = "***REDACTED***"
        
        return filtered
