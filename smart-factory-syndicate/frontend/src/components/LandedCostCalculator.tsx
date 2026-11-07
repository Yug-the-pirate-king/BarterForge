'use client';

import React, { useState } from 'react';
import { calculateLandedCost } from '@/lib/api';
import { LandedCostEstimate } from '@/lib/types';
import { Calculator, ArrowRight, Route, ShieldAlert, Sparkles } from 'lucide-react';

export default function LandedCostCalculator() {
  const [materialCost, setMaterialCost] = useState<number>(68000);
  const [quantity, setQuantity] = useState<number>(10);
  const [supplierCity, setSupplierCity] = useState<string>('Mumbai');
  const [margin, setMargin] = useState<number>(18);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<LandedCostEstimate | null>(null);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const res = await calculateLandedCost({
        material_cost_per_unit: materialCost,
        quantity: quantity,
        supplier_city: supplierCity,
        factory_city: 'Pune',
        vehicle_type: '10_ton_truck',
        margin_percentage: margin,
      });
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
            <Calculator className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Live Bidding & Landed Cost Engine</h3>
            <p className="text-xs text-slate-400">Calculate guaranteed profitable buyer quotes with Fleetbase freight</p>
          </div>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
          Bidding Agent Simulator
        </span>
      </div>

      {/* Input Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Raw Material Unit Cost (₹)</label>
          <input
            type="number"
            value={materialCost}
            onChange={(e) => setMaterialCost(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Quantity (MT / Units)</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Supplier Origin Hub</label>
          <select
            value={supplierCity}
            onChange={(e) => setSupplierCity(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="Mumbai">Mumbai (150 km)</option>
            <option value="Navi Mumbai">Navi Mumbai (130 km)</option>
            <option value="Ahmedabad">Ahmedabad (660 km)</option>
            <option value="Kolhapur">Kolhapur (235 km)</option>
            <option value="Surat">Surat (415 km)</option>
            <option value="Nagpur">Nagpur (710 km)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Owner Margin Target (%)</label>
          <input
            type="number"
            value={margin}
            onChange={(e) => setMargin(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleCalculate}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20 transition disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {loading ? 'Routing via Fleetbase...' : 'Formulate Quote'}
        </button>
      </div>

      {/* Output Results */}
      {result && (
        <div className="mt-4 pt-4 border-t border-slate-800 bg-slate-950/60 p-4 rounded-xl space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-1">Material Subtotal</span>
              <span className="text-sm font-bold text-white">₹{result.raw_material_total.toLocaleString()}</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-1">Fleetbase Freight ({result.distance_km} km)</span>
              <span className="text-sm font-bold text-blue-400">+ ₹{result.total_freight.toLocaleString()}</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-1">Landed Cost / Unit</span>
              <span className="text-sm font-bold text-amber-400">₹{result.landed_cost_per_unit.toLocaleString()}</span>
            </div>
            <div className="bg-blue-600/10 p-3 rounded-lg border border-blue-500/30">
              <span className="text-blue-300 block mb-1">Suggested Buyer Quote</span>
              <span className="text-sm font-black text-emerald-400">₹{result.suggested_selling_price.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <Route className="h-3.5 w-3.5 text-blue-400" />
              Source: {result.fleetbase_routing_source}
            </span>
            <span className="font-semibold text-emerald-400">
              Guaranteed Net Margin: ₹{result.net_margin_amount.toLocaleString()} ({result.margin_percentage}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

