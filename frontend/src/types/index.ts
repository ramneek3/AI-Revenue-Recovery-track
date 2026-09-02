export type TransactionType = 'FAILED_PAYMENT' | 'SUBSCRIPTION_FAILURE' | 'CHECKOUT_ABANDONMENT' | 'INVOICE_OVERDUE';
export type TransactionStatus = 'AT_RISK' | 'IN_RECOVERY' | 'RECOVERED' | 'FAILED_PERMANENT' | 'ESCALATED';
export type FailureCategory = 'TECHNICAL_TRANSIENT' | 'CUSTOMER_FRICTION' | 'INSUFFICIENT_FUNDS' | 'SUSPECTED_FRAUD' | 'COMMUNICATION_GAP';
export type RecoveryActionType = 'RETRY_PAYMENT' | 'GENERATE_PAYMENT_LINK' | 'SEND_REMINDER' | 'ESCALATE_TO_MERCHANT' | 'NO_ACTION';
export type ActionStatus = 'PENDING' | 'EXECUTED' | 'AWAITING_APPROVAL' | 'REJECTED' | 'FAILED';
export type CLVTier = 'VIP' | 'REGULAR' | 'AT_RISK';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  risk_score: number;
  clv_tier: CLVTier;
}

export interface Merchant {
  id: string;
  name: string;
  email: string;
  max_retries: number;
  max_contact_attempts: number;
}

export interface RecoveryDecision {
  id: string;
  transaction_id: string;
  diagnosed_category: FailureCategory;
  recoverability_score: number;
  recommended_action: RecoveryActionType;
  reasoning_summary: string;
  business_rules_passed: string[];
  confidence_score: number;
  created_at: string;
}

export interface RecoveryAction {
  id: string;
  transaction_id: string;
  decision_id: string;
  action_type: RecoveryActionType;
  status: ActionStatus;
  payload: Record<string, any>;
  executed_at?: string;
  result_metadata: Record<string, any>;
}

export interface AuditLog {
  id: string;
  transaction_id: string;
  step: string;
  actor: string;
  details: Record<string, any>;
  created_at: string;
}

export interface Transaction {
  id: string;
  merchant_id: string;
  customer_id: string;
  amount: number;
  currency: string;
  type: TransactionType;
  status: TransactionStatus;
  failure_code: string;
  failure_reason_raw: string;
  retry_count: number;
  contact_count: number;
  payment_method: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  merchant?: Merchant;
  decisions?: RecoveryDecision[];
  actions?: RecoveryAction[];
  audit_logs?: AuditLog[];
}

export interface MetricsSummary {
  total_transactions: number;
  revenue_at_risk: number;
  revenue_recovered: number;
  recovery_rate: number;
  recovered_count: number;
  escalations_count: number;
  action_breakdown: Record<string, number>;
  category_breakdown: Record<string, number>;
  recovery_trend: Array<{ day: string; recovered: number; at_risk: number }>;
}

export interface EscalationItem {
  action_id: string;
  transaction_id: string;
  customer_name: string;
  customer_email: string;
  clv_tier: string;
  amount: number;
  failure_code: string;
  reasoning_summary: string;
  action_type: string;
  status: string;
  created_at: string;
}
