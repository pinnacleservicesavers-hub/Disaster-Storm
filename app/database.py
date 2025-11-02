"""
Database Connection and Session Management
"""
import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base


# Database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost/disaster_direct")

# Convert postgres:// to postgresql:// for SQLAlchemy
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# For async, use asyncpg driver
if not DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)


# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=os.getenv("ENV") == "development",  # Log SQL in development
    pool_pre_ping=True,  # Check connections before using
    pool_size=10,
    max_overflow=20
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# Base class for SQLAlchemy models
Base = declarative_base()


async def init_db():
    """
    Initialize database connection
    Create tables if they don't exist
    """
    async with engine.begin() as conn:
        # Import all models to ensure they're registered
        from app import models  # noqa: F401
        
        # Create tables
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ Database tables created/verified")


async def close_db():
    """Close database connections"""
    await engine.dispose()
    print("✅ Database connections closed")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for getting database sessions in FastAPI routes
    
    Usage:
        @router.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
