'use client';

import React, { useEffect, useState } from 'react';
import MetricCard from '@/components/MetricCard';
import InventoryTable from '@/components/InventoryTable';
import QuoteApprovalModal from '@/components/QuoteApprovalModal';
import LandedCostCalculator from '@/components/LandedCostCalculator';
import { fetchDashboardStats, fetchInventory, fetchQuotes, updateQuoteStatus } from '@/lib/api';
import { DashboardStats, InventoryItem, Quote } from '@/lib/types';
import { DollarSign, AlertCircle, FileText, PiggyBank, Sparkles, CheckCircle2, Truck } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, inv, q] = await Promise.all([
        fetchDashboardStats(),
        fetchInventory(),
        fetchQuotes('PENDING'),
      ]);
      setStats(s);
      setInventory(inv);
      setQuotes(q);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: number) => {
    await updateQuoteStatus(id, 'APPROVED', 'Approved by factory owner from dashboard');
    setSelectedQuote(null);
    loadData();
  };

  const handleReject = async (id: number) => {
    await updateQuoteStatus(id, 'REJECTED', 'Rejected by owner');
    setSelectedQuote(null);
    loadData();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Problem Statement 4.1 Brief */}
      <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-slate-900/40 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-blue-500/20 text-blue-400">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-bold text-white">Owner Command Center</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Eliminating raw material overpayment through automated WhatsApp rate extraction and guaranteed landed-cost calculation powered by Fleetbase.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 text-blue-400" />
            Fleetbase Fleet-Ops Active
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Inventory Value"
          value={stats ? `₹${(stats.estimated_inventory_value_inr / 100000).toFixed(2)} Lakh` : '₹61.85 L'}
          subtitle="5 tracked industrial materials"
          icon={DollarSign}
          badgeText="Verified Asset Value"
          badgeType="info"
        />
        <MetricCard
          title="Low Stock Warnings"
          value={stats?.low_stock_alerts_count ?? 3}
          subtitle="Items below safety reorder threshold"
          icon={AlertCircle}
          badgeText="Procurement Agent Active"
          badgeType="warning"
        />
        <MetricCard
          title="Incoming Quotes Awaiting"
          value={stats?.pending_quotes_count ?? 3}
          subtitle="Extracted WhatsApp & PDF bids"
          icon={FileText}
          badgeText="Human-in-Loop Approval"
          badgeType="info"
        />
        <MetricCard
          title="Syndicate Projected Savings"
          value={stats ? `₹${(stats.projected_syndicate_savings_inr / 100000).toFixed(2)} Lakh` : '₹7.73 L'}
          subtitle="12.5% avg cost compression"
          icon={PiggyBank}
          badgeText="Pooled Buying Target"
          badgeType="success"
        />
      </div>

      {/* Interactive Landed Cost Calculator */}
      <LandedCostCalculator />

      {/* Incoming Supplier Quotes for Approval */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Incoming Quotes for Human-in-the-Loop Approval</h3>
            <p className="text-xs text-slate-400">Click inspect to review raw WhatsApp message, Fleetbase freight, and 1-click approve</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
            {quotes.length} Action Items
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quotes.map((q) => (
            <div
              key={q.id}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-blue-500/50 transition cursor-pointer flex flex-col justify-between space-y-3"
              onClick={() => setSelectedQuote(q)}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-blue-400">{q.item_name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                    Lead: {q.lead_time_days}d
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 italic font-mono bg-slate-900/50 p-2 rounded border border-slate-800/80">
                  "{q.raw_message}"
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Raw Rate:</span>
                  <span className="font-medium text-slate-200">₹{q.extracted_price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Fleetbase Freight:</span>
                  <span className="font-semibold text-blue-400">+ ₹{q.freight_cost_est.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-800">
                  <span className="text-white">Landed / {q.unit}:</span>
                  <span className="text-amber-400">₹{q.landed_cost_unit.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedQuote(q);
                }}
                className="w-full py-1.5 rounded-lg text-xs font-semibold bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 transition text-center"
              >
                Inspect & Decide
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <InventoryTable
        items={inventory}
        onReorderClick={(item) => {
          // Find matching quote
          const match = quotes.find((q) => q.sku_match === item.sku);
          if (match) setSelectedQuote(match);
        }}
      />

      {/* Decision Modal */}
      <QuoteApprovalModal
        quote={selectedQuote}
        onClose={() => setSelectedQuote(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}

