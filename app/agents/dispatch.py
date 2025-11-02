"""Dispatch Agent - Contractor deployment and notifications"""
from typing import Dict, Any


class DispatchAgent:
    """Handles contractor deployment and notifications"""
    
    def __init__(self, deps):
        self.msg = deps.msg
        self.db = deps.db
    
    async def broadcast_leads(self, evt: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle WEATHER_IMPACT event
        Broadcast contractor leads based on weather conditions
        
        evt: {type:'WEATHER_IMPACT', region, scopes, parcels:[{address, lat, lon}]}
        """
        contractors = await self.db.find_contractors_for_region(
            evt["region"], 
            evt["scopes"]
        )
        
        sent = 0
        for c in contractors:
            if c.consent_comm:
                await self.msg.notify(c, template="storm_lead", context=evt)
                sent += 1
        
        return {"sent": sent}
    
    async def send_notification(self, evt: Dict[str, Any]) -> Dict[str, Any]:
        """Send notification to specific contractor"""
        contractor = await self.db.get_contractor(evt.get("contractor_id"))
        
        if contractor and contractor.consent_comm:
            await self.msg.notify(
                contractor,
                template=evt.get("template", "job_opportunity"),
                context=evt.get("data", {})
            )
            return {"ok": True, "sent": True}
        
        return {"ok": False, "sent": False, "reason": "No consent or contractor not found"}
