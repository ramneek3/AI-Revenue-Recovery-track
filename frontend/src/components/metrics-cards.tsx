'use client';

import React from 'react';
import { MetricsSummary } from '../types';
import { IndianRupee, ShieldCheck, AlertTriangle, TrendingUp, ArrowUpRight, Zap } from 'lucide-react';

interface MetricsCardsProps {
  metrics: MetricsSummary | null;
  loading: boolean;
}

export function MetricsCards({ metrics, loading }: MetricsCardsProps) {
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const cards = [
    {
      title: 'Revenue at Risk',
      value: metrics ? formatINR(metrics.revenue_at_risk) : '₹0',
      subtitle: metrics ? `${metrics.total_transactions} transactions analyzed` : 'Calculating...',
      icon: AlertTriangle,
      color: 'from-amber-500/20 to-rose-500/10',
      borderColor: 'border-amber-500/30',
      iconColor: 'text-amber-400',
      badge: 'At Risk'
    },
    {
      title: 'Net Recovered Revenue',
      value: metrics ? formatINR(metrics.revenue_recovered) : '₹0',
      subtitle: metrics ? `${metrics.recovered_count} successful recoveries` : 'Calculating...',
      icon: IndianRupee,
      color: 'from-emerald-500/20 to-teal-500/10',
      borderColor: 'border-emerald-500/40',
      iconColor: 'text-emerald-400',
      badge: '+34.2% MoM'
    },
    {
      title: 'Recovery Success Rate',
      value: metrics ? `${metrics.recovery_rate}%` : '0%',
      subtitle: 'Bounded LLM + Automated Retries',
      icon: ShieldCheck,
      color: 'from-sky-500/20 to-blue-500/10',
      borderColor: 'border-sky-500/40',
      iconColor: 'text-sky-400',
      badge: 'Autonomous'
    },
    {
      title: 'Pending Merchant Approvals',
      value: metrics ? metrics.escalations_count.toString() : '0',
      subtitle: 'High Value / VIP Account Queue',
      icon: Zap,
      color: 'from-purple-500/20 to-pink-500/10',
      borderColor: 'border-purple-500/40',
      iconColor: 'text-purple-400',
      badge: 'Human in Loop'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${card.color} border ${card.borderColor} backdrop-blur-md glass-card-hover transition-all`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{card.title}</span>
              <div className={`p-2 rounded-xl bg-gray-900/60 border border-white/10 ${card.iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-3">
              {loading ? (
                <div className="h-8 w-28 bg-gray-800 animate-pulse rounded-lg" />
              ) : (
                <h3 className="text-2xl font-bold font-heading text-white tracking-tight">{card.value}</h3>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-gray-400">{card.subtitle}</span>
              <span className={`px-2 py-0.5 rounded-full font-medium text-[10px] bg-white/5 border border-white/10 ${card.iconColor}`}>
                {card.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
