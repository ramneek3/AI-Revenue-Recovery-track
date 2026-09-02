'use client';

import React, { useState } from 'react';
import { Transaction } from '../types';
import { runSingleRecovery } from '../lib/api';
import { Zap, CheckCircle2, ShieldAlert, Cpu, Eye, ArrowRight, RefreshCw, FileText, Check, AlertCircle } from 'lucide-react';

interface LiveAgentSimulatorProps {
  initialTransaction?: Transaction | null;
}

export function LiveAgentSimulator({ initialTransaction }: LiveAgentSimulatorProps) {
  const [selectedTxId, setSelectedTxId] = useState<string>(initialTransaction?.id || 'tx_demo_001');
  const [txAmount, setTxAmount] = useState<number>(initialTransaction?.amount || 14999);
  const [txType, setTxType] = useState<string>(initialTransaction?.type || 'FAILED_PAYMENT');
  const [failureCode, setFailureCode] = useState<string>(initialTransaction?.failure_code || 'BAD_REQUEST_PAYMENT_TIMED_OUT');
  const [customerName, setCustomerName] = useState<string>(initialTransaction?.customer?.name || 'Rohan Sharma');
  const [customerTier, setCustomerTier] = useState<string>(initialTransaction?.customer?.clv_tier || 'VIP');

  const [simulating, setSimulating] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [result, setResult] = useState<any | null>(null);

  const steps = [
    { num: 1, label: 'DETECT', desc: 'Webhook listener ingests failure payload', icon: Eye },
    { num: 2, label: 'DIAGNOSE', desc: 'Classifies root cause & error code', icon: Cpu },
    { num: 3, label: 'DECIDE', desc: 'LLM reasoning & business rule check', icon: Zap },
    { num: 4, label: 'ACT', desc: 'Executes bounded tool action', icon: FileText },
    { num: 5, label: 'VERIFY', desc: 'Gateway callback status reconciliation', icon: CheckCircle2 },
    { num: 6, label: 'MEASURE', desc: 'Calculates recovered revenue & logs audit', icon: CheckCircle2 },
  ];

  const runSimulation = async () => {
    setSimulating(true);
    setResult(null);
    setActiveStep(1);

    try {
      // Step-by-step visual animation delay
      await new Promise((r) => setTimeout(r, 600));
      setActiveStep(2);
      await new Promise((r) => setTimeout(r, 700));
      setActiveStep(3);

      let res;
      if (initialTransaction?.id) {
        res = await runSingleRecovery(initialTransaction.id);
      } else {
        // Mock simulated run response for custom form inputs
        await new Promise((r) => setTimeout(r, 800));
        res = {
          transaction_id: selectedTxId,
          status: customerTier === 'VIP' || txAmount > 50000 ? 'ESCALATED' : 'RECOVERED',
          diagnosed_category: failureCode.includes('TIMED_OUT') ? 'TECHNICAL_TRANSIENT' : 'CUSTOMER_FRICTION',
          recommended_action: customerTier === 'VIP' || txAmount > 50000 ? 'ESCALATE_TO_MERCHANT' : (failureCode.includes('TIMED_OUT') ? 'RETRY_PAYMENT' : 'GENERATE_PAYMENT_LINK'),
          recoverability_score: 0.92,
          reasoning_summary: `Autonomous AI Diagnosis: Classified failure '${failureCode}' for customer ${customerName} (${customerTier} tier). Evaluated business rules: Max retries <= 2 (PASSED). Selected optimal bounded strategy.`,
          rules_check: {
            can_proceed: true,
            passed_rules: [
              'Rule 1: Retry count (0/2) within allowed limit.',
              'Rule 2: Contact attempt limit within cooling-off threshold.',
              'Rule 3: Amount risk threshold verified.'
            ],
            blocked_reasons: []
          },
          action_status: customerTier === 'VIP' || txAmount > 50000 ? 'AWAITING_APPROVAL' : 'EXECUTED',
          action_payload: {
            razorpay_payment_link: `https://rzp.io/i/${selectedTxId.slice(0, 8)}`,
            channel: 'WhatsApp/SMS',
            expiry_hours: 48
          }
        };
      }

      setActiveStep(4);
      await new Promise((r) => setTimeout(r, 600));
      setActiveStep(5);
      await new Promise((r) => setTimeout(r, 500));
      setActiveStep(6);

      setResult(res);
    } catch (e: any) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-border">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold font-heading text-white">Autonomous AI Agent Live Inspector</h2>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-razor-blue/20 text-razor-blue border border-razor-blue/30 uppercase">
              Real-time 6-Step Engine
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Simulate payment failure ingestion and watch AI reasoning, business guardrails, and tool execution in real-time.
          </p>
        </div>

        <button
          onClick={runSimulation}
          disabled={simulating}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-razor-blue via-indigo-600 to-razor-purple text-white shadow-lg shadow-razor-blue/30 hover:opacity-95 transition-all"
        >
          <Zap className={`w-4 h-4 ${simulating ? 'animate-spin' : ''}`} />
          <span>{simulating ? 'Executing Agent Engine...' : 'Run Live Simulation'}</span>
        </button>
      </div>

      {/* Inputs / Preset Configuration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 my-5 p-4 rounded-xl bg-gray-900/60 border border-border text-xs">
        <div>
          <label className="block font-medium text-gray-400 mb-1">Customer Name</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-razor-blue"
          />
        </div>

        <div>
          <label className="block font-medium text-gray-400 mb-1">CLV Customer Tier</label>
          <select
            value={customerTier}
            onChange={(e) => setCustomerTier(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-razor-blue"
          >
            <option value="VIP">VIP (Escalation Priority)</option>
            <option value="REGULAR">REGULAR</option>
            <option value="AT_RISK">AT_RISK</option>
          </select>
        </div>

        <div>
          <label className="block font-medium text-gray-400 mb-1">Amount (INR)</label>
          <input
            type="number"
            value={txAmount}
            onChange={(e) => setTxAmount(Number(e.target.value))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-razor-blue"
          />
        </div>

        <div>
          <label className="block font-medium text-gray-400 mb-1">Failure Code</label>
          <select
            value={failureCode}
            onChange={(e) => setFailureCode(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-razor-blue"
          >
            <option value="BAD_REQUEST_PAYMENT_TIMED_OUT">UPI Gateway Timeout</option>
            <option value="INSUFFICIENT_FUNDS">Insufficient Account Balance</option>
            <option value="EXPIRED_CARD">Expired Saved Card</option>
            <option value="SUSPECTED_FRAUD_BLOCK">Suspected Fraud Risk Block</option>
            <option value="PAYMENT_REMINDER_UNANSWERED">14D Overdue Invoice</option>
          </select>
        </div>

        <div>
          <label className="block font-medium text-gray-400 mb-1">Transaction Type</label>
          <select
            value={txType}
            onChange={(e) => setTxType(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-razor-blue"
          >
            <option value="FAILED_PAYMENT">FAILED_PAYMENT</option>
            <option value="SUBSCRIPTION_FAILURE">SUBSCRIPTION_FAILURE</option>
            <option value="CHECKOUT_ABANDONMENT">CHECKOUT_ABANDONMENT</option>
            <option value="INVOICE_OVERDUE">INVOICE_OVERDUE</option>
          </select>
        </div>
      </div>

      {/* 6-Step Visual Timeline Stepper */}
      <div className="my-6">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">6-Step Execution Lifecycle</h4>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {steps.map((step) => {
            const Icon = step.icon;
            const isDone = activeStep > step.num || (result && activeStep === 6);
            const isCurrent = activeStep === step.num && simulating;
            return (
              <div
                key={step.num}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isDone
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400'
                    : isCurrent
                    ? 'bg-razor-blue/20 border-razor-blue text-white animate-pulse'
                    : 'bg-gray-900/40 border-border text-gray-500'
                }`}
              >
                <div className="flex justify-center mb-1.5">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Icon className={`w-5 h-5 ${isCurrent ? 'text-razor-blue' : 'text-gray-500'}`} />
                  )}
                </div>
                <div className="text-xs font-bold font-heading">{step.num}. {step.label}</div>
                <div className="text-[10px] text-gray-400 mt-1 line-clamp-1">{step.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Explainability Card & Result Details */}
      {result && (
        <div className="mt-6 p-5 rounded-2xl bg-gray-900/90 border border-razor-blue/30 text-xs text-gray-300 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-sm">AI Agent Decision Matrix</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                result.status === 'RECOVERED'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : result.status === 'ESCALATED'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              }`}>
                Outcome: {result.status}
              </span>
            </div>

            <div className="text-gray-400 font-mono text-[11px]">
              Confidence: <span className="text-razor-emerald font-bold">{(result.recoverability_score * 100).toFixed(0)}%</span>
            </div>
          </div>

          {/* Reasoning Summary */}
          <div>
            <span className="font-semibold text-gray-400 uppercase tracking-wider text-[10px] block mb-1">Reasoning & Explainability</span>
            <p className="p-3 rounded-xl bg-black/40 border border-white/5 font-sans leading-relaxed text-gray-200">
              {result.reasoning_summary}
            </p>
          </div>

          {/* Business Rules Guardrail Checklist */}
          <div>
            <span className="font-semibold text-gray-400 uppercase tracking-wider text-[10px] block mb-1">Business Guardrail Checklist</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {result.rules_check?.passed_rules.map((rule: string, idx: number) => (
                <div key={idx} className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{rule}</span>
                </div>
              ))}
              {result.rules_check?.blocked_reasons.map((rule: string, idx: number) => (
                <div key={idx} className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-rose-950/20 border border-rose-500/20 text-rose-300">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bounded Tool Executed Payload */}
          <div>
            <span className="font-semibold text-gray-400 uppercase tracking-wider text-[10px] block mb-1">Executed Action Payload (Razorpay Integration)</span>
            <pre className="p-3 rounded-xl bg-black/60 font-mono text-[11px] text-razor-blue overflow-x-auto border border-white/5">
              {JSON.stringify({
                action_type: result.recommended_action,
                action_status: result.action_status,
                payload: result.action_payload
              }, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
