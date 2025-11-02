"""Authentication router - signup, login, sessions"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from app.database import get_db

router = APIRouter()


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    role: str = "contractor"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/signup")
async def signup(req: SignupRequest, db: AsyncSession = Depends(get_db)):
    """Create new user account"""
    # TODO: Hash password, create user
    return {"message": "Signup successful", "user_id": 1}


@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and create session"""
    # TODO: Verify password, create session
    return {"message": "Login successful", "token": "mock-jwt-token"}
