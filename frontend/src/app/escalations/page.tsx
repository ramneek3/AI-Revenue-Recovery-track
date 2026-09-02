'use client';

import React, { useEffect, useState } from 'react';
import { EscalationItem } from '../../types';
import { fetchEscalations, approveEscalation, rejectEscalation } from '../../lib/api';
import { ShieldAlert, CheckCircle2, XCircle, RefreshCw, UserCheck, IndianRupee } from 'lucide-react';

export default function EscalationsPage() {
  const [items, setItems] = useState<EscalationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchEscalations();
      setItems(res.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (actionId: string) => {
    try {
      setProcessingId(actionId);
      await approveEscalation(actionId);
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (actionId: string) => {
    try {
      setProcessingId(actionId);
      await rejectEscalation(actionId);
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold font-heading text-white">Merchant Approval Portal</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
              Human-in-the-Loop Safeguards
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            High-value SaaS invoices (&gt; ₹50,000) and VIP enterprise accounts flagged for merchant sign-off.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 rounded-xl bg-card border border-border text-gray-400 hover:text-white"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Escalation Queue Cards */}
      {loading ? (
        <div className="py-16 text-center text-xs text-gray-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-razor-blue mb-2" />
          <span>Loading approval queue...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-gray-400 border border-border">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white font-heading">Escalation Inbox Clear</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
            All high-value or VIP account recovery actions have been reviewed or processed by the AI Agent.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item.action_id} className="glass-card rounded-2xl p-5 border border-purple-500/30 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">{item.customer_name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {item.clv_tier} TIER
                    </span>
                  </div>
                  <span className="font-bold font-heading text-lg text-emerald-400">
                    ₹{item.amount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="text-xs space-y-2 text-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Transaction ID:</span>
                    <span className="font-mono text-gray-200">#{item.transaction_id.slice(0, 8)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Failure Code:</span>
                    <span className="font-mono text-amber-400">{item.failure_code}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Recommended Action:</span>
                    <span className="font-semibold text-razor-blue">{item.action_type}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-900/80 border border-border mt-3 text-xs leading-relaxed">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">AI Reasoning Summary</span>
                    <p>{item.reasoning_summary}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-3 border-t border-border">
                <button
                  onClick={() => handleReject(item.action_id)}
                  disabled={processingId === item.action_id}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Suppress Action</span>
                </button>

                <button
                  onClick={() => handleApprove(item.action_id)}
                  disabled={processingId === item.action_id}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Strategy</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
