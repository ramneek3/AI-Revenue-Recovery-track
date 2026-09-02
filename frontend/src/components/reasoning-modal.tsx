'use client';

import React from 'react';
import { Transaction } from '../types';
import { X, CheckCircle2, ShieldAlert, Cpu, Zap, Activity } from 'lucide-react';

interface ReasoningModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export function ReasoningModal({ transaction, onClose }: ReasoningModalProps) {
  if (!transaction) return null;

  const decision = transaction.decisions?.[0];
  const action = transaction.actions?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold font-heading text-white">AI Decision & Audit Trail</h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                #{transaction.id.slice(0, 8)}
              </span>
            </div>
            <p className="text-xs text-gray-400">Customer: {transaction.customer?.name} ({transaction.customer?.email})</p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 p-3 rounded-xl bg-gray-900/60 border border-border text-xs">
          <div>
            <span className="text-gray-500 block text-[10px] uppercase">Amount</span>
            <span className="font-bold text-white">₹{transaction.amount.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px] uppercase">Failure Code</span>
            <span className="font-mono text-amber-400 text-[11px]">{transaction.failure_code}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px] uppercase">Current Status</span>
            <span className={`font-semibold ${transaction.status === 'RECOVERED' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {transaction.status}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px] uppercase">CLV Tier</span>
            <span className="font-medium text-purple-400">{transaction.customer?.clv_tier || 'REGULAR'}</span>
          </div>
        </div>

        {/* AI Decision Analysis */}
        {decision ? (
          <div className="space-y-4 my-4">
            <div className="p-4 rounded-xl bg-gray-900/80 border border-razor-blue/30 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-razor-blue uppercase text-[10px] tracking-wider">AI Recommendation</span>
                <span className="font-mono text-emerald-400 text-[10px]">
                  Confidence: {((decision.confidence_score || 0.95) * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-gray-200 leading-relaxed font-sans">{decision.reasoning_summary}</p>
            </div>

            {/* Business Rules Verified */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">Verified Business Guardrails</span>
              <div className="space-y-1.5">
                {decision.business_rules_passed?.map((rule, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-xs text-gray-300 bg-gray-900/40 p-2 rounded-lg border border-border">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Output */}
            {action && (
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">Executed Bounded Action Payload</span>
                <pre className="p-3 rounded-xl bg-black/60 font-mono text-[11px] text-razor-blue overflow-x-auto border border-border">
                  {JSON.stringify(action.payload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-gray-500">
            No recovery decision generated yet for this transaction.
          </div>
        )}

        {/* Audit Log Timeline */}
        {transaction.audit_logs && transaction.audit_logs.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-3">Audit Log Timeline</span>
            <div className="space-y-2">
              {transaction.audit_logs.map((log) => (
                <div key={log.id} className="flex items-start space-x-3 p-2.5 rounded-lg bg-gray-900/40 border border-border text-xs">
                  <Activity className="w-3.5 h-3.5 text-razor-blue mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{log.step} ({log.actor})</span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">{JSON.stringify(log.details)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
