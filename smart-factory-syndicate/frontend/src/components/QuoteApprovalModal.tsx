'use client';

import React from 'react';
import { Quote } from '@/lib/types';
import { X, Check, Ban, MessageSquare, Truck, ShieldCheck, Sparkles } from 'lucide-react';

interface QuoteApprovalModalProps {
  quote: Quote | null;
  onClose: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

export default function QuoteApprovalModal({
  quote,
  onClose,
  onApprove,
  onReject,
}: QuoteApprovalModalProps) {
  if (!quote) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Quote Decision & Landed Cost Breakdown</h3>
              <p className="text-xs text-slate-400">Human-in-the-Loop Bound Verification (Problem Statement 4.1)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Unstructured Source Input Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                Raw Unstructured Supplier Communication (WhatsApp)
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                AI Confidence: {(quote.ai_confidence * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-slate-300 italic bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 leading-relaxed font-mono">
              "{quote.raw_message}"
            </p>
          </div>

          {/* Structured Landed Cost Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Base Material Quote */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Extracted Material Rate
              </span>
              <div className="text-xl font-bold text-white">
                ₹{quote.extracted_price.toLocaleString()} <span className="text-xs text-slate-400 font-normal">/ {quote.unit}</span>
              </div>
              <div className="text-xs text-slate-400 space-y-1 pt-1 border-t border-slate-800">
                <div className="flex justify-between">
                  <span>Batch Quantity:</span>
                  <span className="font-semibold text-white">{quote.quantity} {quote.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Terms:</span>
                  <span className="font-semibold text-amber-400">{quote.delivery_terms}</span>
                </div>
              </div>
            </div>

            {/* Fleetbase Live Freight */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-blue-400" />
                  Fleetbase Freight Add-on
                </span>
                <span className="text-[10px] text-blue-400 font-mono">Fleet-Ops API</span>
              </div>
              <div className="text-xl font-bold text-blue-400">
                + ₹{quote.freight_cost_est.toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 space-y-1 pt-1 border-t border-slate-800">
                <div className="flex justify-between">
                  <span>Freight per unit:</span>
                  <span className="font-semibold text-slate-200">
                    ₹{(quote.freight_cost_est / quote.quantity).toFixed(2)} / {quote.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Lead Time:</span>
                  <span className="font-semibold text-emerald-400">{quote.lead_time_days} Days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Final Landed Cost Calculation Bar */}
          <div className="rounded-xl bg-blue-600/10 border border-blue-500/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                True Landed Cost (Factory Doorstep)
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Total Material (₹{(quote.extracted_price * quote.quantity).toLocaleString()}) + Freight (₹{quote.freight_cost_est.toLocaleString()})
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-white">
                ₹{quote.landed_cost_unit.toLocaleString()}
                <span className="text-xs font-normal text-slate-300"> / {quote.unit}</span>
              </div>
              <div className="text-[11px] text-emerald-400 font-semibold">
                Guaranteed Profit Protected
              </div>
            </div>
          </div>

          {/* Human-in-the-loop notice */}
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Owner Authorization Required:</strong> Approving this quote records the supplier bid and updates your inventory baseline cost.
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
          <button
            onClick={() => onReject(quote.id)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 transition"
          >
            <Ban className="h-3.5 w-3.5" />
            Reject Quote
          </button>
          <button
            onClick={() => onApprove(quote.id)}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition"
          >
            <Check className="h-3.5 w-3.5" />
            Approve & Execute PO
          </button>
        </div>
      </div>
    </div>
  );
}

