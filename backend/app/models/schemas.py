import enum
import uuid
from datetime import datetime
from typing import Optional, List, Any, Dict
from sqlalchemy import Column, String, Integer, Float, DateTime, Enum, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field, ConfigDict
from app.database import Base

# Enums
class TransactionType(str, enum.Enum):
    FAILED_PAYMENT = "FAILED_PAYMENT"
    SUBSCRIPTION_FAILURE = "SUBSCRIPTION_FAILURE"
    CHECKOUT_ABANDONMENT = "CHECKOUT_ABANDONMENT"
    INVOICE_OVERDUE = "INVOICE_OVERDUE"

class TransactionStatus(str, enum.Enum):
    AT_RISK = "AT_RISK"
    IN_RECOVERY = "IN_RECOVERY"
    RECOVERED = "RECOVERED"
    FAILED_PERMANENT = "FAILED_PERMANENT"
    ESCALATED = "ESCALATED"

class FailureCategory(str, enum.Enum):
    TECHNICAL_TRANSIENT = "TECHNICAL_TRANSIENT"
    CUSTOMER_FRICTION = "CUSTOMER_FRICTION"
    INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS"
    SUSPECTED_FRAUD = "SUSPECTED_FRAUD"
    COMMUNICATION_GAP = "COMMUNICATION_GAP"

class RecoveryActionType(str, enum.Enum):
    RETRY_PAYMENT = "RETRY_PAYMENT"
    GENERATE_PAYMENT_LINK = "GENERATE_PAYMENT_LINK"
    SEND_REMINDER = "SEND_REMINDER"
    ESCALATE_TO_MERCHANT = "ESCALATE_TO_MERCHANT"
    NO_ACTION = "NO_ACTION"

class ActionStatus(str, enum.Enum):
    PENDING = "PENDING"
    EXECUTED = "EXECUTED"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    REJECTED = "REJECTED"
    FAILED = "FAILED"

class CLVTier(str, enum.Enum):
    VIP = "VIP"
    REGULAR = "REGULAR"
    AT_RISK = "AT_RISK"

# Database Models
class MerchantDB(Base):
    __tablename__ = "merchants"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    max_retries = Column(Integer, default=2)
    max_contact_attempts = Column(Integer, default=3)
    created_at = Column(DateTime, default=datetime.utcnow)

    transactions = relationship("TransactionDB", back_populates="merchant")

class CustomerDB(Base):
    __tablename__ = "customers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    risk_score = Column(Float, default=0.1)
    clv_tier = Column(Enum(CLVTier), default=CLVTier.REGULAR)

    transactions = relationship("TransactionDB", back_populates="customer")

class TransactionDB(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(String, ForeignKey("merchants.id"), nullable=False)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    type = Column(Enum(TransactionType), nullable=False)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.AT_RISK)
    failure_code = Column(String, nullable=False)
    failure_reason_raw = Column(Text, nullable=False)
    retry_count = Column(Integer, default=0)
    contact_count = Column(Integer, default=0)
    payment_method = Column(String, default="UPI")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    merchant = relationship("MerchantDB", back_populates="transactions")
    customer = relationship("CustomerDB", back_populates="transactions")
    decisions = relationship("RecoveryDecisionDB", back_populates="transaction")
    actions = relationship("RecoveryActionDB", back_populates="transaction")
    audit_logs = relationship("AuditLogDB", back_populates="transaction")

class RecoveryDecisionDB(Base):
    __tablename__ = "recovery_decisions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = Column(String, ForeignKey("transactions.id"), nullable=False)
    diagnosed_category = Column(Enum(FailureCategory), nullable=False)
    recoverability_score = Column(Float, nullable=False)
    recommended_action = Column(Enum(RecoveryActionType), nullable=False)
    reasoning_summary = Column(Text, nullable=False)
    business_rules_passed = Column(JSON, default=list)
    confidence_score = Column(Float, default=0.9)
    created_at = Column(DateTime, default=datetime.utcnow)

    transaction = relationship("TransactionDB", back_populates="decisions")
    actions = relationship("RecoveryActionDB", back_populates="decision")

class RecoveryActionDB(Base):
    __tablename__ = "recovery_actions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = Column(String, ForeignKey("transactions.id"), nullable=False)
    decision_id = Column(String, ForeignKey("recovery_decisions.id"), nullable=False)
    action_type = Column(Enum(RecoveryActionType), nullable=False)
    status = Column(Enum(ActionStatus), default=ActionStatus.PENDING)
    payload = Column(JSON, default=dict)
    executed_at = Column(DateTime, nullable=True)
    result_metadata = Column(JSON, default=dict)

    transaction = relationship("TransactionDB", back_populates="actions")
    decision = relationship("RecoveryDecisionDB", back_populates="actions")

class AuditLogDB(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = Column(String, ForeignKey("transactions.id"), nullable=False)
    step = Column(String, nullable=False)  # DETECT, DIAGNOSE, DECIDE, ACT, VERIFY, MEASURE
    actor = Column(String, nullable=False)  # AI_AGENT, SYSTEM_RULE, MERCHANT_USER
    details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    transaction = relationship("TransactionDB", back_populates="audit_logs")

# Pydantic Schemas for API Serialization
class CustomerSchema(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    risk_score: float
    clv_tier: CLVTier

    model_config = ConfigDict(from_attributes=True)

class MerchantSchema(BaseModel):
    id: str
    name: str
    email: str
    max_retries: int
    max_contact_attempts: int

    model_config = ConfigDict(from_attributes=True)

class RecoveryDecisionSchema(BaseModel):
    id: str
    transaction_id: str
    diagnosed_category: FailureCategory
    recoverability_score: float
    recommended_action: RecoveryActionType
    reasoning_summary: str
    business_rules_passed: List[str]
    confidence_score: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class RecoveryActionSchema(BaseModel):
    id: str
    transaction_id: str
    decision_id: str
    action_type: RecoveryActionType
    status: ActionStatus
    payload: Dict[str, Any]
    executed_at: Optional[datetime] = None
    result_metadata: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)

class AuditLogSchema(BaseModel):
    id: str
    transaction_id: str
    step: str
    actor: str
    details: Dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TransactionSchema(BaseModel):
    id: str
    merchant_id: str
    customer_id: str
    amount: float
    currency: str
    type: TransactionType
    status: TransactionStatus
    failure_code: str
    failure_reason_raw: str
    retry_count: int
    contact_count: int
    payment_method: str
    created_at: datetime
    updated_at: datetime
    customer: Optional[CustomerSchema] = None
    decisions: List[RecoveryDecisionSchema] = []
    actions: List[RecoveryActionSchema] = []
    audit_logs: List[AuditLogSchema] = []

    model_config = ConfigDict(from_attributes=True)
