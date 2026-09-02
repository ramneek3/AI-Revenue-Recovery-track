from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.api.deps import get_db_session
from app.models.schemas import TransactionDB, MerchantDB, TransactionStatus
from app.services.agent import ai_agent

router = APIRouter(prefix="/recovery", tags=["AI Recovery Agent Engine"])

@router.post("/single-run/{transaction_id}")
async def run_single_recovery(
    transaction_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Trigger the 6-step AI agent recovery pipeline for a specific transaction."""
    query = select(TransactionDB).where(TransactionDB.id == transaction_id).options(
        selectinload(TransactionDB.customer),
        selectinload(TransactionDB.merchant)
    )
    result = await db.execute(query)
    tx = result.scalar_one_or_none()

    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Fetch default merchant if tx.merchant not attached
    if not tx.merchant:
        merchant_res = await db.execute(select(MerchantDB))
        tx.merchant = merchant_res.scalars().first()

    res = await ai_agent.run_recovery_pipeline(tx, tx.merchant, db)
    return res

@router.post("/batch-run")
async def run_batch_recovery(
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db_session)
):
    """Batch run AI recovery agent engine on pending AT_RISK transactions."""
    query = select(TransactionDB).where(
        TransactionDB.status == TransactionStatus.AT_RISK
    ).options(
        selectinload(TransactionDB.customer),
        selectinload(TransactionDB.merchant)
    ).limit(limit)

    result = await db.execute(query)
    transactions = result.scalars().all()

    if not transactions:
        return {"message": "No pending AT_RISK transactions to process.", "processed_count": 0, "results": []}

    # Fetch merchant
    merchant_res = await db.execute(select(MerchantDB))
    default_merchant = merchant_res.scalars().first()

    results = []
    for tx in transactions:
        m = tx.merchant or default_merchant
        r = await ai_agent.run_recovery_pipeline(tx, m, db)
        results.append(r)

    return {
        "message": f"Successfully processed {len(results)} at-risk transactions.",
        "processed_count": len(results),
        "results": results
    }
