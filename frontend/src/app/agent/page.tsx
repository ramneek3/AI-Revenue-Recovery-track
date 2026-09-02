'use client';

import React from 'react';
import { LiveAgentSimulator } from '../../components/live-agent-simulator';
import { Zap, ShieldCheck, Cpu, ArrowRight, AlertTriangle, Layers } from 'lucide-react';

export default function AgentPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold font-heading text-white">AI Agent Command & Intelligence Center</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-razor-blue/20 text-razor-blue border border-razor-blue/30 uppercase">
            Autonomous Engine
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Inspect, tune, and test the 6-Step Autonomous AI Recovery Workflow with real-time explainability logs.
        </p>
      </div>

      {/* Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl glass-card border border-border">
          <div className="flex items-center space-x-2 text-razor-blue mb-2">
            <Cpu className="w-5 h-5" />
            <h3 className="font-bold text-sm text-white">Structured Output Reasoning</h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Integrates OpenAI GPT-4o with Pydantic JSON schema constraints ensuring zero hallucination on recovery actions.
          </p>
        </div>

        <div className="p-4 rounded-xl glass-card border border-border">
          <div className="flex items-center space-x-2 text-razor-emerald mb-2">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-bold text-sm text-white">Deterministic Guardrails</h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Strict business stopping rules (max retries = 2, max contact attempts = 3, fraud risk blocks) are hard-enforced.
          </p>
        </div>

        <div className="p-4 rounded-xl glass-card border border-border">
          <div className="flex items-center space-x-2 text-razor-purple mb-2">
            <Layers className="w-5 h-5" />
            <h3 className="font-bold text-sm text-white">Human-in-the-Loop Safeguards</h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            High-value enterprise transactions (&gt; ₹50,000) automatically route to the Merchant Approval Portal.
          </p>
        </div>
      </div>

      {/* Interactive Simulator */}
      <LiveAgentSimulator />
    </div>
  );
}
