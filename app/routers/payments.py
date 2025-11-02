"""Payments router - payment processing"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.database import get_db

router = APIRouter()


class ProcessPaymentRequest(BaseModel):
    invoice_id: int
    amount: float
    payment_method: str


@router.post("/")
async def process_payment(req: ProcessPaymentRequest, db: AsyncSession = Depends(get_db)):
    """Process payment via Stripe"""
    # TODO: Process via Stripe
    return {"message": "Payment processed", "transaction_id": "mock-txn-123"}


@router.get("/invoice/{invoice_id}")
async def get_invoice(invoice_id: int, db: AsyncSession = Depends(get_db)):
    """Get invoice details"""
    # TODO: Fetch from database
    return {"invoice_id": invoice_id, "total": 0, "status": "draft"}
