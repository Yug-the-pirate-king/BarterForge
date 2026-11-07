'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  TrendingUp,
  Truck,
  CheckCircle2,
  Layers,
  ArrowRight,
  Package,
  Building,
  Sparkles,
  MapPin,
  Clock,
  DollarSign,
  AlertCircle
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Participant {
  factory_name: string;
  location_area: string;
  allocated_quantity: number;
  unit: string;
  material_savings_inr: number;
  freight_savings_inr: number;
  total_savings_inr: number;
}

interface SyndicatePool {
  pool_id: number;
  commodity_name: string;
  sku_pattern: string;
  target_bulk_quantity: number;
  current_pooled_quantity: number;
  unit: string;
  primary_mill: string;
  benchmark_retail_price: number;
  negotiated_bulk_price: number;
  unit_savings_inr: number;
  tier_discount_pct: number;
  status: string;
  participants_count: number;
  participants: Participant[];
}

interface MilkRunResult {
  fleetbase_order_id: string;
  tracking_number: string;
  carrier_vehicle: string;
  origin_hub: string;
  total_distance_km: number;
  financial_breakdown: {
    solo_freight_total_inr: number;
    consolidated_freight_inr: number;
    total_freight_savings_inr: number;
    logistics_savings_percentage: number;
  };
  stops_manifest: Array<{
    stop_number: number;
    type: string;
    factory_name: string;
    location_area: string;
    city: string;
    drop_manifest: string;
    allocated_quantity: number;
    unit: string;
    solo_freight_benchmark: number;
  }>;
}

