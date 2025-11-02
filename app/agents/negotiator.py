"""Negotiator Agent - Insurance claim negotiation"""
from typing import Dict, Any


class NegotiatorAgent:
    """Handles insurance claim negotiation and rebuttals"""
    
    def __init__(self, deps):
        self.llm = deps.llm
        self.store = deps.storage
    
    async def prepare_rebuttal(self, evt: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle INVOICE_DISPUTED event
        evt: {type:'INVOICE_DISPUTED', claim_id, requested, offered, gap_reasons:[...]}
        """
        requested = evt.get("requested") or evt.get("data", {}).get("requested_amount")
        offered = evt.get("offered") or evt.get("data", {}).get("offered_amount")
        gap_reasons = evt.get("gap_reasons", [])
        
        # Calculate gap
        percentage = (offered / requested) * 100
        gap = requested - offered
        
        # LLM-generated rebuttal with policy-good-faith language
        rebuttal = await self.llm(
            f"Draft a formal insurance rebuttal. Contractor requested ${requested}, "
            f"insurer offered ${offered} ({percentage:.1f}%). Gap reasons: {gap_reasons}. "
            f"Use policy-good-faith language, cite market data, OSHA compliance, "
            f"and duty to restore to pre-loss condition. Counter at 93% of requested. "
            f"Return professional narrative, 2-3 paragraphs."
        )
        
        # Calculate counter-offer
        counter = round(requested * 0.93, 2)
        
        return {
            "gap": gap,
            "percentage": round(percentage, 1),
            "counter_offer": counter,
            "rebuttal": rebuttal
        }
