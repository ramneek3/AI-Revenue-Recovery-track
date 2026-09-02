'use client';

import React from 'react';
import { MetricsSummary } from '../../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface RecoveryChartProps {
  metrics: MetricsSummary | null;
}

export function RecoveryChart({ metrics }: RecoveryChartProps) {
  const data = metrics?.recovery_trend || [
    { day: 'Day 1', recovered: 12000, at_risk: 45000 },
    { day: 'Day 2', recovered: 24000, at_risk: 38000 },
    { day: 'Day 3', recovered: 35000, at_risk: 32000 },
    { day: 'Day 4', recovered: 48000, at_risk: 28000 },
    { day: 'Day 5', recovered: 62000, at_risk: 22000 },
    { day: 'Day 6', recovered: 78000, at_risk: 18000 },
    { day: 'Day 7', recovered: 95000, at_risk: 14000 },
  ];

  return (
    <div className="glass-card rounded-2xl p-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold font-heading text-white">Revenue Recovery Trajectory</h3>
          <p className="text-xs text-gray-400">Comparison of Revenue at Risk vs Net Recovered (₹)</p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="text-gray-300">Recovered</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span className="text-gray-300">At Risk</span>
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorAtRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="day" stroke="#9ca3af" fontSize={11} tickLine={false} />
            <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
              formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']}
            />
            <Area type="monotone" dataKey="recovered" name="Recovered Revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRecovered)" />
            <Area type="monotone" dataKey="at_risk" name="Revenue at Risk" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorAtRisk)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
