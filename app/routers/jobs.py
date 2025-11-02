"""Jobs router - job management pipeline"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.database import get_db

router = APIRouter()


class CreateJobRequest(BaseModel):
    property_id: int
    contractor_id: int
    job_type: str
    description: str
    estimated_cost: float


@router.post("/")
async def create_job(req: CreateJobRequest, db: AsyncSession = Depends(get_db)):
    """Create new job"""
    # TODO: Save to database
    return {"message": "Job created", "job_id": 1}


@router.get("/{job_id}")
async def get_job(job_id: int, db: AsyncSession = Depends(get_db)):
    """Get job details"""
    # TODO: Fetch from database
    return {"job_id": job_id, "status": "lead"}


@router.patch("/{job_id}/status")
async def update_status(job_id: int, status: str, db: AsyncSession = Depends(get_db)):
    """Update job status"""
    # TODO: Update in database
    return {"job_id": job_id, "status": status}
