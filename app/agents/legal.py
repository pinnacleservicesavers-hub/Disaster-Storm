class LegalAgent:
    def __init__(self, deps):
        self.llm = deps.llm
        self.doc_store = deps.doc_store
        self.compliance = deps.compliance
    
    async def validate_or_generate(self, evt):
        state = evt["state"]
        trade = evt["trade"]
        user_contract = evt.get("contract_text")
        
        # AOB awareness: Check if state prohibits Assignment of Benefits
        aob_check = self.compliance.check_aob_allowed(state)
        
        if user_contract:
            # Validate uploaded contract
            review = await self.llm(
                f"Review this contract for {state} law and {trade} trade.\n"
                f"AOB status: {aob_check['message']}\n"
                "Flag missing clauses (indemnification, cancellation, pricing, lien).\n"
                "Return JSON: {is_legal:bool, issues:[...], suggestions:[...], aob_included:bool} \n\n" + user_contract
            )
            
            # Block AOB if prohibited
            if not aob_check["allowed"] and "aob_included:true" in review.lower():
                return {
                    "action": "review",
                    "result": review,
                    "aob_violation": True,
                    "error": f"⚠️ AOB prohibited in {state} - contract REJECTED"
                }
            
            return {"action": "review", "result": review, "aob_check": aob_check}
        else:
            # Generate new contract
            aob_instruction = "with AOB" if aob_check["allowed"] else "WITHOUT AOB (prohibited)"
            
            template = await self.llm(
                f"Draft a contractor agreement for {trade} in {state} {aob_instruction}.\n"
                "Include lien, change orders, payment terms, dispute, and photo consent.\n"
                "Cite only standard industry clauses - DO NOT invent statutes.\n"
                "Return plain text."
            )
            return {"action": "generate", "contract": template, "aob_check": aob_check}
