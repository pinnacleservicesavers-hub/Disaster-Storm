class DispatchAgent:
    def __init__(self, deps):
        self.msg = deps.msg
        self.db = deps.db
        self.compliance = deps.compliance
    
    async def broadcast_leads(self, evt):
        # evt: {type:'WEATHER_IMPACT', region, scopes, parcels:[{address, lat, lon}]}
        contractors = await self.db.find_contractors_for_region(evt["region"], evt["scopes"])
        
        sent = 0
        for c in contractors:
            # TCPA/CTIA: Check consent before SMS
            has_consent = await self.compliance.check_consent(c.id, "sms")
            
            # Rate limiting: Respect quiet hours
            if self.compliance.is_quiet_hours(c.timezone if hasattr(c, 'timezone') else "America/New_York"):
                print(f"⏰ Skipping {c.name} - quiet hours")
                continue
            
            if c.consent_comm and has_consent:
                await self.msg.notify(c, template="storm_lead", context=evt)
                sent += 1
        
        return {"sent": sent}
