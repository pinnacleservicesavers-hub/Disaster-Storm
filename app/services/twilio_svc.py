import os


class TwilioService:
    def __init__(self):
        sid = os.getenv("TWILIO_ACCOUNT_SID")
        token = os.getenv("TWILIO_AUTH_TOKEN")
        self.from_number = os.getenv("TWILIO_PHONE_NUMBER")
        self.client = None
        
        if sid and token:
            from twilio.rest import Client
            self.client = Client(sid, token)
            print("✅ Twilio enabled")
        else:
            print("⚠️ Twilio mock mode")
    
    async def notify(self, user, template, context):
        # render template + send SMS per user.alert_channels
        phone = getattr(user, 'phone', None) or user.get('phone')
        msg = self._render(template, context)
        
        if self.client and phone:
            try:
                self.client.messages.create(to=phone, from_=self.from_number, body=msg)
                return True
            except Exception as e:
                print(f"❌ Twilio error: {e}")
                return False
        else:
            print(f"📱 [MOCK] {template} → {phone}: {msg[:50]}...")
            return True
    
    def _render(self, template, ctx):
        templates = {
            "storm_lead": f"🚨 Storm Alert: {ctx.get('region')} - {len(ctx.get('parcels', []))} properties. Reply YES.",
            "job_opportunity": f"New Job: {ctx.get('description')} at {ctx.get('address')}. Reply YES.",
            "payment_reminder": f"💰 Payment Due: Invoice #{ctx.get('invoice_id')} ${ctx.get('amount'):,.2f}"
        }
        return templates.get(template, f"Notification: {ctx}")
