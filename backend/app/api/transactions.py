from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from app.api.deps import get_db_session
from app.models.schemas import TransactionDB, TransactionSchema, TransactionStatus, TransactionType

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("", response_model=dict)
async def list_transactions(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    status: Optional[TransactionStatus] = None,
    type: Optional[TransactionType] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db_session)
):
    """List transactions with filtering, pagination, and eager loaded relations."""
    query = select(TransactionDB).options(
        selectinload(TransactionDB.customer),
        selectinload(TransactionDB.decisions),
        selectinload(TransactionDB.actions),
        selectinload(TransactionDB.audit_logs)
    )

    if status:
        query = query.where(TransactionDB.status == status)
    if type:
        query = query.where(TransactionDB.type == type)
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                TransactionDB.id.like(search_pattern),
                TransactionDB.failure_code.like(search_pattern),
                TransactionDB.failure_reason_raw.like(search_pattern)
            )
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_query)
    total = total_res.scalar() or 0

    # Paginate and order by newest first
    offset = (page - 1) * limit
    query = query.order_by(TransactionDB.created_at.desc()).offset(offset).limit(limit)
    
    result = await db.execute(query)
    items = result.scalars().all()

    # Convert to schema
    serialized_items = [TransactionSchema.model_validate(item) for item in items]

    return {
        "items": serialized_items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if limit else 1
    }

@router.get("/{transaction_id}", response_model=TransactionSchema)
async def get_transaction(
    transaction_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Get single transaction with full AI reasoning timeline and audit logs."""
    query = select(TransactionDB).where(TransactionDB.id == transaction_id).options(
        selectinload(TransactionDB.customer),
        selectinload(TransactionDB.merchant),
        selectinload(TransactionDB.decisions),
        selectinload(TransactionDB.actions),
        selectinload(TransactionDB.audit_logs)
    )
    result = await db.execute(query)
    tx = result.scalar_one_or_none()

    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    return TransactionSchema.model_validate(tx)
