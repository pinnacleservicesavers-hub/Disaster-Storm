"""Twilio SMS Service"""
import os
from typing import Dict, Any


class TwilioService:
    """SMS messaging service using Twilio"""
    
    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.phone = os.getenv("TWILIO_PHONE_NUMBER")
        self.client = None
        
        if self.account_sid and self.auth_token:
            from twilio.rest import Client
            self.client = Client(self.account_sid, self.auth_token)
            print("✅ Twilio messaging enabled")
        else:
            print("⚠️ Twilio not configured - using mock messaging")
    
    async def notify(self, contractor, template: str, context: Dict[str, Any]):
        """Send SMS notification to contractor"""
        phone = getattr(contractor, 'phone', None) or contractor.get('phone')
        message = self._build_message(template, context)
        
        if self.client and phone:
            try:
                msg = self.client.messages.create(
                    to=phone,
                    from_=self.phone,
                    body=message
                )
                return {"success": True, "message_id": msg.sid}
            except Exception as e:
                print(f"❌ Twilio error: {e}")
                return {"success": False, "error": str(e)}
        else:
            # Mock mode
            print(f"📱 [MOCK SMS] To: {phone}")
            print(f"   Template: {template}")
            print(f"   Message: {message}")
            return {"success": True, "mock": True}
    
    def _build_message(self, template: str, context: Dict[str, Any]) -> str:
        """Build message from template"""
        templates = {
            "storm_lead": (
                f"🚨 Storm Alert: {context.get('region', 'Unknown')} "
                f"- {len(context.get('parcels', []))} affected properties. "
                f"Reply YES for leads."
            ),
            "job_opportunity": (
                f"New Job: {context.get('description', 'Job available')} "
                f"at {context.get('address', 'location TBD')}. Reply YES to accept."
            ),
            "job_assigned": (
                f"Job #{context.get('job_id')} assigned. "
                f"Address: {context.get('address')}. Contact homeowner ASAP."
            ),
            "payment_reminder": (
                f"💰 Payment Due: Invoice #{context.get('invoice_id')} "
                f"for ${context.get('amount'):,.2f}. Pay now to avoid delays."
            )
        }
        return templates.get(template, f"Notification: {context}")
