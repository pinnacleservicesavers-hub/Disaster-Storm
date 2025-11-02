"""Negotiator Agent - Insurance claim negotiation"""
from typing import Dict, Any


class NegotiatorAgent:
    """Handles insurance claim negotiation and rebuttals"""
    
    def __init__(self, deps):
        self.deps = deps
    
    async def prepare_rebuttal(self, evt: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle INVOICE_DISPUTED event
        Prepare formal rebuttal to insurer's counter-offer
        """
        data = evt.get("data", {})
        requested_amount = data.get("requested_amount")
        offered_amount = data.get("offered_amount")
        
        return await self.analyze_offer({
            "data": {
                "requestedAmount": requested_amount,
                "offeredAmount": offered_amount
            }
        })
    
    async def analyze_offer(self, evt: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze insurer offer and generate counter-offer"""
        data = evt.get("data", {})
        requested = data.get("requestedAmount") or data.get("requested_amount")
        offered = data.get("offeredAmount") or data.get("offered_amount")
        
        # Calculate gap analysis
        percentage = (offered / requested) * 100
        gap = requested - offered
        
        # Determine acceptability
        if percentage >= 90:
            acceptability = "acceptable"
            strategy = "accept_with_minor_negotiation"
        elif percentage >= 75:
            acceptability = "negotiable"
            strategy = "counter_with_evidence"
        else:
            acceptability = "unacceptable"
            strategy = "escalate_with_formal_rebuttal"
        
        # Calculate counter-offer (aim for 93% of requested)
        counter_offer = round(requested * 0.93, 2)
        
        return {
            "ok": True,
            "analysis": {
                "percentage": round(percentage, 1),
                "gap": gap,
                "acceptability": acceptability
            },
            "counter_offer": counter_offer,
            "justification": f"Based on market comparables and documented damage, the requested amount of ${requested:,.2f} is justified. The insurer's offer of ${offered:,.2f} ({percentage:.1f}%) does not adequately cover restoration costs. We counter with ${counter_offer:,.2f}.",
            "strategy": strategy,
            "next_steps": [
                "Submit formal counter-offer",
                "Provide supporting documentation",
                "Schedule adjuster review if needed"
            ]
        }
