"""Finance Agent - Payment processing and invoicing"""
from typing import Dict, Any


class FinanceAgent:
    """Handles payments, invoicing, and financial operations"""
    
    def __init__(self, deps):
        self.payment = deps.payment
        self.msg = deps.msg
        self.store = deps.storage
    
    async def remind_and_collect(self, evt: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle PAYMENT_DUE event
        evt: {type:'PAYMENT_DUE', invoice_id, contractor, amount}
        """
        invoice_id = evt.get("invoice_id")
        contractor = evt.get("contractor")
        amount = evt.get("amount")
        
        # Send SMS reminder
        await self.msg.notify(
            contractor,
            template="payment_reminder",
            context={"invoice_id": invoice_id, "amount": amount}
        )
        
        # Generate payment link
        payment_link = await self.payment.create_link(invoice_id, amount)
        
        return {
            "reminder_sent": True,
            "payment_link": payment_link
        }
