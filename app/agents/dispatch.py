"""Dispatch Agent - Contractor deployment and notifications"""
from typing import Dict, Any, List


class DispatchAgent:
    """Handles contractor deployment and notifications via SMS"""
    
    def __init__(self, deps):
        self.deps = deps
        self.twilio = self._init_twilio()
    
    def _init_twilio(self):
        """Initialize Twilio client or mock"""
        if self.deps.twilio_account_sid and self.deps.twilio_auth_token:
            from twilio.rest import Client
            client = Client(
                self.deps.twilio_account_sid,
                self.deps.twilio_auth_token
            )
            
            async def send_sms(to: str, message: str) -> Dict[str, Any]:
                """Send real SMS via Twilio"""
                try:
                    msg = client.messages.create(
                        to=to,
                        from_=self.deps.twilio_phone,
                        body=message
                    )
                    return {
                        "success": True,
                        "message_id": msg.sid,
                        "status": msg.status,
                        "to": to
                    }
                except Exception as e:
                    return {
                        "success": False,
                        "error": str(e),
                        "to": to
                    }
            
            print("✅ Twilio SMS enabled")
            return send_sms
        else:
            # Mock SMS for development
            async def mock_sms(to: str, message: str) -> Dict[str, Any]:
                """Mock SMS for development/testing"""
                print(f"📱 [MOCK SMS] To: {to}")
                print(f"   Message: {message}")
                return {
                    "success": True,
                    "message_id": f"mock-{hash(to + message)}",
                    "status": "sent",
                    "to": to,
                    "mock": True
                }
            
            print("⚠️ Twilio not configured - using mock SMS")
            return mock_sms
    
    async def broadcast_leads(self, evt: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle WEATHER_IMPACT event
        Broadcast contractor leads based on weather conditions
        """
        data = evt.get("data", {})
        state = data.get("state")
        severity = data.get("severity", "moderate")
        storm_name = data.get("storm_name", "Storm")
        
        # Query contractors in affected area
        # TODO: Replace with real database query
        contractors = await self._get_contractors_in_area(state)
        
        # Build SMS message based on severity
        if severity == "extreme":
            message = f"🚨 URGENT: {storm_name} approaching {state}. High-value emergency repair opportunities available. Respond ASAP."
        elif severity == "high":
            message = f"⚠️ ALERT: {storm_name} expected in {state}. Storm damage leads available. Deploy crews now."
        else:
            message = f"📢 {storm_name} forecast for {state}. Contractor opportunities available. Reply for details."
        
        # Send SMS to all contractors
        notifications = []
        for contractor in contractors:
            result = await self.twilio(contractor["phone"], message)
            notifications.append(result)
        
        # Count successes
        successful = sum(1 for n in notifications if n.get("success"))
        
        return {
            "ok": True,
            "leads_generated": len(contractors),
            "notifications_sent": successful,
            "notifications_failed": len(contractors) - successful,
            "state": state,
            "severity": severity,
            "storm_name": storm_name,
            "message": f"Broadcasted {storm_name} leads to {successful}/{len(contractors)} contractors in {state}",
            "details": notifications
        }
    
    async def send_notification(self, evt: Dict[str, Any]) -> Dict[str, Any]:
        """Send notification to specific contractor"""
        data = evt.get("data", {})
        contractor_phone = data.get("contractorPhone") or data.get("contractor_phone")
        message = data.get("message") or data.get("job_description", "New job opportunity available")
        job_id = data.get("job_id")
        address = data.get("address")
        
        # Build detailed message
        if job_id and address:
            full_message = f"New Job #{job_id}: {message}\nLocation: {address}\nReply YES to accept."
        else:
            full_message = message
        
        # Send SMS
        result = await self.twilio(contractor_phone, full_message)
        
        return {
            "ok": result.get("success", False),
            "notified": result.get("success", False),
            "to": contractor_phone,
            "message_id": result.get("message_id"),
            "status": result.get("status", "failed"),
            "error": result.get("error"),
            "mock": result.get("mock", False)
        }
    
    async def _get_contractors_in_area(self, state: str) -> List[Dict[str, Any]]:
        """
        Query contractors in affected area
        TODO: Replace with real database query
        """
        # Mock contractors for now
        mock_contractors = [
            {"id": 1, "name": "ProStorm Contractors", "phone": "+15551234567", "state": state},
            {"id": 2, "name": "Emergency Repairs Inc", "phone": "+15551234568", "state": state},
            {"id": 3, "name": "RapidResponse Roofing", "phone": "+15551234569", "state": state},
            {"id": 4, "name": "AllWeather Restoration", "phone": "+15551234570", "state": state},
            {"id": 5, "name": "Storm Solutions LLC", "phone": "+15551234571", "state": state},
        ]
        
        return mock_contractors
