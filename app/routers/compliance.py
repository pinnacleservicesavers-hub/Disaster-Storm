"""Compliance router - legal compliance, lien deadlines"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db

router = APIRouter()


class ValidateContractRequest(BaseModel):
    state: str
    contract_text: str
    aob_included: bool = False


class LienDeadlineRequest(BaseModel):
    job_id: int
    state: str
    completion_date: datetime


@router.post("/validate-contract")
async def validate_contract(req: ValidateContractRequest, db: AsyncSession = Depends(get_db)):
    """Validate contract against state rules"""
    # TODO: Call LegalAgent
    return {"valid": True, "missing_clauses": []}


@router.post("/lien-deadline")
async def calculate_lien_deadline(req: LienDeadlineRequest, db: AsyncSession = Depends(get_db)):
    """Calculate lien filing deadline"""
    # TODO: Calculate deadline by state
    return {"deadline": "2025-12-31", "days_remaining": 90}
