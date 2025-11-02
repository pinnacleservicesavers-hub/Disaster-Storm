"""
Supervisor Agent - Event-Driven Orchestration
Routes business events to specialist agents
"""
from typing import Dict, Any
from app.agents.legal import LegalAgent
from app.agents.weather import WeatherAgent
from app.agents.vision import VisionAgent
from app.agents.dispatch import DispatchAgent
from app.agents.claims import ClaimAgent
from app.agents.negotiator import NegotiatorAgent
from app.agents.finance import FinanceAgent


class Supervisor:
    """
    Supervisor orchestrates all specialist agents
    Routes events to appropriate agent based on event type
    """
    
    def __init__(self, deps):
        """Initialize all specialist agents with shared dependencies"""
        self.deps = deps
        
        # Initialize specialist agents
        self.legal = LegalAgent(deps)
        self.weather = WeatherAgent(deps)
        self.vision = VisionAgent(deps)
        self.dispatch = DispatchAgent(deps)
        self.claim = ClaimAgent(deps)
        self.negotiator = NegotiatorAgent(deps)
        self.finance = FinanceAgent(deps)
        
        print("🤖 Supervisor initialized with 7 specialist agents")
    
    async def handle_event(self, evt: Dict[str, Any]) -> Dict[str, Any]:
        """
        Route events to appropriate specialist agent
        
        Supported event types:
        - WEATHER_IMPACT: Weather triggers contractor deployment
        - UPLOAD_CONTRACT: Contract validation/generation
        - MEDIA_UPLOADED: Image/video damage analysis
        - INVOICE_DISPUTED: Insurance negotiation rebuttal
        - PAYMENT_DUE: Payment collection reminder
        - weather_analysis: Weather data analysis (task-based)
        - dispatch_contractor: Contractor notification (task-based)
        - create_claim: Insurance claim creation (task-based)
        - negotiate_claim: Claim negotiation (task-based)
        - validate_contract: Legal compliance check (task-based)
        - analyze_image: Damage detection (task-based)
        - process_payment: Payment processing (task-based)
        """
        event_type = evt.get("type")
        
        # Event-driven workflows (business events)
        if event_type == "WEATHER_IMPACT":
            return await self.dispatch.broadcast_leads(evt)
        
        if event_type == "UPLOAD_CONTRACT":
            return await self.legal.validate_or_generate(evt)
        
        if event_type == "MEDIA_UPLOADED":
            return await self.claim.analyze_and_update(evt)
        
        if event_type == "INVOICE_DISPUTED":
            return await self.negotiator.prepare_rebuttal(evt)
        
        if event_type == "PAYMENT_DUE":
            return await self.finance.remind_and_collect(evt)
        
        # Task-based workflows (direct agent invocation)
        if event_type == "weather_analysis":
            return await self.weather.analyze(evt)
        
        if event_type == "dispatch_contractor":
            return await self.dispatch.send_notification(evt)
        
        if event_type == "create_claim":
            return await self.claim.create_claim(evt)
        
        if event_type == "negotiate_claim":
            return await self.negotiator.analyze_offer(evt)
        
        if event_type == "validate_contract":
            return await self.legal.validate_contract(evt)
        
        if event_type == "analyze_image":
            return await self.vision.detect_damage(evt)
        
        if event_type == "process_payment":
            return await self.finance.process_payment(evt)
        
        # Unknown event type
        return {
            "ok": False,
            "error": f"Unknown event type: {event_type}",
            "supported_events": [
                "WEATHER_IMPACT",
                "UPLOAD_CONTRACT",
                "MEDIA_UPLOADED",
                "INVOICE_DISPUTED",
                "PAYMENT_DUE",
                "weather_analysis",
                "dispatch_contractor",
                "create_claim",
                "negotiate_claim",
                "validate_contract",
                "analyze_image",
                "process_payment"
            ]
        }
