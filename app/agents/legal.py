"""Legal Agent - Contract validation, legal compliance, lien deadlines"""
from typing import Dict, Any
from datetime import datetime, timedelta


class LegalAgent:
    """Handles legal compliance, contracts, and state-specific regulations"""
    
    def __init__(self, deps):
        self.deps = deps
    
    async def validate_or_generate(self, evt: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle UPLOAD_CONTRACT event
        Validate uploaded contract or generate new one
        """
        data = evt.get("data", {})
        
        if data.get("contract_text"):
            return await self.validate_contract(evt)
        else:
            return await self.generate_contract(evt)
    
    async def validate_contract(self, evt: Dict[str, Any]) -> Dict[str, Any]:
        """Validate contract against state-specific rules"""
        data = evt.get("data", {})
        state = data.get("state", "FL")
        contract_text = data.get("contract_text", "")
        aob_included = data.get("aob_included", False)
        
        # State-specific rules
        state_rules = {
            "FL": {
                "aob_allowed": True,
                "required_clauses": ["Right to cancel", "Disclosure of AOB", "Itemized estimate"],
                "max_interest_rate": 18
            },
            "TX": {
                "aob_allowed": False,
                "required_clauses": ["Right to cancel", "Payment terms", "Scope of work"],
                "max_interest_rate": 10
            },
            "CA": {
                "aob_allowed": True,
                "required_clauses": ["Right to cancel", "Notice of completion", "Itemized estimate"],
                "max_interest_rate": 10
            }
        }
        
        rules = state_rules.get(state, state_rules["FL"])
        
        # Check for missing clauses
        missing_clauses = [
            clause for clause in rules["required_clauses"]
            if clause.lower() not in contract_text.lower()
        ]
        
        # Validate AOB
        aob_compliant = True
        if aob_included and not rules["aob_allowed"]:
            aob_compliant = False
        
        return {
            "ok": True,
            "valid": len(missing_clauses) == 0 and aob_compliant,
            "state": state,
            "missing_clauses": missing_clauses,
            "aob_compliant": aob_compliant,
            "recommendations": self._generate_recommendations(missing_clauses, rules, aob_included)
        }
    
    async def generate_contract(self, evt: Dict[str, Any]) -> Dict[str, Any]:
        """Generate state-compliant contract"""
        data = evt.get("data", {})
        state = data.get("state", "FL")
        aob_required = data.get("aob_required", False)
        
        # TODO: Use template service to generate contract
        contract_template = f"""
CONTRACTOR AGREEMENT - STATE OF {state}

This agreement is made between [CONTRACTOR] and [HOMEOWNER]...

{f"ASSIGNMENT OF BENEFITS (AOB) - Homeowner assigns insurance benefits to contractor..." if aob_required else ""}

RIGHT TO CANCEL - You have the right to cancel this contract within 3 days...

ITEMIZED ESTIMATE - See attached cost breakdown...

Signed: _______________
Date: {datetime.now().strftime("%Y-%m-%d")}
"""
        
        return {
            "ok": True,
            "contract_text": contract_template.strip(),
            "state": state,
            "aob_included": aob_required
        }
    
    async def calculate_lien_deadline(self, evt: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate lien filing deadline by state"""
        data = evt.get("data", {})
        state = data.get("state", "FL")
        completion_date = data.get("completion_date", datetime.now())
        
        if isinstance(completion_date, str):
            completion_date = datetime.fromisoformat(completion_date.replace("Z", "+00:00"))
        
        # State-specific deadline days
        deadline_days = {
            "FL": 90,
            "TX": 60,
            "CA": 90,
            "GA": 90,
            "NC": 120
        }
        
        days = deadline_days.get(state, 90)
        deadline = completion_date + timedelta(days=days)
        days_remaining = (deadline - datetime.now()).days
        
        return {
            "ok": True,
            "state": state,
            "completion_date": completion_date.isoformat(),
            "deadline": deadline.isoformat(),
            "days_remaining": days_remaining,
            "urgency": "high" if days_remaining < 30 else "normal",
            "warning": "URGENT: Lien deadline approaching" if days_remaining < 15 else None
        }
    
    def _generate_recommendations(self, missing_clauses, rules, aob_included):
        """Generate legal recommendations"""
        recommendations = []
        
        if missing_clauses:
            recommendations.append(f"Add required clauses: {', '.join(missing_clauses)}")
        
        if aob_included and not rules.get("aob_allowed"):
            recommendations.append("AOB not allowed in this state - remove AOB language")
        
        if not recommendations:
            recommendations.append("Contract meets all legal requirements")
        
        return recommendations
