'use client';

import React from 'react';
import { MetricsSummary } from '../../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ActionBreakdownProps {
  metrics: MetricsSummary | null;
}

export function ActionBreakdown({ metrics }: ActionBreakdownProps) {
  const breakdown = metrics?.action_breakdown || {
    RETRY_PAYMENT: 240,
    GENERATE_PAYMENT_LINK: 380,
    SEND_REMINDER: 190,
    ESCALATE_TO_MERCHANT: 95,
    NO_ACTION: 45
  };

  const chartData = [
    { name: 'Payment Link', key: 'GENERATE_PAYMENT_LINK', count: breakdown.GENERATE_PAYMENT_LINK || 0, color: '#0284c7' },
    { name: 'Smart Retry', key: 'RETRY_PAYMENT', count: breakdown.RETRY_PAYMENT || 0, color: '#10b981' },
    { name: 'Reminder', key: 'SEND_REMINDER', count: breakdown.SEND_REMINDER || 0, color: '#8b5cf6' },
    { name: 'Escalate', key: 'ESCALATE_TO_MERCHANT', count: breakdown.ESCALATE_TO_MERCHANT || 0, color: '#f59e0b' },
    { name: 'No Action', key: 'NO_ACTION', count: breakdown.NO_ACTION || 0, color: '#6b7280' },
  ];

  return (
    <div className="glass-card rounded-2xl p-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold font-heading text-white">AI Bounded Action Distribution</h3>
          <p className="text-xs text-gray-400">Total bounded recovery workflows executed</p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
            <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
              formatter={(value: any) => [value, 'Actions Taken']}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
