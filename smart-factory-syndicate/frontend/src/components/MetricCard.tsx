'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badgeText?: string;
  badgeType?: 'warning' | 'success' | 'info' | 'neutral';
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeType = 'neutral',
}: MetricCardProps) {
  const badgeColors = {
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    neutral: 'bg-slate-800 text-slate-400 border-slate-700',
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm hover:border-slate-700 transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1.5 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-blue-400">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {badgeText && (
        <div className="mt-3 pt-3 border-t border-slate-800/80">
          <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${badgeColors[badgeType]}`}>
            {badgeText}
          </span>
        </div>
      )}
    </div>
  );
}

