import { MetricsSummary, Transaction, EscalationItem } from '../types';

const API_BASE = '/api/v1';

async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = `${API_BASE}${endpoint}`;

  try {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      throw new Error(data.detail || `Server error (Status ${res.status})`);
    }
    
    return data;
  } catch (err: any) {
    throw new Error(err.message || 'Failed to connect to backend server');
  }
}

export async function fetchMetricsSummary(): Promise<MetricsSummary> {
  return apiFetch('/metrics/summary', { cache: 'no-store' });
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

  return apiFetch(`/transactions?${query.toString()}`, { cache: 'no-store' });
}

export async function fetchTransactionById(id: string): Promise<Transaction> {
  return apiFetch(`/transactions/${id}`, { cache: 'no-store' });
}

export async function runSingleRecovery(id: string): Promise<any> {
  return apiFetch(`/recovery/single-run/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function runBatchRecovery(limit: number = 20): Promise<any> {
  return apiFetch(`/recovery/batch-run?limit=${limit}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function fetchEscalations(): Promise<{ items: EscalationItem[]; count: number }> {
  return apiFetch('/escalations', { cache: 'no-store' });
}

export async function approveEscalation(actionId: string): Promise<any> {
  return apiFetch(`/escalations/${actionId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function rejectEscalation(actionId: string): Promise<any> {
  return apiFetch(`/escalations/${actionId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function seedDatabase(count: number = 1000): Promise<any> {
  return apiFetch(`/seed?count=${count}&force=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
}
