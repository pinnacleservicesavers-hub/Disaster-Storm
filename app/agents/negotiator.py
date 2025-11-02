class NegotiatorAgent:
    def __init__(self, deps):
        self.llm = deps.llm
        self.msg = deps.msg
    
    async def prepare_rebuttal(self, evt):
        # evt: {type:'INVOICE_DISPUTED', job_id, insurer_comment, min_accept_percent}
        rebuttal = await self.llm(
            "Draft a concise, assertive rebuttal citing duty of good faith, necessity of mitigation,\n"
            "and any applicable code references (do not invent statutes)."
        )
        # auto-send (respect opt-in)
        return {"rebuttal": rebuttal}
