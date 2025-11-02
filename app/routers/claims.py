"""Claims router - insurance claim management"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.database import get_db

router = APIRouter()


class CreateClaimRequest(BaseModel):
    job_id: int
    insurance_company: str
    policy_number: str
    requested_amount: float


@router.post("/")
async def create_claim(req: CreateClaimRequest, db: AsyncSession = Depends(get_db)):
    """Create insurance claim"""
    # TODO: Save to database
    return {"message": "Claim created", "claim_id": 1}


@router.get("/{claim_id}")
async def get_claim(claim_id: int, db: AsyncSession = Depends(get_db)):
    """Get claim details"""
    # TODO: Fetch from database
    return {"claim_id": claim_id, "status": "draft"}


@router.post("/{claim_id}/submit")
async def submit_claim(claim_id: int, db: AsyncSession = Depends(get_db)):
    """Submit claim to insurance company"""
    # TODO: Update status, trigger submission
    return {"claim_id": claim_id, "status": "submitted"}
