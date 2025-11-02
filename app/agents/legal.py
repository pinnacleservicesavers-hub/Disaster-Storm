from typing import Dict, Any


class LegalAgent:
    def __init__(self, deps):
        self.llm = deps.llm
        self.doc_store = deps.doc_store
    
    async def validate_or_generate(self, evt: Dict[str, Any]):
        state = evt["state"]
        trade = evt["trade"]
        user_contract = evt.get("contract_text")
        
        # pseudo-prompt (use your LLM client)
        if user_contract:
            review = await self.llm(
                f"Review this contract for {state} law and {trade} trade.\n"
                "Flag missing clauses (AOB, indemnification, cancellation, pricing, lien)."
                "Return JSON: {is_legal:bool, issues:[...], suggestions:[...], aob_included:bool} \n\n" + user_contract
            )
            return {"action":"review", "result": review}
        else:
            template = await self.llm(
                f"Draft a contractor agreement for {trade} in {state} with AOB if permitted."
                "Include lien, change orders, payment terms, dispute, and photo consent."
                "Return plain text."
            )
            return {"action":"generate", "contract": template}
