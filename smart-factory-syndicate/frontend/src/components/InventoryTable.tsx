'use client';

import React from 'react';
import { InventoryItem } from '@/lib/types';
import { AlertTriangle, CheckCircle, PackagePlus } from 'lucide-react';

interface InventoryTableProps {
  items: InventoryItem[];
  onReorderClick?: (item: InventoryItem) => void;
}

export default function InventoryTable({ items, onReorderClick }: InventoryTableProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Raw Material Inventory Ledger</h3>
          <p className="text-xs text-slate-400">Live stock counts compared with safety reorder limits</p>
        </div>
        <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
          {items.length} Tracked Commodities
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/40 text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 font-semibold">SKU & Item Name</th>
              <th className="py-3 px-4 font-semibold">Category</th>
              <th className="py-3 px-4 font-semibold text-right">Current Stock</th>
              <th className="py-3 px-4 font-semibold text-right">Safety Threshold</th>
              <th className="py-3 px-4 font-semibold">Stock Health</th>
              <th className="py-3 px-4 font-semibold text-right">Unit Baseline Cost</th>
              <th className="py-3 px-4 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {items.map((item) => {
              const stockRatio = Math.min((item.current_stock / item.minimum_stock) * 100, 100);
              const isLow = item.current_stock <= item.minimum_stock;

              return (
                <tr key={item.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-white">{item.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{item.sku}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{item.category}</td>
                  <td className="py-3.5 px-4 text-right font-semibold text-white">
                    {item.current_stock.toLocaleString()} {item.unit}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-400">
                    {item.minimum_stock.toLocaleString()} {item.unit}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isLow ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${stockRatio}%` }}
                        ></div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          isLow
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {isLow ? (
                          <>
                            <AlertTriangle className="h-3 w-3" /> Reorder Triggered
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3" /> Healthy
                          </>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-slate-200">
                    ₹{item.current_unit_cost.toLocaleString()} / {item.unit}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => onReorderClick?.(item)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                        isLow
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <PackagePlus className="h-3.5 w-3.5" />
                      {isLow ? 'Procure Best' : 'Top Up'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

