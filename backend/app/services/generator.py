import random
import uuid
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.schemas import (
    MerchantDB, CustomerDB, TransactionDB, RecoveryDecisionDB, RecoveryActionDB, AuditLogDB,
    TransactionType, TransactionStatus, FailureCategory, RecoveryActionType, ActionStatus, CLVTier
)

INDIAN_FIRST_NAMES = [
    "Aarav", "Ananya", "Rohan", "Priya", "Aditya", "Sneha", "Vikram", "Neha",
    "Rahul", "Kavya", "Siddharth", "Pooja", "Arjun", "Riya", "Karan", "Ishaan",
    "Shreya", "Tanvi", "Dev", "Meera", "Kabir", "Simran", "Varun", "Divya",
    "Gaurav", "Nisha", "Amit", "Swati", "Suresh", "Poonam"
]

INDIAN_LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Gupta", "Singh", "Reddy", "Nair", "Iyer",
    "Kumar", "Joshi", "Mehta", "Chawla", "Deshmukh", "Rao", "Bhasin", "Kapoor",
    "Agarwal", "Shah", "Malhotra", "Bhatt", "Roy", "Mukherjee", "Das", "Pillai"
]

PAYMENT_FAILURE_CODES = {
    TransactionType.FAILED_PAYMENT: [
        ("BAD_REQUEST_PAYMENT_TIMED_OUT", "Payment gateway timed out during UPI authorization step.", FailureCategory.TECHNICAL_TRANSIENT, "UPI"),
        ("INSUFFICIENT_FUNDS", "Bank account has insufficient balance for transaction execution.", FailureCategory.INSUFFICIENT_FUNDS, "UPI"),
        ("EXPIRED_CARD", "Customer credit/debit card expired past validity date.", FailureCategory.CUSTOMER_FRICTION, "CARD"),
        ("SUSPECTED_FRAUD_BLOCK", "Issuing bank blocked transaction due to unusual location risk score.", FailureCategory.SUSPECTED_FRAUD, "CARD"),
        ("NETBANKING_SESSION_EXPIRED", "Customer abandoned 2FA screen during SBI NetBanking auth.", FailureCategory.CUSTOMER_FRICTION, "NETBANKING")
    ],
    TransactionType.SUBSCRIPTION_FAILURE: [
        ("MANDATE_EXECUTION_FAILED", "Auto-debit recurring payment mandate rejected by customer bank.", FailureCategory.TECHNICAL_TRANSIENT, "NACH_MANDATE"),
        ("SUBSCRIPTION_EXPIRED_CARD", "Saved card for recurring billing reached end of life.", FailureCategory.CUSTOMER_FRICTION, "CARD"),
        ("INSUFFICIENT_FUNDS_RECURRING", "Automated recurring billing failed due to low account balance.", FailureCategory.INSUFFICIENT_FUNDS, "UPI_AUTOPAY")
    ],
    TransactionType.CHECKOUT_ABANDONMENT: [
        ("CART_SESSION_DROPPED", "Customer abandoned checkout after entering shipping details at payment gateway prompt.", FailureCategory.CUSTOMER_FRICTION, "UPI"),
        ("COUPON_APPLY_ERROR", "Cart abandoned after promotional coupon code failed to apply.", FailureCategory.CUSTOMER_FRICTION, "CARD")
    ],
    TransactionType.INVOICE_OVERDUE: [
        ("PAYMENT_REMINDER_UNANSWERED", "B2B SaaS invoice payment overdue by 14 days without customer response.", FailureCategory.COMMUNICATION_GAP, "NETBANKING"),
        ("ACCOUNTS_PAYABLE_DELAY", "Corporate client invoice waiting for internal procurement approval.", FailureCategory.COMMUNICATION_GAP, "BANK_TRANSFER")
    ]
}

