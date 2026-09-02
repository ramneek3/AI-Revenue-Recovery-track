from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db_session
from app.services.generator import generate_synthetic_data

router = APIRouter(prefix="/seed", tags=["Seed Data"])

@router.post("")
async def seed_database(
    count: int = Query(default=1000, ge=10, le=5000),
    force: bool = Query(default=True),
    db: AsyncSession = Depends(get_db_session)
):
    """Seed backend database with realistic Indian context transaction lifecycles."""
    try:
        res = await generate_synthetic_data(db, count=count, force=force)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data seeding failed: {str(e)}")
