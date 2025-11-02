class ClaimAgent:
    def __init__(self, deps):
        self.llm = deps.llm
        self.store = deps.storage
        self.xact = deps.xact
    
    async def analyze_and_update(self, evt):
        # evt: {type:'MEDIA_UPLOADED', job_id, media_urls:[...], breakdown:{...}}
        # 1) vision labels & measurements (pseudo)
        labels = ["tree_diameter: 24in", "roof_shingles_missing: 120", "hail_size: 1.5in"]
        # 2) comparables
        true_comp = {"labor_hours": 12, "equipment": "75-ton crane", "rate": 250}
        xact_comp = await self.xact.estimate(evt["breakdown"])
        # 3) narrative
        story = await self.llm("Compose an insurer-facing narrative using policy-good-faith language,"
            " outlining cause, scope, mitigation, and safety.")
        # 4) persist
        return {"labels": labels, "true": true_comp, "xact": xact_comp, "story": story}