async def generate_synthetic_data(db: AsyncSession, count: int = 1000) -> dict:
    """Generate 1000+ synthetic transactions with complete realistic lifecycle audit logs."""
    
    # Check if already seeded
    result = await db.execute(select(func.count(TransactionDB.id)))
    existing_count = result.scalar()
    if existing_count and existing_count >= count:
        return {"message": f"Database already contains {existing_count} transactions.", "seeded_count": 0}

    # 1. Create Default Merchant
    merchant = MerchantDB(
        id=str(uuid.uuid4()),
        name="RazorPay TechMerchants India",
        email="finance@techmerchants.in",
        max_retries=2,
        max_contact_attempts=3
    )
    db.add(merchant)

    # 2. Create 150 Unique Customers
    customers = []
    clv_choices = [CLVTier.REGULAR, CLVTier.REGULAR, CLVTier.REGULAR, CLVTier.VIP, CLVTier.AT_RISK]
    for _ in range(150):
        fn = random.choice(INDIAN_FIRST_NAMES)
        ln = random.choice(INDIAN_LAST_NAMES)
        cust = CustomerDB(
            id=str(uuid.uuid4()),
            name=f"{fn} {ln}",
            email=f"{fn.lower()}.{ln.lower()}{random.randint(10,999)}@example.com",
            phone=f"+91{random.randint(7000000000, 9999999999)}",
            risk_score=round(random.uniform(0.05, 0.85), 2),
            clv_tier=random.choice(clv_choices)
        )
        customers.append(cust)
        db.add(cust)
    
    await db.flush()

    # 3. Create 1,000 Transactions
    now = datetime.utcnow()
    transactions = []
    
    # Status distribution: 40% AT_RISK, 35% RECOVERED, 10% IN_RECOVERY, 10% ESCALATED, 5% FAILED_PERMANENT
    status_weights = [
        (TransactionStatus.AT_RISK, 0.40),
        (TransactionStatus.RECOVERED, 0.35),
        (TransactionStatus.IN_RECOVERY, 0.10),
        (TransactionStatus.ESCALATED, 0.10),
        (TransactionStatus.FAILED_PERMANENT, 0.05),
    ]
    
    status_choices = []
    for st, w in status_weights:
        status_choices.extend([st] * int(w * 100))

    tx_types = list(TransactionType)

    for i in range(count):
        cust = random.choice(customers)
        tx_type = random.choice(tx_types)
        fail_info = random.choice(PAYMENT_FAILURE_CODES[tx_type])
        code, raw_reason, category, default_method = fail_info
        
        status = random.choice(status_choices)
        
        # Vary transaction amounts logically by type
        if tx_type == TransactionType.INVOICE_OVERDUE:
            amount = round(random.uniform(15000, 150000), 2)
        elif tx_type == TransactionType.SUBSCRIPTION_FAILURE:
            amount = round(random.choice([499, 999, 1499, 2999, 4999]), 2)
        else:
            amount = round(random.uniform(250, 25000), 2)

        days_ago = random.uniform(0.1, 30)
        created_dt = now - timedelta(days=days_ago)

        retry_cnt = 0
        contact_cnt = 0
        if status in [TransactionStatus.RECOVERED, TransactionStatus.IN_RECOVERY, TransactionStatus.FAILED_PERMANENT]:
            retry_cnt = random.randint(1, 2)
            contact_cnt = random.randint(1, 2)

        tx = TransactionDB(
            id=str(uuid.uuid4()),
            merchant_id=merchant.id,
            customer_id=cust.id,
            amount=amount,
            currency="INR",
            type=tx_type,
            status=status,
            failure_code=code,
            failure_reason_raw=raw_reason,
            retry_count=retry_cnt,
            contact_count=contact_cnt,
            payment_method=default_method,
            created_at=created_dt,
            updated_at=created_dt + timedelta(minutes=random.randint(5, 120))
        )
        transactions.append(tx)
        db.add(tx)

        # Generate realistic decision & audit log for processed transactions
        if status != TransactionStatus.AT_RISK:
            rec_score = round(random.uniform(0.65, 0.98), 2) if status == TransactionStatus.RECOVERED else round(random.uniform(0.2, 0.55), 2)
            
            if category == FailureCategory.TECHNICAL_TRANSIENT:
                action_type = RecoveryActionType.RETRY_PAYMENT
            elif category == FailureCategory.CUSTOMER_FRICTION:
                action_type = RecoveryActionType.GENERATE_PAYMENT_LINK
            elif category == FailureCategory.COMMUNICATION_GAP or tx_type == TransactionType.INVOICE_OVERDUE:
                action_type = RecoveryActionType.SEND_REMINDER
            elif cust.clv_tier == CLVTier.VIP or amount > 50000 or status == TransactionStatus.ESCALATED:
                action_type = RecoveryActionType.ESCALATE_TO_MERCHANT
            else:
                action_type = RecoveryActionType.GENERATE_PAYMENT_LINK

            decision = RecoveryDecisionDB(
                id=str(uuid.uuid4()),
                transaction_id=tx.id,
                diagnosed_category=category,
                recoverability_score=rec_score,
                recommended_action=action_type,
                reasoning_summary=f"Automated AI Diagnosis: Classified error '{code}' as {category.value}. Evaluated customer tier ({cust.clv_tier.value}) & retry history ({retry_cnt}/2 retries). Selected optimal bounded strategy: {action_type.value}.",
                business_rules_passed=[
                    "Rule 1: Retry count <= 2 (PASSED)",
                    "Rule 2: Contact frequency within 24h cooling off window (PASSED)",
                    "Rule 3: Amount risk threshold verified (PASSED)"
                ],
                confidence_score=round(random.uniform(0.85, 0.99), 2),
                created_at=created_dt + timedelta(minutes=2)
            )
            db.add(decision)

            action_status = ActionStatus.EXECUTED if status == TransactionStatus.RECOVERED else (
                ActionStatus.AWAITING_APPROVAL if status == TransactionStatus.ESCALATED else ActionStatus.FAILED
            )

            action = RecoveryActionDB(
                id=str(uuid.uuid4()),
                transaction_id=tx.id,
                decision_id=decision.id,
                action_type=action_type,
                status=action_status,
                payload={
                    "razorpay_payment_link": f"https://rzp.io/i/{tx.id[:8]}",
                    "channel": "WhatsApp/SMS" if action_type == RecoveryActionType.SEND_REMINDER else "API_RETRY",
                    "discount_applied": "5%" if cust.clv_tier == CLVTier.VIP else "0%"
                },
                executed_at=created_dt + timedelta(minutes=5),
                result_metadata={"http_code": 200, "gateway_ref": f"pay_{uuid.uuid4().hex[:10]}"}
            )
            db.add(action)

            # Audit Logs
            audit1 = AuditLogDB(
                id=str(uuid.uuid4()),
                transaction_id=tx.id,
                step="DETECT",
                actor="SYSTEM_WEBHOOK",
                details={"event": "payment.failed", "code": code, "raw_reason": raw_reason},
                created_at=created_dt
            )
            audit2 = AuditLogDB(
                id=str(uuid.uuid4()),
                transaction_id=tx.id,
                step="DIAGNOSE_AND_DECIDE",
                actor="AI_AGENT",
                details={"category": category.value, "recommended_action": action_type.value, "score": rec_score},
                created_at=created_dt + timedelta(minutes=2)
            )
            audit3 = AuditLogDB(
                id=str(uuid.uuid4()),
                transaction_id=tx.id,
                step="ACT_AND_VERIFY",
                actor="RECOVERY_ENGINE",
                details={"action_executed": action_type.value, "status": action_status.value},
                created_at=created_dt + timedelta(minutes=5)
            )
            db.add_all([audit1, audit2, audit3])

    await db.commit()
    return {"message": f"Successfully seeded database with {count} realistic transaction lifecycles.", "seeded_count": count}
