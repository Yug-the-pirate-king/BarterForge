'use client';

import React, { useState, useEffect } from 'react';
import { Bot, ShieldAlert, Sparkles, TrendingUp, CheckCircle2, Copy, AlertTriangle, ArrowRight, Truck, DollarSign, PackagePlus } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AgentsHubPage() {
  const [activeTab, setActiveTab] = useState<'procurement' | 'bidding'>('procurement');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Bidding Agent Form State
  const [buyerName, setBuyerName] = useState<string>('Bajaj Auto Manufacturing');
  const [buyerLocation, setBuyerLocation] = useState<string>('Chakan');
  const [itemSelect, setItemSelect] = useState<string>('CRCA Mild Steel Sheet 1.2mm');
  const [bidQty, setBidQty] = useState<number>(20);
  const [overhead, setOverhead] = useState<number>(3500);
  const [marginPct, setMarginPct] = useState<number>(18);
  const [customerBudget, setCustomerBudget] = useState<number | ''>('');
  const [bidResult, setBidResult] = useState<any>(null);
  const [bidLoading, setBidLoading] = useState<boolean>(false);
  const [copiedProposal, setCopiedProposal] = useState<boolean>(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/agents/procurement/recommendations`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setRecommendations(data);
      })
      .catch(() => {
        // Fallback demo recommendations
        setRecommendations([
          {
            item_id: 1,
            sku: 'RAW-STL-001',
            name: 'CRCA Mild Steel Sheet 1.2mm (Grade D)',
            category: 'Prime Steel & Sheets',
            current_stock: 4.2,
            minimum_stock: 10.0,
            deficit_stock: 5.8,
            recommended_order_qty: 20.0,
            unit: 'MT',
            current_baseline_cost: 69500.0,
            urgency: 'CRITICAL',
            top_options: [
              {
                quote_id: 1,
                supplier_name: 'Tata / Jindal Steel Distributors',
                supplier_city: 'Mumbai',
                strategy_label: 'Best Value & Landed Price',
                quoted_unit_price: 67800.0,
                freight_cost_est: 15175.0,
                landed_cost_unit: 68558.75,
                total_order_cost: 1371175.0,
                savings_vs_baseline: 18825.0,
                lead_time_days: 2,
                payment_terms: 'Net 30 Days',
                composite_score: 94.2
              },
              {
                quote_id: 5,
                supplier_name: 'Apex Fasteners & Steel Pune',
                supplier_city: 'Pune',
                strategy_label: 'Fastest Delivery (Critical Stock)',
                quoted_unit_price: 68900.0,
                freight_cost_est: 2800.0,
                landed_cost_unit: 69040.0,
                total_order_cost: 1380800.0,
                savings_vs_baseline: 9200.0,
                lead_time_days: 1,
                payment_terms: 'Net 15 Days',
                composite_score: 91.5
              }
            ],
            draft_whatsapp_rfq: 'Namaste! From Apex Precision Fabrications, Pune. We require immediate dispatch of 20 MT of CRCA Mild Steel Sheet 1.2mm. Please reply with your latest rate ex-works or delivered to Bhosari MIDC Pune. Delivery within 3 days required.'
          }
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleFormulateBid = async () => {
    setBidLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/agents/bidding/formulate-bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer_name: buyerName,
          buyer_location: buyerLocation,
          item_name: itemSelect,
          quantity: bidQty,
          unit: 'MT',
          processing_overhead_per_unit: overhead,
          target_margin_pct: marginPct,
          customer_budget_target_price: customerBudget ? Number(customerBudget) : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBidResult(data);
      }
    } catch (e) {
      // Local fallback calculation
      const materialCost = 67800;
      const freight = 6500;
      const cog = (materialCost + overhead) * bidQty + freight;
      const marginMult = 1 + marginPct / 100;
      const totalQuote = Math.round(cog * marginMult);
      const unitQuote = Math.round(totalQuote / bidQty);
      const isLoss = customerBudget && Number(customerBudget) < (cog / bidQty);

      setBidResult({
        buyer_name: buyerName,
        buyer_location: buyerLocation,
        item_name: itemSelect,
        quantity: bidQty,
        unit: 'MT',
        breakdown: {
          raw_material_unit_cost: materialCost,
          total_raw_material_cost: materialCost * bidQty,
          total_processing_overhead: overhead * bidQty,
          fleetbase_outbound_freight: freight,
          total_cost_of_goods_and_freight: cog,
          total_cost_per_unit: Math.round(cog / bidQty),
        },
        quotation: {
          suggested_unit_price: unitQuote,
          suggested_total_price: totalQuote,
          net_profit_amount: totalQuote - cog,
          margin_percentage: marginPct,
        },
        guardrail: {
          status: isLoss ? 'CRITICAL_LOSS_BLOCKED' : 'OPTIMAL_MARGIN',
          warning_message: isLoss ? `GUARDRAIL TRIGGERED: Target price of ₹${customerBudget} causes a NET LOSS of ₹${Math.round(cog - Number(customerBudget) * bidQty)} due to freight!` : null,
          safe_to_dispatch: !isLoss,
        },
        formal_proposal_text: `COMMERCIAL PROPOSAL FOR ${buyerName.toUpperCase()}\nItem: ${itemSelect} | Quantity: ${bidQty} MT\nDelivery Location: ${buyerLocation}\nQuoted Rate: ₹${unitQuote.toLocaleString()} / MT (Doorstep All Inclusive)\nTotal Proposal Value: ₹${totalQuote.toLocaleString()}\nDispatch: Within 3 business days from PO.`,
      });
    } finally {
      setBidLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">Multi-Agent Operations Hub</h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
            Phase 3 Active
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Autonomous multi-agent execution with Human-in-the-Loop decision boundaries (Problem Statement 4.1)
        </p>
      </div>

      {/* Agents Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab('procurement')}
          className={`p-5 rounded-2xl border transition cursor-pointer space-y-2 ${
            activeTab === 'procurement'
              ? 'bg-blue-950/20 border-blue-500/50 shadow-lg shadow-blue-600/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-blue-400">AGENT 1</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-bold">Monitoring</span>
          </div>
          <h3 className="text-sm font-bold text-white">Autonomous Procurement Agent</h3>
          <p className="text-xs text-slate-400">
            Continuously monitors inventory dips below minimum threshold, queries suppliers & ranks top 3 strategies.
          </p>
        </div>

        <div
          onClick={() => setActiveTab('bidding')}
          className={`p-5 rounded-2xl border transition cursor-pointer space-y-2 ${
            activeTab === 'bidding'
              ? 'bg-blue-950/20 border-blue-500/50 shadow-lg shadow-blue-600/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-blue-400">AGENT 2</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 font-bold">On-Demand</span>
          </div>
          <h3 className="text-sm font-bold text-white">Landed-Cost Bidding Agent</h3>
          <p className="text-xs text-slate-400">
            Ingests buyer RFQs, adds Fleetbase outbound transport & enforces strict margin protection guardrails.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2 opacity-80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-purple-400">AGENT 3</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-400 font-bold">Phase 4 Ready</span>
          </div>
          <h3 className="text-sm font-bold text-white">Cluster Syndicate Agent</h3>
          <p className="text-xs text-slate-400">
            Pools raw material demand with neighboring factories to negotiate tier-1 mill rates & shared milk-runs.
          </p>
        </div>
      </div>

      {/* TAB 1: Procurement Agent Recommendations */}
      {activeTab === 'procurement' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Autonomous Procurement Action Items</h3>
              <p className="text-xs text-slate-400">Items requiring immediate reorder to prevent factory line stoppages</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {recommendations.length} Active Triggers
            </span>
          </div>

          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div key={rec.item_id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{rec.name}</h4>
                      <span className="text-xs font-mono text-slate-500">{rec.sku}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {rec.urgency} DEFICIT: {rec.deficit_stock} {rec.unit}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Current Stock: <strong className="text-rose-400">{rec.current_stock} {rec.unit}</strong> • Safety Limit: {rec.minimum_stock} {rec.unit} • Baseline: ₹{rec.current_baseline_cost?.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Recommended Order</span>
                    <span className="text-base font-bold text-blue-400">{rec.recommended_order_qty} {rec.unit}</span>
                  </div>
                </div>

                {/* Top-3 Ranked Deal Curation */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Procurement Agent Curated Sourcing Strategies
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {rec.top_options.map((opt: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-blue-500/40 transition space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 block w-fit mb-1">
                              {opt.strategy_label || `Option #${idx + 1}`}
                            </span>
                            <h5 className="text-xs font-bold text-white">{opt.supplier_name}</h5>
                            <span className="text-[11px] text-slate-400">{opt.supplier_city} ({opt.distance_km} km) • Lead: {opt.lead_time_days}d</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">True Landed Cost</span>
                            <span className="text-sm font-bold text-amber-400">₹{opt.landed_cost_unit.toLocaleString()} / {rec.unit}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                          <div>
                            <span className="text-slate-500 block">Base Material:</span>
                            <span className="font-medium text-slate-200">₹{opt.quoted_unit_price.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Fleetbase Freight:</span>
                            <span className="font-semibold text-blue-400">+ ₹{opt.freight_cost_est.toLocaleString()}</span>
                          </div>
                          <div className="col-span-2 pt-1 border-t border-slate-800 flex justify-between">
                            <span className="text-slate-400">Projected Savings:</span>
                            <span className="text-emerald-400 font-semibold">+ ₹{opt.savings_vs_baseline?.toLocaleString()}</span>
                          </div>
                        </div>

                        <button className="w-full py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition">
                          Approve Sourcing Strategy (PO)
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Drafted WhatsApp RFQ for Owner */}
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                      Drafted Supplier WhatsApp RFQ Ping
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(rec.draft_whatsapp_rfq)}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                    >
                      <Copy className="h-3 w-3" /> Copy Message
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 font-mono italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    "{rec.draft_whatsapp_rfq}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Bidding Agent RFQ Formulator */}
      {activeTab === 'bidding' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Incoming Buyer RFQ Quotation Engine</h3>
              <p className="text-xs text-slate-400">Calculates guaranteed-profit bids with outbound Fleetbase logistics</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Buyer Organization</label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Delivery Destination</label>
                  <select
                    value={buyerLocation}
                    onChange={(e) => setBuyerLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Chakan">Chakan Auto Cluster (35 km)</option>
                    <option value="Pune">Pune MIDC (18 km)</option>
                    <option value="Mumbai">Mumbai Port (150 km)</option>
                    <option value="Aurangabad">Aurangabad (235 km)</option>
                    <option value="Bangalore">Bangalore (840 km)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Quoted Commodity</label>
                  <select
                    value={itemSelect}
                    onChange={(e) => setItemSelect(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="CRCA Mild Steel Sheet 1.2mm">CRCA Steel Sheet 1.2mm</option>
                    <option value="Aluminum Rod 6061-T6">Aluminum Rod 6061-T6</option>
                    <option value="Brass Hex Bar CW614N">Brass Hex Bar CW614N</option>
                    <option value="M12 HT 8.8 Hex Bolts">M12 HT 8.8 Hex Bolts</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Quantity (MT)</label>
                  <input
                    type="number"
                    value={bidQty}
                    onChange={(e) => setBidQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Processing/Overhead (₹/MT)</label>
                  <input
                    type="number"
                    value={overhead}
                    onChange={(e) => setOverhead(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Target Margin (%)</label>
                  <input
                    type="number"
                    value={marginPct}
                    onChange={(e) => setMarginPct(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-medium text-amber-400 mb-1">
                  Buyer Target Budget (Optional - Tests Margin Guardrail)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 70000 (Enter lower price to trigger guardrail)"
                  value={customerBudget}
                  onChange={(e) => setCustomerBudget(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                onClick={handleFormulateBid}
                disabled={bidLoading}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition disabled:opacity-50"
              >
                {bidLoading ? 'Formulating with Fleetbase...' : 'Formulate Buyer Quotation'}
              </button>
            </div>
          </div>

          {/* Quotation Proposal Result */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">Quotation Breakdown & Margin Guardrails</h3>

            {bidResult ? (
              <div className="space-y-4">
                {/* Guardrail Banner */}
                {bidResult.guardrail.status === 'CRITICAL_LOSS_BLOCKED' ? (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1.5">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                      <AlertTriangle className="h-4 w-4" />
                      CRITICAL LOSS GUARDRAIL TRIGGERED
                    </div>
                    <p className="text-xs text-rose-300 leading-relaxed">
                      {bidResult.guardrail.warning_message}
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Guaranteed Profit Protected: Net Margin is {bidResult.quotation.margin_percentage}%</span>
                  </div>
                )}

                {/* Landed Cost Breakdown */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Sourced Material Total ({bidResult.quantity} {bidResult.unit}):</span>
                    <span className="font-medium text-white">₹{bidResult.breakdown.total_raw_material_cost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>In-House Processing Overhead:</span>
                    <span className="font-medium text-white">+ ₹{bidResult.breakdown.total_processing_overhead.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Fleetbase Outbound Transport ({bidResult.buyer_location}):</span>
                    <span className="font-semibold text-blue-400">+ ₹{bidResult.breakdown.fleetbase_outbound_freight.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-slate-200">
                    <span>Total Factory Breakeven Cost:</span>
                    <span>₹{bidResult.breakdown.total_cost_of_goods_and_freight.toLocaleString()}</span>
                  </div>
                </div>

                {/* Final Quote Numbers */}
                <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-blue-300 uppercase font-bold">Suggested Selling Quote</span>
                    <div className="text-xl font-black text-white">
                      ₹{bidResult.quotation.suggested_unit_price.toLocaleString()} / {bidResult.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Guaranteed Net Profit</span>
                    <span className="text-lg font-bold text-emerald-400">
                      ₹{bidResult.quotation.net_profit_amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Commercial Proposal Output */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Commercial Proposal Text</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(bidResult.formal_proposal_text);
                        setCopiedProposal(true);
                        setTimeout(() => setCopiedProposal(false), 2000);
                      }}
                      className="text-blue-400 hover:text-white flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" /> {copiedProposal ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {bidResult.formal_proposal_text}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="h-64 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                <Sparkles className="h-8 w-8 text-slate-700" />
                <p className="text-xs">Fill in buyer RFQ details and click "Formulate Buyer Quotation" to see the live logistics & margin breakdown.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

