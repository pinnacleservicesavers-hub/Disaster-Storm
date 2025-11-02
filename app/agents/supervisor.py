"""Supervisor Agent - Event-driven orchestration"""
from typing import Dict, Any
from .legal import LegalAgent
from .weather import WeatherAgent
from .dispatch import DispatchAgent
from .claims import ClaimAgent
from .negotiator import NegotiatorAgent
from .finance import FinanceAgent


class Supervisor:
    """Routes business events to specialist agents"""
    
    def __init__(self, deps):
        self.legal = LegalAgent(deps)
        self.weather = WeatherAgent(deps)
        self.dispatch = DispatchAgent(deps)
        self.claim = ClaimAgent(deps)
        self.neg = NegotiatorAgent(deps)
        self.finance = FinanceAgent(deps)
    
    async def handle_event(self, evt: Dict[str, Any]):
        """Route event to appropriate agent"""
        kind = evt.get("type")
        
        if kind == "WEATHER_IMPACT":
            return await self.dispatch.broadcast_leads(evt)
        
        if kind == "UPLOAD_CONTRACT":
            return await self.legal.validate_or_generate(evt)
        
        if kind == "MEDIA_UPLOADED":
            return await self.claim.analyze_and_update(evt)
        
        if kind == "INVOICE_DISPUTED":
            return await self.neg.prepare_rebuttal(evt)
        
        if kind == "PAYMENT_DUE":
            return await self.finance.remind_and_collect(evt)
        
        return {"ok": True}
