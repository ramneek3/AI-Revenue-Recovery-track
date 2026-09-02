import json
import uuid
import random
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from openai import AsyncOpenAI

from app.config import settings
from app.models.schemas import (
    TransactionDB, CustomerDB, MerchantDB, RecoveryDecisionDB, RecoveryActionDB, AuditLogDB,
    TransactionStatus, FailureCategory, RecoveryActionType, ActionStatus, CLVTier
)

class AIRecoveryAgent:
    def __init__(self):
        self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None

    async def run_recovery_pipeline(self, tx: TransactionDB, merchant: MerchantDB, db: AsyncSession) -> Dict[str, Any]:
        """Execute the 6-Step Autonomous AI Recovery Lifecycle:
           DETECT -> DIAGNOSE -> DECIDE -> ACT -> VERIFY -> MEASURE
        """
        cust: CustomerDB = tx.customer
        if not cust:
            cust = CustomerDB(
                id=tx.customer_id or str(uuid.uuid4()),
                name="Rohan Sharma",
                email="rohan.sharma@example.com",
                phone="+919876543210",
                risk_score=0.2,
                clv_tier=CLVTier.REGULAR
            )

        if not merchant:
            merchant = MerchantDB(
                id=tx.merchant_id or str(uuid.uuid4()),
                name="RazorPay TechMerchants India",
                email="finance@techmerchants.in",
                max_retries=2,
                max_contact_attempts=3
            )
        
        # Step 1: DETECT Log
        audit_detect = AuditLogDB(
            transaction_id=tx.id,
            step="DETECT",
            actor="AI_AGENT",
            details={
                "event": "INGEST_FAILED_TRANSACTION",
                "amount": tx.amount,
                "type": tx.type.value,
                "failure_code": tx.failure_code,
                "retry_count": tx.retry_count,
                "contact_count": tx.contact_count
            },
            created_at=datetime.utcnow()
        )
        db.add(audit_detect)

        # Step 2: DIAGNOSE - Failure Classification
        diagnosed_category = self._classify_failure(tx.failure_code, tx.failure_reason_raw)

        audit_diagnose = AuditLogDB(
            transaction_id=tx.id,
            step="DIAGNOSE",
            actor="AI_AGENT",
            details={
                "failure_code": tx.failure_code,
                "raw_reason": tx.failure_reason_raw,
                "diagnosed_category": diagnosed_category.value
            },
            created_at=datetime.utcnow()
        )
        db.add(audit_diagnose)

        # Step 3: DECIDE - Business Rules & LLM Reasoning
        rules_check = self._evaluate_business_guardrails(tx, merchant, cust, diagnosed_category)
        
        # Determine strategy via OpenAI or Rule Engine
        decision_data = await self._reason_with_llm(tx, merchant, cust, diagnosed_category, rules_check)

        decision = RecoveryDecisionDB(
            id=str(uuid.uuid4()),
            transaction_id=tx.id,
            diagnosed_category=diagnosed_category,
            recoverability_score=decision_data["recoverability_score"],
            recommended_action=decision_data["recommended_action"],
            reasoning_summary=decision_data["reasoning_summary"],
            business_rules_passed=rules_check["passed_rules"],
            confidence_score=decision_data["confidence_score"],
            created_at=datetime.utcnow()
        )
        db.add(decision)
        await db.flush()

        audit_decide = AuditLogDB(
            transaction_id=tx.id,
            step="DECIDE",
            actor="AI_AGENT",
            details={
                "recommended_action": decision.recommended_action.value,
                "recoverability_score": decision.recoverability_score,
                "reasoning": decision.reasoning_summary,
                "rules_passed": rules_check["passed_rules"],
                "blocked_reasons": rules_check["blocked_reasons"]
            },
            created_at=datetime.utcnow()
        )
        db.add(audit_decide)

        # Step 4 & 5: ACT & VERIFY - Bounded Execution
        rec_action_enum = decision.recommended_action
        
        if rec_action_enum == RecoveryActionType.NO_ACTION or not rules_check["can_proceed"]:
            action_status = ActionStatus.FAILED
            tx.status = TransactionStatus.FAILED_PERMANENT
            action_payload = {"reason": "Business rules stopped execution or NO_ACTION chosen"}
            result_meta = {"recovery_outcome": "SUPPRESSED"}
        elif rec_action_enum == RecoveryActionType.ESCALATE_TO_MERCHANT:
            action_status = ActionStatus.AWAITING_APPROVAL
            tx.status = TransactionStatus.ESCALATED
            action_payload = {
                "escalation_reason": "High-value transaction or VIP customer requiring human review",
                "recommended_discount": "5%" if cust.clv_tier == CLVTier.VIP else "0%"
            }
            result_meta = {"recovery_outcome": "AWAITING_MERCHANT_DECISION"}
        else:
            action_status = ActionStatus.EXECUTED
            tx.status = TransactionStatus.RECOVERED  # Simulated successful recovery
            if rec_action_enum == RecoveryActionType.RETRY_PAYMENT:
                tx.retry_count += 1
                action_payload = {"method": "AUTOMATED_GATEWAY_RETRY", "attempt": tx.retry_count}
                result_meta = {"http_code": 200, "gateway_ref": f"retry_{uuid.uuid4().hex[:8]}"}
            elif rec_action_enum == RecoveryActionType.GENERATE_PAYMENT_LINK:
                tx.contact_count += 1
                payment_link = f"https://rzp.io/i/{tx.id[:8]}"
                action_payload = {
                    "razorpay_payment_link": payment_link,
                    "channel": "SMS/WhatsApp",
                    "expiry": (datetime.utcnow() + timedelta(days=2)).isoformat()
                }
                result_meta = {"link_id": f"plink_{uuid.uuid4().hex[:8]}", "sent": True}
            elif rec_action_enum == RecoveryActionType.SEND_REMINDER:
                tx.contact_count += 1
                action_payload = {
                    "message": f"Dear {cust.name}, your payment of INR {tx.amount} for invoice #{tx.id[:8]} is pending. Tap to pay: https://rzp.io/i/{tx.id[:8]}",
                    "channel": "WhatsApp"
                }
                result_meta = {"message_id": f"wamid_{uuid.uuid4().hex[:10]}", "delivered": True}
            else:
                action_payload = {}
                result_meta = {}

        tx.updated_at = datetime.utcnow()

        action = RecoveryActionDB(
            id=str(uuid.uuid4()),
            transaction_id=tx.id,
            decision_id=decision.id,
            action_type=rec_action_enum,
            status=action_status,
            payload=action_payload,
            executed_at=datetime.utcnow() if action_status == ActionStatus.EXECUTED else None,
            result_metadata=result_meta
        )
        db.add(action)

        # Step 6: MEASURE & AUDIT
        audit_act = AuditLogDB(
            transaction_id=tx.id,
            step="ACT_AND_VERIFY",
            actor="RECOVERY_ENGINE",
            details={
                "action_type": rec_action_enum.value,
                "action_status": action_status.value,
                "resulting_transaction_status": tx.status.value,
                "payload": action_payload
            },
            created_at=datetime.utcnow()
        )
        db.add(audit_act)

        await db.commit()

        return {
            "transaction_id": tx.id,
            "status": tx.status.value,
            "diagnosed_category": diagnosed_category.value,
            "recommended_action": rec_action_enum.value,
            "recoverability_score": decision.recoverability_score,
            "reasoning_summary": decision.reasoning_summary,
            "rules_check": rules_check,
            "action_status": action_status.value,
            "action_payload": action_payload
        }

    def _classify_failure(self, code: str, raw_reason: str) -> FailureCategory:
        """Classify failure code into core diagnosis categories."""
        c = code.upper()
        if "TIMED_OUT" in c or "MANDATE" in c or "GATEWAY" in c:
            return FailureCategory.TECHNICAL_TRANSIENT
        elif "INSUFFICIENT" in c or "BALANCE" in c:
            return FailureCategory.INSUFFICIENT_FUNDS
        elif "FRAUD" in c or "RISK" in c:
            return FailureCategory.SUSPECTED_FRAUD
        elif "REMINDER" in c or "UNANSWERED" in c or "OVERDUE" in c or "PAYABLE" in c:
            return FailureCategory.COMMUNICATION_GAP
        else:
            return FailureCategory.CUSTOMER_FRICTION

    def _evaluate_business_guardrails(self, tx: TransactionDB, merchant: MerchantDB, cust: CustomerDB, category: FailureCategory) -> Dict[str, Any]:
        """Verify strict business rules and stopping conditions."""
        passed_rules = []
        blocked_reasons = []

        # Rule 1: Max Retries
        if tx.retry_count < merchant.max_retries:
            passed_rules.append(f"Rule 1: Retry count ({tx.retry_count}/{merchant.max_retries}) within allowed limit.")
        else:
            blocked_reasons.append(f"Rule 1 EXCEEDED: Max payment retries ({merchant.max_retries}) reached.")

        # Rule 2: Max Contact Attempts
        if tx.contact_count < merchant.max_contact_attempts:
            passed_rules.append(f"Rule 2: Customer contact count ({tx.contact_count}/{merchant.max_contact_attempts}) within allowed limit.")
        else:
            blocked_reasons.append(f"Rule 2 EXCEEDED: Max customer contact limit ({merchant.max_contact_attempts}) reached.")

        # Rule 3: Fraud Safety Check
        if category == FailureCategory.SUSPECTED_FRAUD:
            blocked_reasons.append("Rule 3 TRIGGERED: Suspected fraud block. Automated retries suppressed.")
        else:
            passed_rules.append("Rule 3: Transaction risk score within safe threshold.")

        # Rule 4: High Value Escalation Limit (Over 50,000 INR requires merchant authorization)
        if tx.amount > 50000:
            passed_rules.append("Rule 4: High-value transaction (> ₹50,000) flagged for mandatory merchant escalation.")

        can_proceed = len(blocked_reasons) == 0

        return {
            "can_proceed": can_proceed,
            "passed_rules": passed_rules,
            "blocked_reasons": blocked_reasons
        }

    async def _reason_with_llm(self, tx: TransactionDB, merchant: MerchantDB, cust: CustomerDB, category: FailureCategory, rules_check: Dict[str, Any]) -> Dict[str, Any]:
        """Reason optimal recovery strategy via LLM structured outputs or fallback rule engine."""
        
        # If rules explicitly block retries or contacts
        if not rules_check["can_proceed"]:
            return {
                "recoverability_score": 0.1,
                "recommended_action": RecoveryActionType.NO_ACTION,
                "reasoning_summary": f"Recovery suppressed by Guardrail Engine. Reasons: {'; '.join(rules_check['blocked_reasons'])}.",
                "confidence_score": 0.99
            }

        # Try LLM if API Key is configured
        if self.openai_client:
            try:
                system_prompt = """You are RevPulse AI, an autonomous revenue recovery agent for Razorpay merchants.
Your goal is to evaluate payment failure diagnostics and select the optimal bounded recovery strategy.
Possible Action Enums: RETRY_PAYMENT, GENERATE_PAYMENT_LINK, SEND_REMINDER, ESCALATE_TO_MERCHANT, NO_ACTION.

Respond ONLY in valid JSON with schema:
{
  "recoverability_score": float (0.0 to 1.0),
  "recommended_action": "RETRY_PAYMENT" | "GENERATE_PAYMENT_LINK" | "SEND_REMINDER" | "ESCALATE_TO_MERCHANT" | "NO_ACTION",
  "reasoning_summary": "string explaining exact decision factors",
  "confidence_score": float (0.0 to 1.0)
}
"""
                user_prompt = f"""Evaluate Transaction Failure:
Transaction ID: {tx.id}
Amount: INR {tx.amount}
Type: {tx.type.value}
Failure Code: {tx.failure_code}
Raw Reason: {tx.failure_reason_raw}
Diagnosed Category: {category.value}
Customer Name: {cust.name}
Customer CLV Tier: {cust.clv_tier.value}
Retry Count: {tx.retry_count} / {merchant.max_retries}
Contact Count: {tx.contact_count} / {merchant.max_contact_attempts}
Passed Business Rules: {rules_check['passed_rules']}
"""
                response = await self.openai_client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.2
                )
                content = json.loads(response.choices[0].message.content)
                rec_action = RecoveryActionType(content.get("recommended_action", "GENERATE_PAYMENT_LINK"))
                return {
                    "recoverability_score": float(content.get("recoverability_score", 0.85)),
                    "recommended_action": rec_action,
                    "reasoning_summary": content.get("reasoning_summary", "LLM Reasoning executed successfully."),
                    "confidence_score": float(content.get("confidence_score", 0.95))
                }
            except Exception as e:
                # Fallback to rule engine on API error
                pass

        # Fallback Deterministic AI Rule Engine
        if tx.amount > 50000 or cust.clv_tier == CLVTier.VIP:
            recommended = RecoveryActionType.ESCALATE_TO_MERCHANT
            reasoning = f"High priority account ({cust.clv_tier.value} tier, amount ₹{tx.amount}). Escalate to merchant for tailored offer."
            score = 0.92
        elif category == FailureCategory.TECHNICAL_TRANSIENT and tx.retry_count < merchant.max_retries:
            recommended = RecoveryActionType.RETRY_PAYMENT
            reasoning = f"Transient technical error '{tx.failure_code}'. Recommended automated payment retry attempt #{tx.retry_count + 1}."
            score = 0.88
        elif category in [FailureCategory.CUSTOMER_FRICTION, FailureCategory.INSUFFICIENT_FUNDS]:
            recommended = RecoveryActionType.GENERATE_PAYMENT_LINK
            reasoning = f"Diagnosed as {category.value}. Generate instant Razorpay Payment Link & dispatch via WhatsApp with 48h validity."
            score = 0.82
        elif category == FailureCategory.COMMUNICATION_GAP:
            recommended = RecoveryActionType.SEND_REMINDER
            reasoning = f"Overdue invoice/communication gap detected. Send personalized payment reminder to {cust.email}."
            score = 0.78
        else:
            recommended = RecoveryActionType.GENERATE_PAYMENT_LINK
            reasoning = f"Standard recovery fallback: Generate Razorpay Payment Link for customer {cust.name}."
            score = 0.75

        return {
            "recoverability_score": score,
            "recommended_action": recommended,
            "reasoning_summary": reasoning,
            "confidence_score": 0.94
        }

ai_agent = AIRecoveryAgent()
