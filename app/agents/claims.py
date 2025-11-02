"""Claim Agent - Insurance claim creation and management"""
from typing import Dict, Any


class ClaimAgent:
    """Processes insurance claims with AI-powered damage analysis"""
    
    def __init__(self, deps):
        self.llm = deps.llm
        self.vision = deps.vision
        self.db = deps.db
        self.property_api = deps.property_api
    
    async def analyze_and_update(self, evt: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle MEDIA_UPLOADED event
        Analyze damage from media and update claim
        """
        job_id = evt.get("job_id") or evt.get("data", {}).get("job_id")
        media_url = evt.get("media_url") or evt.get("data", {}).get("media_url")
        
        # AI vision analysis
        damage_analysis = await self.vision.analyze(media_url)
        
        # Update claim with AI findings
        claim = await self.db.update_claim_for_job(
            job_id=job_id,
            damage_types=damage_analysis["damage_types"],
            estimated_cost=damage_analysis["estimated_cost"],
            severity=damage_analysis["severity"],
            ai_notes=damage_analysis["notes"]
        )
        
        return {
            "ok": True,
            "job_id": job_id,
            "claim_id": claim.id,
            "damage_analyzed": True,
            "damage_types": damage_analysis["damage_types"],
            "estimated_cost": damage_analysis["estimated_cost"],
            "severity": damage_analysis["severity"]
        }
    
    async def create_claim(self, evt: Dict[str, Any]) -> Dict[str, Any]:
        """Create new insurance claim with property data enrichment"""
        data = evt.get("data", evt)
        address = data.get("address")
        damage_type = data.get("damageType") or data.get("damage_type")
        estimated_cost = data.get("estimatedCost") or data.get("estimated_cost")
        job_id = data.get("job_id")
        
        # Enrich with property data
        property_data = await self.property_api.lookup(address)
        
        # Generate AI claim description
        claim_description = await self.llm(
            f"Write a professional insurance claim description for {damage_type} damage "
            f"at {address}. Property type: {property_data.get('type')}. "
            f"Estimated damage: ${estimated_cost}. "
            f"Include scope of damage, affected areas, and recommended repairs. "
            f"Return plain text, 2-3 paragraphs."
        )
        
        # Save to database
        claim = await self.db.create_claim(
            job_id=job_id,
            address=address,
            property_data=property_data,
            damage_type=damage_type,
            estimated_cost=estimated_cost,
            description=claim_description,
            status="draft"
        )
        
        return {
            "ok": True,
            "claim_id": claim.id,
            "property": property_data,
            "damage_type": damage_type,
            "estimated_cost": estimated_cost,
            "description": claim_description,
            "status": "draft"
        }
