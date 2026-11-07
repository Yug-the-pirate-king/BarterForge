'use client';

import React, { useEffect, useState } from 'react';
import QuoteApprovalModal from '@/components/QuoteApprovalModal';
import { fetchQuotes, updateQuoteStatus } from '@/lib/api';
import { Quote } from '@/lib/types';
import { FileCheck2, Filter, CheckCircle2, Clock, Ban, Eye } from 'lucide-react';

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadQuotes = async () => {
    setLoading(true);
    try {
      const q = await fetchQuotes(statusFilter === 'ALL' ? undefined : statusFilter);
      setQuotes(q);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotes();
  }, [statusFilter]);

  const handleApprove = async (id: number) => {
    await updateQuoteStatus(id, 'APPROVED', 'Approved by factory owner');
    setSelectedQuote(null);
    loadQuotes();
  };

  const handleReject = async (id: number) => {
    await updateQuoteStatus(id, 'REJECTED', 'Rejected by owner');
    setSelectedQuote(null);
    loadQuotes();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Quote Approval & Landed Cost Center</h2>
          </div>
          <p className="text-xs text-slate-400">
            Human-in-the-Loop decision gate for incoming WhatsApp and supplier bids
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Quotes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quotes.map((q) => (
          <div
            key={q.id}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{q.item_name}</h4>
                  <span className="text-[11px] font-mono text-slate-500">{q.sku_match || 'General Commodity'}</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    q.status === 'APPROVED'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : q.status === 'REJECTED'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {q.status}
                </span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-300 italic font-mono leading-relaxed">
                "{q.raw_message}"
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Raw Price:</span>
                <span className="font-semibold text-slate-200">₹{q.extracted_price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fleetbase Freight:</span>
                <span className="font-semibold text-blue-400">+ ₹{q.freight_cost_est.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800/80 font-bold">
                <span className="text-white">Landed / {q.unit}:</span>
                <span className="text-amber-400">₹{q.landed_cost_unit.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedQuote(q)}
              className="w-full py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center justify-center gap-1.5"
            >
              <Eye className="h-3.5 w-3.5" />
              Inspect Breakdown
            </button>
          </div>
        ))}
      </div>

      <QuoteApprovalModal
        quote={selectedQuote}
        onClose={() => setSelectedQuote(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}

