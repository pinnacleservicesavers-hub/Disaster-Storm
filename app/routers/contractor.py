"""Contractor router - profiles, equipment, certifications"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List
from app.database import get_db

router = APIRouter()


class ContractorProfileRequest(BaseModel):
    user_id: int
    company_name: str
    license_number: str
    service_areas: List[str]
    certifications: List[str]
    equipment: List[str]
    alert_phone: str


@router.post("/profile")
async def create_profile(req: ContractorProfileRequest, db: AsyncSession = Depends(get_db)):
    """Create or update contractor profile"""
    # TODO: Save to database
    return {"message": "Profile created", "profile_id": 1}


@router.get("/profile/{user_id}")
async def get_profile(user_id: int, db: AsyncSession = Depends(get_db)):
    """Get contractor profile"""
    # TODO: Fetch from database
    return {"user_id": user_id, "company_name": "Mock Contractor Inc"}
