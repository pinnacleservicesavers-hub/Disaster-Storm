class DispatchAgent:
    def __init__(self, deps):
        self.msg = deps.msg
        self.db = deps.db
    
    async def broadcast_leads(self, evt):
        # evt: {type:'WEATHER_IMPACT', region, scopes, parcels:[{address, lat, lon}]}
        contractors = await self.db.find_contractors_for_region(evt["region"], evt["scopes"])
        
        sent = 0
        for c in contractors:
            if c.consent_comm:
                await self.msg.notify(c, template="storm_lead", context=evt)
                sent += 1
        
        return {"sent": sent}