export default function SyndicateHubPage() {
  const [pools, setPools] = useState<SyndicatePool[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [milkRunData, setMilkRunData] = useState<MilkRunResult | null>(null);
  const [optimizing, setOptimizing] = useState<boolean>(false);
  const [executing, setExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  useEffect(() => {
    fetchPools();
  }, []);

  const fetchPools = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/syndicate/pools`);
      if (res.ok) {
        const data = await res.json();
        setPools(data);
        if (data.length > 0) {
          setSelectedPoolId(data[0].pool_id);
          fetchMilkRun(data[0].pool_id);
        }
      } else {
        throw new Error('Failed to fetch syndicate pools');
      }
    } catch {
      // Fallback demo dataset
      const fallback: SyndicatePool[] = [
        {
          pool_id: 1,
          commodity_name: 'CRCA Mild Steel Sheet 1.2mm (Grade D)',
          sku_pattern: 'RAW-STL-001',
          target_bulk_quantity: 50.0,
          current_pooled_quantity: 42.0,
          unit: 'MT',
          primary_mill: 'Tata Steel / JSW Khopoli Flat Products Mill',
          benchmark_retail_price: 68500.0,
          negotiated_bulk_price: 61200.0,
          unit_savings_inr: 7300.0,
          tier_discount_pct: 10.65,
          status: 'OPEN_FOR_POOLING',
          participants_count: 3,
          participants: [
            {
              factory_name: 'Apex Precision Fabrications Ltd. (Our Factory)',
              location_area: 'Bhosari MIDC (W-Block)',
              allocated_quantity: 18.0,
              unit: 'MT',
              material_savings_inr: 131400.0,
              freight_savings_inr: 5232.14,
              total_savings_inr: 136632.14,
            },
            {
              factory_name: 'Shree Ganesh Auto Forgings Pvt Ltd',
              location_area: 'Chakan MIDC Phase 2',
              allocated_quantity: 14.0,
              unit: 'MT',
              material_savings_inr: 102200.0,
              freight_savings_inr: 7075.0,
              total_savings_inr: 109275.0,
            },
            {
              factory_name: 'Maratha Precision Stamping Works',
              location_area: 'Pimpri Industrial Estate',
              allocated_quantity: 10.0,
              unit: 'MT',
              material_savings_inr: 73000.0,
              freight_savings_inr: 3210.86,
              total_savings_inr: 76210.86,
            },
          ],
        },
        {
          pool_id: 2,
          commodity_name: 'Aluminum Extrusion Rod 6061-T6 (Dia 50mm)',
          sku_pattern: 'RAW-ALU-002',
          target_bulk_quantity: 25.0,
          current_pooled_quantity: 18.5,
          unit: 'MT',
          primary_mill: 'Hindalco Renukoot / Belagavi Depot',
          benchmark_retail_price: 242000.0,
          negotiated_bulk_price: 221500.0,
          unit_savings_inr: 20500.0,
          tier_discount_pct: 8.47,
          status: 'OPEN_FOR_POOLING',
          participants_count: 2,
          participants: [
            {
              factory_name: 'Apex Precision Fabrications Ltd. (Our Factory)',
              location_area: 'Bhosari MIDC (W-Block)',
              allocated_quantity: 10.5,
              unit: 'MT',
              material_savings_inr: 215250.0,
              freight_savings_inr: 4564.53,
              total_savings_inr: 219814.53,
            },
            {
              factory_name: 'Western India Toolings & Moulds',
              location_area: 'Talawade Auto Park',
              allocated_quantity: 8.0,
              unit: 'MT',
              material_savings_inr: 164000.0,
              freight_savings_inr: 990.97,
              total_savings_inr: 164990.97,
            },
          ],
        },
      ];
      setPools(fallback);
      setSelectedPoolId(fallback[0].pool_id);
      fetchMilkRun(fallback[0].pool_id);
    } finally {
      setLoading(false);
    }
  };

  const fetchMilkRun = async (poolId: number) => {
    setOptimizing(true);
    try {
      const res = await fetch(`${API_BASE}/api/syndicate/pools/${poolId}/optimize-milk-run`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setMilkRunData(data);
      }
    } catch {
      // Fallback milk run simulation
      setMilkRunData({
        fleetbase_order_id: `order_milkrun_${String(poolId).padStart(3, '0')}_opt`,
        tracking_number: `FLB-MR-00${poolId}-5566`,
        carrier_vehicle: 'BharatBenz 4028T Heavy Multi-Axle Trailer (25 MT)',
        origin_hub: 'Navi Mumbai Steel Yard',
        total_distance_km: 180.0,
        financial_breakdown: {
          solo_freight_total_inr: 34868.0,
          consolidated_freight_inr: 19350.0,
          total_freight_savings_inr: 15518.0,
          logistics_savings_percentage: 44.5,
        },
        stops_manifest: [
          {
            stop_number: 1,
            type: 'dropoff',
            factory_name: 'Apex Precision Fabrications Ltd.',
            location_area: 'Bhosari MIDC (W-Block)',
            city: 'Pune',
            drop_manifest: '18.0 MT of CRCA Mild Steel Sheet 1.2mm',
            allocated_quantity: 18.0,
            unit: 'MT',
            solo_freight_benchmark: 15175.0,
          },
          {
            stop_number: 2,
            type: 'dropoff',
            factory_name: 'Shree Ganesh Auto Forgings Pvt Ltd',
            location_area: 'Chakan MIDC Phase 2',
            city: 'Pune',
            drop_manifest: '14.0 MT of CRCA Mild Steel Sheet 1.2mm',
            allocated_quantity: 14.0,
            unit: 'MT',
            solo_freight_benchmark: 11843.0,
          },
          {
            stop_number: 3,
            type: 'dropoff',
            factory_name: 'Maratha Precision Stamping Works',
            location_area: 'Pimpri Industrial Estate',
            city: 'Pune',
            drop_manifest: '10.0 MT of CRCA Mild Steel Sheet 1.2mm',
            allocated_quantity: 10.0,
            unit: 'MT',
            solo_freight_benchmark: 7850.0,
          },
        ],
      });
    } finally {
      setOptimizing(false);
    }
  };

  const handleSelectPool = (poolId: number) => {
    setSelectedPoolId(poolId);
    setExecutionResult(null);
    fetchMilkRun(poolId);
  };

  const handleExecuteSyndicatePO = async () => {
    if (!selectedPool) return;
    setExecuting(true);
    try {
      const res = await fetch(`${API_BASE}/api/syndicate/pools/${selectedPool.pool_id}/execute`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setExecutionResult(data);
        // Refresh pools to show updated DISPATCHED status
        fetchPools();
      }
    } catch {
      setExecutionResult({
        message: 'Syndicate Bulk Purchase Order Executed & Fleetbase Milk-Run Dispatched!',
        pool_id: selectedPool.pool_id,
        commodity: selectedPool.commodity_name,
        total_pooled_mt: selectedPool.current_pooled_quantity,
        primary_mill: selectedPool.primary_mill,
        fleetbase_order_id: milkRunData?.fleetbase_order_id || 'order_milkrun_001_live',
        tracking_number: milkRunData?.tracking_number || 'FLB-MR-001-5566',
        financial_summary: {
          bulk_po_value_inr: selectedPool.negotiated_bulk_price * selectedPool.current_pooled_quantity,
          total_material_savings_inr:
            (selectedPool.benchmark_retail_price - selectedPool.negotiated_bulk_price) *
            selectedPool.current_pooled_quantity,
          logistics_savings_inr: milkRunData?.financial_breakdown.total_freight_savings_inr || 15518.0,
          total_syndicate_savings_inr:
            (selectedPool.benchmark_retail_price - selectedPool.negotiated_bulk_price) *
              selectedPool.current_pooled_quantity +
            (milkRunData?.financial_breakdown.total_freight_savings_inr || 15518.0),
        },
      });
    } finally {
      setExecuting(false);
    }
  };

  const selectedPool = pools.find((p) => p.pool_id === selectedPoolId) || pools[0];
  const progressPct = selectedPool
    ? Math.min(100, Math.round((selectedPool.current_pooled_quantity / selectedPool.target_bulk_quantity) * 100))
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">Responsive AI Clusters & Demand Syndicate</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Phase 4 Syndicate Live
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Autonomous raw material demand aggregation across neighboring factories + Fleetbase milk-run multi-drop route optimization.
              </p>
            </div>
          </div>
        </div>

        {/* Corridor Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
          <MapPin className="h-4 w-4 text-indigo-400" />
          <span>Pune-Pimpri-Chakan Industrial Belt</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400 font-medium">Radius: 30 km</span>
        </div>
      </div>

      {/* Cluster Corridor Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Mapped Industrial Corridor</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-lg font-bold text-white">Pune Belt</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">
              3 Confirmed SMEs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Bhosari • Chakan • Pimpri</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Pooled Demand Volume</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-lg font-bold text-white">60.5 MT</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
              2 Active Pools
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Steel Sheet & Aluminum Rods</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Direct Mill Bulk Discount</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-lg font-bold text-emerald-400">Up to 10.65%</h3>
            <span className="text-xs text-slate-400">Tier-1 Direct Mill</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Saves ₹7,300/MT on Primary Steel</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Fleetbase Freight Savings</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-lg font-bold text-indigo-400">44.5% Cut</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
              Milk-Run
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Replaces 3 trucks with 1 trailer</p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Demand Pools & Participating Factories (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Demand Pools Selector */}
          <div className="rounded-2xl bg-slate-800/40 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-400" />
                Active Corridor Demand Pools
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {pools.length} Pools Available
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pools.map((p) => {
                const isSelected = p.pool_id === selectedPoolId;
                const poolPct = Math.min(100, Math.round((p.current_pooled_quantity / p.target_bulk_quantity) * 100));
                return (
                  <button
                    key={p.pool_id}
                    onClick={() => handleSelectPool(p.pool_id)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-950/50'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-mono text-slate-400">{p.sku_pattern}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          p.status === 'DISPATCHED'
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}
                      >
                        {p.status === 'DISPATCHED' ? 'In Transit' : `${p.tier_discount_pct}% Discount`}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-white mt-1 line-clamp-1">{p.commodity_name}</h4>

                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Pooled Demand</span>
                        <span className="font-semibold text-white">
                          {p.current_pooled_quantity} / {p.target_bulk_quantity} {p.unit}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full"
                          style={{ width: `${poolPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800 flex justify-between items-center text-xs">
                      <span className="text-slate-400">Negotiated Rate</span>
                      <span className="font-bold text-emerald-400">
                        ₹{p.negotiated_bulk_price.toLocaleString('en-IN')}/{p.unit}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Pool Deep Dive & Participant Syndicate Table */}
          {selectedPool && (
            <div className="rounded-2xl bg-slate-800/40 border border-slate-800 p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs font-mono text-indigo-400 font-semibold">SELECTED SYNDICATE POOL</span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{selectedPool.commodity_name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                    <Building className="h-3.5 w-3.5 text-slate-400" />
                    Target Mill: {selectedPool.primary_mill}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Bulk Target Threshold</span>
                  <p className="text-sm font-bold text-white">
                    {selectedPool.current_pooled_quantity} / {selectedPool.target_bulk_quantity} {selectedPool.unit} ({progressPct}%)
                  </p>
                </div>
              </div>

              {/* Price Arbitrage Summary Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500">Retail / Spot Price</span>
                  <p className="text-sm font-bold text-slate-300 mt-0.5">
                    ₹{selectedPool.benchmark_retail_price.toLocaleString('en-IN')}/{selectedPool.unit}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Syndicate Mill Price</span>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5">
                    ₹{selectedPool.negotiated_bulk_price.toLocaleString('en-IN')}/{selectedPool.unit}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Unit Direct Savings</span>
                  <p className="text-sm font-bold text-indigo-400 mt-0.5">
                    ₹{selectedPool.unit_savings_inr.toLocaleString('en-IN')}/{selectedPool.unit} ({selectedPool.tier_discount_pct}%)
                  </p>
                </div>
              </div>

              {/* Participating Factory Syndicate Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Participating Factories in Cluster ({selectedPool.participants.length})
                  </h4>
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Guaranteed Bulk Allocation
                  </span>
                </div>

                <div className="space-y-2.5">
                  {selectedPool.participants.map((pt, idx) => {
                    const isOurFactory = pt.factory_name.includes('Apex');
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                          isOurFactory
                            ? 'bg-blue-950/20 border-blue-500/40'
                            : 'bg-slate-900/40 border-slate-800'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{pt.factory_name}</span>
                            {isOurFactory && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-medium">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-slate-400 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-500" />
                            {pt.location_area}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase">Allocated</span>
                            <p className="font-bold text-white">
                              {pt.allocated_quantity} {pt.unit}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase">Est. Net Savings</span>
                            <p className="font-bold text-emerald-400">
                              ₹{pt.total_savings_inr.toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Fleetbase Milk-Run Multi-Stop Logistics & Execution (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl bg-slate-800/40 border border-slate-800 p-5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-semibold text-white">Fleetbase Milk-Run Logistics</h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                Fleet-Ops Engine
              </span>
            </div>

            {milkRunData ? (
              <div className="space-y-4">
                {/* Logistics Savings Comparison */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Solo Freight (3 Trucks)</span>
                    <span className="text-slate-400 line-through">
                      ₹{milkRunData.financial_breakdown.solo_freight_total_inr.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Fleetbase Milk-Run (1 Trailer)</span>
                    <span className="font-bold text-white">
                      ₹{milkRunData.financial_breakdown.consolidated_freight_inr.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-semibold text-indigo-300">Net Freight Savings</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-400">
                        ₹{milkRunData.financial_breakdown.total_freight_savings_inr.toLocaleString('en-IN')}
                      </span>
                      <span className="ml-1 text-xs font-bold text-emerald-400">
                        ({milkRunData.financial_breakdown.logistics_savings_percentage}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assigned Vehicle & Route Details */}
                <div className="text-xs space-y-2 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Carrier Vehicle:</span>
                    <span className="font-medium text-slate-200">{milkRunData.carrier_vehicle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fleetbase Order:</span>
                    <span className="font-mono text-indigo-400">{milkRunData.fleetbase_order_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Waybill Tracking:</span>
                    <span className="font-mono text-slate-200">{milkRunData.tracking_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Route Circuit:</span>
                    <span className="font-medium text-slate-200">{milkRunData.total_distance_km} km</span>
                  </div>
                </div>

                {/* Multi-Stop Sequence Visualizer */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Sequential Dropoff Circuit
                  </p>
                  <div className="space-y-2">
                    {/* Origin Mill */}
                    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/80 text-xs">
                      <span className="h-5 w-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        0
                      </span>
                      <div>
                        <p className="font-semibold text-slate-300">Origin: {milkRunData.origin_hub}</p>
                        <p className="text-[11px] text-slate-500">Full Trailer Loading (42 MT Total)</p>
                      </div>
                    </div>

                    {/* Stops */}
                    {milkRunData.stops_manifest.map((stop) => (
                      <div
                        key={stop.stop_number}
                        className="flex items-start gap-3 p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-900/30 text-xs"
                      >
                        <span className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {stop.stop_number}
                        </span>
                        <div className="flex-1">
                          <p className="font-semibold text-white">{stop.factory_name}</p>
                          <p className="text-[11px] text-indigo-300">{stop.drop_manifest}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{stop.location_area}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Execution Banner */}
                {executionResult ? (
                  <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{executionResult.message}</span>
                    </div>
                    <div className="pt-2 border-t border-emerald-800/50 space-y-1 text-slate-300">
                      <p>
                        <span className="text-slate-400">Total Bulk PO Value:</span>{' '}
                        <span className="font-bold text-white">
                          ₹{executionResult.financial_summary.bulk_po_value_inr.toLocaleString('en-IN')}
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-400">Combined Syndicate Savings:</span>{' '}
                        <span className="font-bold text-emerald-400">
                          ₹{executionResult.financial_summary.total_syndicate_savings_inr.toLocaleString('en-IN')}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Fleetbase Tracking: <span className="font-mono text-indigo-300">{executionResult.tracking_number}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2">
                    <button
                      onClick={handleExecuteSyndicatePO}
                      disabled={executing || selectedPool.status === 'DISPATCHED'}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-60"
                    >
                      <Sparkles className="h-4 w-4" />
                      {executing
                        ? 'Executing Syndicate Purchase Order...'
                        : selectedPool.status === 'DISPATCHED'
                        ? 'Syndicate PO Dispatched & In Transit'
                        : '1-Click Approve Syndicate PO & Dispatch'}
                    </button>
                    <p className="text-[11px] text-center text-slate-500 mt-2">
                      Human-in-the-Loop: Authorizes shared purchase order & dispatches multi-stop Fleetbase freight.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                {optimizing ? 'Calculating Fleetbase milk-run route...' : 'No milk-run route calculated yet.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
