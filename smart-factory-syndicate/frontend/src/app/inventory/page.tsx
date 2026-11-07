'use client';

import React, { useEffect, useState } from 'react';
import InventoryTable from '@/components/InventoryTable';
import { fetchInventory } from '@/lib/api';
import { InventoryItem } from '@/lib/types';
import { Boxes, Sparkles, Filter, RefreshCw } from 'lucide-react';

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'low'>('all');
  const [loading, setLoading] = useState<boolean>(true);

  const loadInventory = async (lowStock = false) => {
    setLoading(true);
    try {
      const data = await fetchInventory(lowStock);
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory(filter === 'low');
  }, [filter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Raw Material Inventory Management</h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time stock monitoring with autonomous AI reorder triggers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Items ({items.length})
            </button>
            <button
              onClick={() => setFilter('low')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === 'low' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Needs Reorder
            </button>
          </div>

          <button
            onClick={() => loadInventory(filter === 'low')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <InventoryTable items={items} />
    </div>
  );
}

