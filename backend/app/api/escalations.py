from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.api.deps import get_db_session
from app.models.schemas import (
    RecoveryActionDB, TransactionDB, ActionStatus, TransactionStatus, AuditLogDB, RecoveryActionSchema
)

router = APIRouter(prefix="/escalations", tags=["Escalations"])

@router.get("", response_model=dict)
async def list_escalations(db: AsyncSession = Depends(get_db_session)):
    """List all pending actions requiring merchant manual approval."""
    query = select(RecoveryActionDB).where(
        RecoveryActionDB.status == ActionStatus.AWAITING_APPROVAL
    ).options(
        selectinload(RecoveryActionDB.transaction).selectinload(TransactionDB.customer),
        selectinload(RecoveryActionDB.decision)
    )

    result = await db.execute(query)
    actions = result.scalars().all()

    items = []
    for act in actions:
        items.append({
            "action_id": act.id,
            "transaction_id": act.transaction_id,
            "customer_name": act.transaction.customer.name if act.transaction and act.transaction.customer else "Unknown",
            "customer_email": act.transaction.customer.email if act.transaction and act.transaction.customer else "",
            "clv_tier": act.transaction.customer.clv_tier.value if act.transaction and act.transaction.customer else "REGULAR",
            "amount": act.transaction.amount if act.transaction else 0.0,
            "failure_code": act.transaction.failure_code if act.transaction else "",
            "reasoning_summary": act.decision.reasoning_summary if act.decision else "",
            "action_type": act.action_type.value,
            "status": act.status.value,
            "created_at": act.decision.created_at if act.decision else datetime.utcnow()
        })

    return {"items": items, "count": len(items)}

@router.post("/{action_id}/approve")
async def approve_escalation(action_id: str, db: AsyncSession = Depends(get_db_session)):
    """Merchant approves an escalated high-value or high-risk recovery action."""
    query = select(RecoveryActionDB).where(RecoveryActionDB.id == action_id).options(
        selectinload(RecoveryActionDB.transaction)
    )
    result = await db.execute(query)
    action = result.scalar_one_or_none()

    if not action:
        raise HTTPException(status_code=404, detail="Escalated action not found")

    action.status = ActionStatus.EXECUTED
    action.executed_at = datetime.utcnow()
    action.result_metadata = {"approval_status": "APPROVED_BY_MERCHANT", "approved_at": datetime.utcnow().isoformat()}

    if action.transaction:
        action.transaction.status = TransactionStatus.RECOVERED
        action.transaction.updated_at = datetime.utcnow()

        # Log audit trail
        audit = AuditLogDB(
            transaction_id=action.transaction_id,
            step="ACT_AND_VERIFY",
            actor="MERCHANT_USER",
            details={"event": "ESCALATION_APPROVED", "action_id": action_id, "result": "Transaction recovered successfully"},
            created_at=datetime.utcnow()
        )
        db.add(audit)

    await db.commit()
    return {"message": "Escalation approved successfully. Recovery action executed.", "status": "APPROVED"}

@router.post("/{action_id}/reject")
async def reject_escalation(action_id: str, db: AsyncSession = Depends(get_db_session)):
    """Merchant rejects an escalated recovery action."""
    query = select(RecoveryActionDB).where(RecoveryActionDB.id == action_id).options(
        selectinload(RecoveryActionDB.transaction)
    )
    result = await db.execute(query)
    action = result.scalar_one_or_none()

    if not action:
        raise HTTPException(status_code=404, detail="Escalated action not found")

    action.status = ActionStatus.REJECTED
    action.result_metadata = {"approval_status": "REJECTED_BY_MERCHANT", "rejected_at": datetime.utcnow().isoformat()}

    if action.transaction:
        action.transaction.status = TransactionStatus.FAILED_PERMANENT
        action.transaction.updated_at = datetime.utcnow()

        # Log audit trail
        audit = AuditLogDB(
            transaction_id=action.transaction_id,
            step="ACT_AND_VERIFY",
            actor="MERCHANT_USER",
            details={"event": "ESCALATION_REJECTED", "action_id": action_id, "result": "Recovery suppressed by merchant"},
            created_at=datetime.utcnow()
        )
        db.add(audit)

    await db.commit()
    return {"message": "Escalation rejected. Recovery action suppressed.", "status": "REJECTED"}
