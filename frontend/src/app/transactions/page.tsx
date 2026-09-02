'use client';

import React, { useEffect, useState } from 'react';
import { Transaction, TransactionStatus, TransactionType } from '../../types';
import { fetchTransactions, runSingleRecovery } from '../../lib/api';
import { ReasoningModal } from '../../components/reasoning-modal';
import { Search, Filter, Eye, Zap, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

export default function TransactionsPage() {
  const [items, setItems] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchTransactions({
        page,
        limit: 15,
        status: statusFilter,
        type: typeFilter,
        search: searchQuery
      });
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e) {
      console.error('Failed to load transactions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleTriggerSingle = async (id: string) => {
    try {
      setRunningId(id);
      await runSingleRecovery(id);
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-white">Transactions Data Ledger</h1>
          <p className="text-xs text-gray-400">Total {total} transactions recorded in synthetic engine</p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ID, failure code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-gray-900 border border-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-razor-blue w-64"
            />
          </div>
          <button type="submit" className="px-3 py-1.5 rounded-xl bg-gray-800 text-xs font-semibold text-white hover:bg-gray-700">
            Search
          </button>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border text-xs">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-razor-blue" />
          <span className="font-semibold text-gray-300 uppercase text-[10px]">Status Filter:</span>
          {['ALL', 'AT_RISK', 'IN_RECOVERY', 'RECOVERED', 'ESCALATED', 'FAILED_PERMANENT'].map((st) => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setPage(1); }}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === st
                  ? 'bg-razor-blue text-white font-semibold'
                  : 'bg-gray-900 text-gray-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <span className="font-semibold text-gray-300 uppercase text-[10px]">Type Filter:</span>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-border text-gray-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="FAILED_PAYMENT">FAILED_PAYMENT</option>
            <option value="SUBSCRIPTION_FAILURE">SUBSCRIPTION_FAILURE</option>
            <option value="CHECKOUT_ABANDONMENT">CHECKOUT_ABANDONMENT</option>
            <option value="INVOICE_OVERDUE">INVOICE_OVERDUE</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-gray-900/80 text-gray-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Failure Code</th>
                <th className="py-3 px-4">CLV Tier</th>
                <th className="py-3 px-4">Retries</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-razor-blue mb-2" />
                    <span>Loading transaction ledger...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                items.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-mono text-gray-300 font-medium">#{tx.id.slice(0, 8)}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{tx.customer?.name || 'Unknown'}</div>
                      <div className="text-[10px] text-gray-400">{tx.customer?.email}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">₹{tx.amount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        tx.status === 'RECOVERED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        tx.status === 'AT_RISK' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                        tx.status === 'ESCALATED' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                        'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-400 text-[11px]">{tx.failure_code}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        tx.customer?.clv_tier === 'VIP' ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-800 text-gray-400'
                      }`}>
                        {tx.customer?.clv_tier || 'REGULAR'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-400">{tx.retry_count}/2</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all text-[11px]"
                      >
                        <Eye className="w-3.5 h-3.5 inline mr-1" />
                        Details
                      </button>

                      {tx.status === 'AT_RISK' && (
                        <button
                          onClick={() => handleTriggerSingle(tx.id)}
                          disabled={runningId === tx.id}
                          className="px-3 py-1 rounded bg-razor-blue hover:bg-razor-darkblue text-white font-semibold shadow transition-all text-[11px]"
                        >
                          {runningId === tx.id ? 'Running...' : 'Run AI'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-gray-900/60 text-xs">
          <span className="text-gray-400">
            Showing Page <span className="font-bold text-white">{page}</span> of {totalPages} ({total} items)
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <ReasoningModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  );
}
