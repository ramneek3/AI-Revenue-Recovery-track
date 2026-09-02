import { MetricsSummary, Transaction, EscalationItem } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export async function fetchMetricsSummary(): Promise<MetricsSummary> {
  const res = await fetch(`${API_BASE}/metrics/summary`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch metrics summary');
  return res.json();
}

export async function fetchTransactions(params: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  search?: string;
}): Promise<{ items: Transaction[]; total: number; page: number; total_pages: number }> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());
  if (params.status && params.status !== 'ALL') query.append('status', params.status);
  if (params.type && params.type !== 'ALL') query.append('type', params.type);
  if (params.search) query.append('search', params.search);

  const res = await fetch(`${API_BASE}/transactions?${query.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function fetchTransactionById(id: string): Promise<Transaction> {
  const res = await fetch(`${API_BASE}/transactions/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch transaction details');
  return res.json();
}

export async function runSingleRecovery(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/recovery/single-run/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to execute AI recovery run');
  return res.json();
}

export async function runBatchRecovery(limit: number = 20): Promise<any> {
  const res = await fetch(`${API_BASE}/recovery/batch-run?limit=${limit}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to execute batch AI recovery');
  return res.json();
}

export async function fetchEscalations(): Promise<{ items: EscalationItem[]; count: number }> {
  const res = await fetch(`${API_BASE}/escalations`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch escalations');
  return res.json();
}

export async function approveEscalation(actionId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/escalations/${actionId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to approve escalation');
  return res.json();
}

export async function rejectEscalation(actionId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/escalations/${actionId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to reject escalation');
  return res.json();
}

export async function seedDatabase(count: number = 1000): Promise<any> {
  const res = await fetch(`${API_BASE}/seed?count=${count}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to seed database');
  return res.json();
}
