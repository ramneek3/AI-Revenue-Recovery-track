'use client';

import React, { useEffect, useState } from 'react';
import { MetricsSummary, Transaction } from '../types';
import { fetchMetricsSummary, fetchTransactions, runSingleRecovery } from '../lib/api';
import { MetricsCards } from '../components/metrics-cards';
import { RecoveryChart } from '../components/charts/recovery-chart';
import { ActionBreakdown } from '../components/charts/action-breakdown';
import { LiveAgentSimulator } from '../components/live-agent-simulator';
import { ReasoningModal } from '../components/reasoning-modal';
import { Zap, ShieldCheck, ArrowRight, Play, Eye } from 'lucide-react';
import Link from 'next/link';

export default function ExecutiveDashboard() {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [m, t] = await Promise.all([
        fetchMetricsSummary(),
        fetchTransactions({ page: 1, limit: 6, status: 'AT_RISK' })
      ]);
      setMetrics(m);
      setTransactions(t.items);
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunSingle = async (txId: string) => {
    try {
      setProcessingId(txId);
      await runSingleRecovery(txId);
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-razor-blue/20 via-indigo-900/40 to-razor-purple/20 border border-razor-blue/30 backdrop-blur-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-razor-blue/20 text-razor-blue border border-razor-blue/30 text-xs font-semibold uppercase tracking-wider mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>Autonomous Revenue Recovery Engine Active</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
            Protect & Recover Failed Payments <span className="text-transparent bg-clip-text bg-gradient-to-r from-razor-blue to-razor-purple">Autonomous AI Agent</span>
          </h1>
          <p className="mt-2 text-sm text-gray-300 leading-relaxed">
            RevPulse AI automatically detects failed Razorpay checkout sessions, expired subscriptions, UPI time-outs, and overdue SaaS invoices, diagnoses root causes, executes bounded recovery workflows, and maintains full explainability and auditability.
          </p>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <MetricsCards metrics={metrics} loading={loading} />

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecoveryChart metrics={metrics} />
        <ActionBreakdown metrics={metrics} />
      </div>

      {/* Flagship Feature: Live AI Agent Simulator */}
      <LiveAgentSimulator />

      {/* At-Risk Transactions Queue Preview */}
      <div className="glass-card rounded-2xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold font-heading text-white">Pending At-Risk Transactions Queue</h3>
            <p className="text-xs text-gray-400">Transactions awaiting automated AI agent recovery strategy</p>
          </div>
          <Link
            href="/transactions"
            className="flex items-center space-x-1 text-xs font-semibold text-razor-blue hover:underline"
          >
            <span>View All ({metrics?.total_transactions || 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-gray-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">Transaction ID</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Failure Code</th>
                <th className="py-3 px-3">CLV Tier</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No pending at-risk transactions found. Click &quot;Seed 1K Data&quot; to generate sample datasets.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-mono text-gray-300 font-medium">#{tx.id.slice(0, 8)}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{tx.customer?.name || 'Customer'}</div>
                      <div className="text-[10px] text-gray-400">{tx.customer?.email}</div>
                    </td>
                    <td className="py-3 px-3 font-bold text-white">₹{tx.amount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-800 text-gray-300 border border-gray-700">
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-amber-400 text-[11px]">{tx.failure_code}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        tx.customer?.clv_tier === 'VIP' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-gray-800 text-gray-300'
                      }`}>
                        {tx.customer?.clv_tier || 'REGULAR'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all text-[11px]"
                        title="Inspect Reasoning"
                      >
                        <Eye className="w-3.5 h-3.5 inline mr-1" />
                        Inspect
                      </button>

                      <button
                        onClick={() => handleRunSingle(tx.id)}
                        disabled={processingId === tx.id}
                        className="px-3 py-1 rounded bg-razor-blue hover:bg-razor-darkblue text-white font-semibold shadow transition-all text-[11px]"
                      >
                        {processingId === tx.id ? 'Recovering...' : 'Trigger AI'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Explainability Popover Modal */}
      <ReasoningModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />

    </div>
  );
}
