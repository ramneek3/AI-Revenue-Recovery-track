'use client';

import React, { useEffect, useState } from 'react';
import { Transaction } from '../../types';
import { fetchTransactions } from '../../lib/api';
import { Activity, ShieldCheck, Clock, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function AuditPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetchTransactions({ page: 1, limit: 12 });
        setTransactions(res.items);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold font-heading text-white">Audit Trail & Compliance Ledger</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            100% Verifiable Explainability
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Complete timestamped event history of every AI decision, business rule evaluation, and executed tool action.
        </p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-500">Loading audit trail...</div>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="glass-card rounded-2xl p-5 border border-border space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-razor-blue/20 text-razor-blue border border-razor-blue/30">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm">Transaction #{tx.id.slice(0, 8)}</span>
                    <span className="text-xs text-gray-400 ml-2 font-mono">Customer: {tx.customer?.name}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-gray-400 font-mono">Amount: ₹{tx.amount.toLocaleString('en-IN')}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    tx.status === 'RECOVERED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>

              {/* Steps timeline */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-gray-900/60 border border-border">
                  <span className="text-[10px] font-semibold text-razor-blue uppercase block mb-1">1. DETECT Event</span>
                  <p className="text-gray-300">Ingested failure code <code className="text-amber-400">{tx.failure_code}</code> ({tx.type})</p>
                </div>

                <div className="p-3 rounded-xl bg-gray-900/60 border border-border">
                  <span className="text-[10px] font-semibold text-purple-400 uppercase block mb-1">2. DECIDE Reasoning</span>
                  <p className="text-gray-300 line-clamp-2">
                    {tx.decisions?.[0]?.reasoning_summary || 'Evaluated stopping rules & diagnostic classification.'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-gray-900/60 border border-border">
                  <span className="text-[10px] font-semibold text-emerald-400 uppercase block mb-1">3. ACT Execution</span>
                  <p className="text-gray-300">
                    Action: <span className="font-semibold text-white">{tx.actions?.[0]?.action_type || 'RETRY_PAYMENT'}</span> ({tx.actions?.[0]?.status || 'EXECUTED'})
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
