"""Leads router - lead generation from weather events"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db

router = APIRouter()


@router.get("/")
async def get_leads(db: AsyncSession = Depends(get_db)):
    """Get active contractor leads"""
    # TODO: Fetch leads from database
    return {"leads": [], "count": 0}


@router.get("/opportunities")
async def get_opportunities(state: str = None, db: AsyncSession = Depends(get_db)):
    """Get contractor opportunities based on weather"""
    # TODO: Query weather-based opportunities
    return {"opportunities": [], "count": 0}
