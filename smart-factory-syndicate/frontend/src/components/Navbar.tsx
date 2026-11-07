'use client';

import React from 'react';
import { Factory, ShieldCheck, Truck, Bell } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <Factory className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white tracking-tight">Smart Factory Syndicate</h1>
            <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Phase 1 Live
            </span>
          </div>
          <p className="text-xs text-slate-400">Apex Precision Fabrications Ltd. • Pune MIDC Hub</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Logistics OS Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
          <Truck className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-slate-400">Logistics OS:</span>
          <span className="font-medium text-slate-200">Fleetbase Connected</span>
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>

        {/* Human-in-the-loop boundary badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Human-in-the-Loop Active</span>
        </div>

        {/* Alerts count */}
        <button className="relative p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-slate-900"></span>
        </button>
      </div>
    </header>
  );
}

