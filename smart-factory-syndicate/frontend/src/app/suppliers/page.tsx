'use client';

import React, { useEffect, useState } from 'react';
import { fetchSuppliers } from '@/lib/api';
import { Supplier } from '@/lib/types';
import { Building2, MapPin, Phone, Star, ShieldCheck, Truck } from 'lucide-react';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchSuppliers();
        setSuppliers(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">Supplier Directory & Logistics Network</h2>
        </div>
        <p className="text-xs text-slate-400">
          Synced with Fleetbase Vendor Registry for dynamic routing and automated freight calculation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suppliers.map((sup) => (
          <div
            key={sup.id}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">{sup.name}</h4>
                <span className="text-xs text-blue-400 font-medium">{sup.category}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
                <Star className="h-3 w-3 fill-amber-400" />
                {sup.rating.toFixed(1)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-slate-400">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                <span>{sup.city} ({sup.distance_km} km)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Phone className="h-3.5 w-3.5 text-slate-500" />
                <span>{sup.phone}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-500">Fleetbase Vendor ID:</span>
                <span className="font-mono text-emerald-400 font-semibold">{sup.fleetbase_vendor_id || 'flb_vdr_auto'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400">Payment: <strong className="text-slate-200">{sup.payment_terms}</strong></span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified Vendor
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

