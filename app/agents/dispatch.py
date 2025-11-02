"""Dispatch Agent - Contractor deployment and notifications"""
from typing import Dict, Any


class DispatchAgent:
    """Handles contractor deployment and notifications"""
    
    def __init__(self, deps):
        self.deps = deps
    
    async def broadcast_leads(self, evt: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle WEATHER_IMPACT event
        Broadcast contractor leads based on weather conditions
        """
        data = evt.get("data", {})
        state = data.get("state")
        severity = data.get("severity", "moderate")
        
        # TODO: Query contractors in affected area
        # TODO: Send SMS via Twilio
        
        return {
            "ok": True,
            "leads_generated": 5,
            "notifications_sent": 5,
            "state": state,
            "severity": severity,
            "message": f"Broadcasted storm leads to {5} contractors in {state}"
        }
    
    async def send_notification(self, evt: Dict[str, Any]) -> Dict[str, Any]:
        """Send notification to specific contractor"""
        data = evt.get("data", {})
        contractor_phone = data.get("contractorPhone") or data.get("contractor_phone")
        message = data.get("message", "New job opportunity available")
        
        # TODO: Send via Twilio
        
        return {
            "ok": True,
            "notified": True,
            "to": contractor_phone,
            "message_id": f"mock-{id(self)}",
            "status": "sent"
        }
