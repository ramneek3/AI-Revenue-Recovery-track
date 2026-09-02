'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, Zap, LayoutDashboard, Database, Activity, CheckCircle2, RefreshCw } from 'lucide-react';
import { seedDatabase, runBatchRecovery } from '../lib/api';

export function Navbar() {
  const pathname = usePathname();
  const [loadingSeed, setLoadingSeed] = useState(false);
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSeed = async () => {
    try {
      setLoadingSeed(true);
      const res = await seedDatabase(1000);
      showToast(`Database seeded with 1,000 synthetic records!`);
      window.location.reload();
    } catch (e: any) {
      showToast(`Failed: ${e.message}. Is FastAPI running on port 8000?`);
    } finally {
      setLoadingSeed(false);
    }
  };

  const handleBatchRun = async () => {
    try {
      setLoadingBatch(true);
      const res = await runBatchRecovery(20);
      showToast(res.message || `Processed ${res.processed_count} at-risk transactions!`);
      window.location.reload();
    } catch (e: any) {
      showToast(`Failed: ${e.message}. Is FastAPI running on port 8000?`);
    } finally {
      setLoadingBatch(false);
    }
  };

  const navItems = [
    { label: 'Executive Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'AI Agent Inspector', path: '/agent', icon: Zap },
    { label: 'Transactions', path: '/transactions', icon: Database },
    { label: 'Merchant Approvals', path: '/escalations', icon: ShieldAlert },
    { label: 'Audit Log', path: '/audit', icon: Activity },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#0b0f19]/90 backdrop-blur-md border-b border-border/80 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Brand Logo & Razorpay Badge */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-razor-blue to-razor-purple flex items-center justify-center shadow-lg shadow-razor-blue/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold font-heading text-white tracking-tight">RevPulse<span className="text-razor-blue">.AI</span></span>
                <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-razor-blue/20 text-razor-blue border border-razor-blue/30 uppercase">
                  Razorpay Buildathon
                </span>
              </div>
              <p className="text-xs text-gray-400">Autonomous Bounded Revenue Recovery Agent</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 bg-card/60 p-1.5 rounded-xl border border-border">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-razor-blue text-white shadow-md shadow-razor-blue/30 font-semibold'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Action Trigger Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSeed}
              disabled={loadingSeed}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-card hover:bg-card/80 border border-border text-gray-300 hover:text-white transition-all"
              title="Seed 1000 Realistic Indian Transaction Lifecycles"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-razor-amber ${loadingSeed ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Seed 1K Data</span>
            </button>

            <button
              onClick={handleBatchRun}
              disabled={loadingBatch}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-razor-emerald to-teal-600 text-white shadow-md shadow-razor-emerald/20 hover:opacity-90 transition-all"
            >
              <Zap className={`w-3.5 h-3.5 ${loadingBatch ? 'animate-pulse' : ''}`} />
              <span>Run AI Agent</span>
            </button>
          </div>

        </div>
      </header>

      {/* Global Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl bg-gray-900/95 text-white text-xs border border-razor-blue shadow-2xl animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-razor-emerald" />
          <span>{toastMsg}</span>
        </div>
      )}
    </>
  );
}
