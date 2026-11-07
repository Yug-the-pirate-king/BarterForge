'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Boxes, FileCheck2, Building2, Route, Layers, Bot, Users } from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'AI Agents Hub', href: '/agents', icon: Bot },
  { name: 'Cluster Syndicate', href: '/syndicate', icon: Users },
  { name: 'Inventory Ledger', href: '/inventory', icon: Boxes },
  { name: 'Quote Approvals', href: '/quotes', icon: FileCheck2 },
  { name: 'RAG Ingestion Studio', href: '/ingest', icon: Layers },
  { name: 'Supplier Network', href: '/suppliers', icon: Building2 },
  { name: 'Fleetbase Logistics', href: '/fleetbase', icon: Route },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Operations & Agents
          </p>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Multi-Agent Syndicate Status */}
        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-blue-400" />
              Syndicate Agents
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">P1 Ready</span>
          </div>
          <div className="space-y-1.5 text-slate-400 pt-1">
            <div className="flex justify-between items-center text-[11px]">
              <span>Procurement Agent</span>
              <span className="text-emerald-400 font-medium">Monitoring</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span>Bidding Agent</span>
              <span className="text-slate-400 font-medium">Standby</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span>Cluster Pool Agent</span>
              <span className="text-emerald-400 font-medium">Consolidating</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
        <p className="font-medium text-slate-300">Problem Statement 4.1</p>
        <p>Smart Factory Syndicate v1.0.0</p>
      </div>
    </aside>
  );
}

