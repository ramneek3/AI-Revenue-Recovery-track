from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.api.deps import get_db_session
from app.models.schemas import TransactionDB, TransactionStatus, RecoveryActionDB, RecoveryDecisionDB, ActionStatus, RecoveryActionType, FailureCategory

router = APIRouter(prefix="/metrics", tags=["Metrics"])

@router.get("/summary")
async def get_metrics_summary(db: AsyncSession = Depends(get_db_session)):
    """Fetch executive analytics summary for dashboard charts and KPI cards."""
    
    # 1. Total Transactions Count
    res_total = await db.execute(select(func.count(TransactionDB.id)))
    total_transactions = res_total.scalar() or 0

    # 2. Revenue at Risk (Sum of AT_RISK & IN_RECOVERY amounts)
    res_at_risk = await db.execute(
        select(func.sum(TransactionDB.amount)).where(
            TransactionDB.status.in_([TransactionStatus.AT_RISK, TransactionStatus.IN_RECOVERY])
        )
    )
    revenue_at_risk = res_at_risk.scalar() or 0.0

    # 3. Revenue Recovered (Sum of RECOVERED amounts)
    res_recovered = await db.execute(
        select(func.sum(TransactionDB.amount)).where(
            TransactionDB.status == TransactionStatus.RECOVERED
        )
    )
    revenue_recovered = res_recovered.scalar() or 0.0

    # 4. Total Recovered Transactions Count
    res_rec_cnt = await db.execute(
        select(func.count(TransactionDB.id)).where(
            TransactionDB.status == TransactionStatus.RECOVERED
        )
    )
    recovered_count = res_rec_cnt.scalar() or 0

    # 5. Active Escalations Count
    res_esc_cnt = await db.execute(
        select(func.count(TransactionDB.id)).where(
            TransactionDB.status == TransactionStatus.ESCALATED
        )
    )
    escalations_count = res_esc_cnt.scalar() or 0

    # Calculate Recovery Rate
    resolved_total = recovered_count + (await db.execute(select(func.count(TransactionDB.id)).where(TransactionDB.status == TransactionStatus.FAILED_PERMANENT))).scalar() or 0
    recovery_rate = (recovered_count / resolved_total * 100) if resolved_total > 0 else 0.0

    # 6. Action Type Breakdown
    action_counts = {}
    for action_enum in RecoveryActionType:
        cnt_res = await db.execute(
            select(func.count(RecoveryActionDB.id)).where(RecoveryActionDB.action_type == action_enum)
        )
        action_counts[action_enum.value] = cnt_res.scalar() or 0

    # 7. Failure Category Breakdown
    category_counts = {}
    for cat_enum in FailureCategory:
        cat_res = await db.execute(
            select(func.count(RecoveryDecisionDB.id)).where(RecoveryDecisionDB.diagnosed_category == cat_enum)
        )
        category_counts[cat_enum.value] = cat_res.scalar() or 0

    # 8. Recovery Trend Data (Simulated daily breakdown over last 7 periods for Recharts)
    recovery_trend = [
        {"day": "Day 1", "recovered": round(revenue_recovered * 0.08, 2), "at_risk": round(revenue_at_risk * 0.18, 2)},
        {"day": "Day 2", "recovered": round(revenue_recovered * 0.12, 2), "at_risk": round(revenue_at_risk * 0.16, 2)},
        {"day": "Day 3", "recovered": round(revenue_recovered * 0.15, 2), "at_risk": round(revenue_at_risk * 0.14, 2)},
        {"day": "Day 4", "recovered": round(revenue_recovered * 0.18, 2), "at_risk": round(revenue_at_risk * 0.15, 2)},
        {"day": "Day 5", "recovered": round(revenue_recovered * 0.22, 2), "at_risk": round(revenue_at_risk * 0.13, 2)},
        {"day": "Day 6", "recovered": round(revenue_recovered * 0.25, 2), "at_risk": round(revenue_at_risk * 0.12, 2)},
        {"day": "Day 7", "recovered": round(revenue_recovered, 2), "at_risk": round(revenue_at_risk, 2)}
    ]

    return {
        "total_transactions": total_transactions,
        "revenue_at_risk": round(revenue_at_risk, 2),
        "revenue_recovered": round(revenue_recovered, 2),
        "recovery_rate": round(recovery_rate, 1),
        "recovered_count": recovered_count,
        "escalations_count": escalations_count,
        "action_breakdown": action_counts,
        "category_breakdown": category_counts,
        "recovery_trend": recovery_trend
    }
