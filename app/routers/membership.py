"""Membership router - Stripe subscription management"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.database import get_db

router = APIRouter()


class CheckoutRequest(BaseModel):
    plan: str  # one_time, monthly
    user_id: int


@router.post("/checkout")
async def create_checkout(req: CheckoutRequest, db: AsyncSession = Depends(get_db)):
    """Create Stripe checkout session"""
    # TODO: Create Stripe checkout
    return {"checkout_url": "https://checkout.stripe.com/mock"}


@router.post("/webhook")
async def stripe_webhook(db: AsyncSession = Depends(get_db)):
    """Handle Stripe webhook events"""
    # TODO: Verify signature, process events
    return {"received": True}
