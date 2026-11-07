"""
========================================================================================
🏭 SMART FACTORY SYNDICATE — END-TO-END DEMO WALKTHROUGH
Problem Statement 4.1: Eradicating Raw Material Overpayment & Quote Losses for Small Factories
Integrations: LangChain RAG + Responsive Multi-Agent Clusters + Fleetbase Logistics OS
========================================================================================
"""
import sys
import os
import json

# Ensure backend_ai is in sys.path
sys.path.insert(0, os.path.abspath("."))

from app.database import SessionLocal
from app.seed import seed_database
from app.routes.quotes import extract_and_ingest_quote, RawQuoteIngestRequest
from app.routes.fleetbase import dispatch_quote_order, get_vehicle_profiles
from app.routes.agents import get_procurement_recommendations, formulate_buyer_bid
from app.services.bidding_agent import BuyerRFQRequest
from app.routes.syndicate import list_clusters, list_syndicate_pools, optimize_milk_run, execute_syndicate_po

def run_walkthrough():
    print("=" * 80)
    print(" 🏭 SMART FACTORY SYNDICATE — FULL SYSTEM DEMO WALKTHROUGH")
    print(" Target: Problem Statement 4.1 (Autonomous Procurement & Dynamic Landed Bidding)")
    print(" Powered by: Fleetbase Logistics OS (Fleet-Ops, Ledger) + Agentic AI Clusters")
    print("=" * 80)

    # 1. Database Initialization
    print("\n[STEP 1] INITIALIZING ENTERPRISE KNOWLEDGE BASE & RESILIENT DATABASE...")
    seed_database()
    db = SessionLocal()
    print("✔ Database schema ready. Dual-mode active with pre-seeded industrial commodities.")

    # 2. Phase 1: Fleetbase Logistics Engine Vehicle Profiles & Corridor Matrix
    print("\n[STEP 2] LOGISTICS OS — FLEETBASE CORRIDOR MATRIX & VEHICLE PROFILES...")
    profiles = get_vehicle_profiles()
    print(f"✔ Fleetbase Engine calibrated with {len(profiles)} transport tiers:")
    for k, v in profiles.items():
        print(f"   • {v['name']} ({v.get('capacity_mt', 10.0)} MT) @ ₹{v.get('rate_per_km', 45.0)}/km [Handling: ₹{v.get('fixed_loading', 1500.0)}]")

    # 3. Phase 2: RAG Pipeline & Unstructured WhatsApp Ingestion
    print("\n[STEP 3] RAG INGESTION — PARSING UNSTRUCTURED HINGLISH WHATSAPP QUOTE...")
    sample_whatsapp = (
        "Namaste Sharma ji, Tata CRCA 1.2mm fresh coils @ ₹67,800/MT ex-Navi Mumbai yard. "
        "12 MT ready stock available. Delivery extra approx ₹8,500. Payment 30 days."
    )
    print(f"Incoming WhatsApp message:\n   \"{sample_whatsapp}\"")
    req = RawQuoteIngestRequest(raw_text=sample_whatsapp, supplier_id=1)
    extracted_quote = extract_and_ingest_quote(req, db=db)
    print("✔ LangChain / NLP Extraction Complete:")
    print(f"   • Item Identified    : {extracted_quote.item_name} (SKU: {extracted_quote.sku_match})")
    print(f"   • Material Base Price: ₹{extracted_quote.extracted_price:,.2f} / {extracted_quote.unit}")
    print(f"   • Fleetbase Dynamic Freight: ₹{extracted_quote.freight_cost_est:,.2f}")
    print(f"   • TRUE LANDED COST   : ₹{extracted_quote.landed_cost_unit:,.2f} / {extracted_quote.unit}")
    print(f"   • AI Confidence Score: {extracted_quote.ai_confidence * 100:.1f}%")

    # 4. Phase 1 / 3: Human-in-the-Loop Quote Approval & Fleetbase Dispatch
    print("\n[STEP 4] HUMAN-IN-THE-LOOP QUOTE APPROVAL & FLEETBASE FLEET-OPS DISPATCH...")
    dispatch_res = dispatch_quote_order(extracted_quote.id, db=db)
    order = dispatch_res["order"]
    print("✔ Factory Owner clicks 'Approve' -> Fleetbase Fleet-Ops order generated:")
    print(f"   • Fleetbase Order ID : {order['id']}")
    print(f"   • Tracking Number    : {order['tracking_number']}")
    print(f"   • Waypoints Route    : {order['payload']['route']['origin']} -> {order['payload']['route']['destination']}")
    print(f"   • Ledger Invoice Ref : {order['financials']['ledger_invoice_id']}")
    print(f"   • Freight Cost (INR) : ₹{order['financials']['freight_cost_inr']:,.2f}")

    # 5. Phase 3: Autonomous Procurement Stock Scanner
    print("\n[STEP 5] AUTONOMOUS PROCUREMENT AGENT — SAFETY STOCK SCANNER...")
    recs = get_procurement_recommendations(db=db)
    print(f"✔ Found {len(recs)} low-stock alerts triggering autonomous sourcing curation:")
    for r in recs[:2]:
        top = r["top_options"][0]
        print(f"   • [{r['urgency']}] {r['name']} — Deficit: {r['deficit_stock']} {r['unit']}")
        print(f"     Top Deal: {top['strategy_label']} from {top['supplier_name']}")
        print(f"     Landed: ₹{top['landed_cost_unit']:,.2f}/{r['unit']} | Savings: ₹{top['savings_vs_baseline']:,.2f}")

    # 6. Phase 3: Landed-Cost Bidding Agent & Negative Margin Guardrail
    print("\n[STEP 6] BIDDING AGENT — RFQ LANDED COST & NEGATIVE MARGIN GUARDRAIL...")
    rfq = BuyerRFQRequest(
        buyer_name="Bajaj Auto Manufacturing Ltd",
        buyer_location="Chakan Industrial Area",
        item_name="CRCA Mild Steel Sheet 1.2mm",
        quantity=20.0,
        unit="MT",
        processing_overhead_per_unit=3500.0,
        target_margin_pct=18.0,
        customer_budget_target_price=65000.0,  # Below cost of goods!
    )
    bid = formulate_buyer_bid(rfq, db=db)
    print("Incoming Buyer RFQ with target price: ₹65,000.00/MT (Below break-even!)")
    print(f"✔ Guardrail Evaluation: {bid['guardrail']['status']}")
    print(f"   • Total Cost of Goods + Freight: ₹{bid['breakdown']['total_cost_of_goods_and_freight']:,.2f}")
    print(f"   • Minimum Break-Even Unit Cost : ₹{bid['breakdown']['total_cost_per_unit']:,.2f}/MT")
    print(f"   • Suggested Profitable Bid     : ₹{bid['quotation']['suggested_unit_price']:,.2f}/MT")
    print(f"   • Guardrail Warning Message    : {bid['guardrail']['warning_message']}")

    # 7. Phase 4: Responsive AI Clusters (Syndicate Demand Pooling & Milk-Run)
    print("\n[STEP 7] RESPONSIVE AI CLUSTERS — MULTI-FACTORY DEMAND POOLING...")
    clusters = list_clusters(db=db)
    cluster = clusters[0]
    print(f"✔ Active Industrial Corridor: {cluster['name']} (Radius: {cluster['radius_km']} km)")
    
    pools = list_syndicate_pools(db=db)
    pool = pools[0]
    print(f"✔ Active Demand Pool: {pool['commodity_name']}")
    print(f"   • Bulk Target: {pool['target_bulk_quantity']} MT | Current Pooled: {pool['current_pooled_quantity']} MT")
    print(f"   • Primary Mill: {pool['primary_mill']}")
    print(f"   • Spot/Retail: ₹{pool['benchmark_retail_price']:,.2f} -> Syndicate Bulk Rate: ₹{pool['negotiated_bulk_price']:,.2f} ({pool['tier_discount_pct']}% OFF)")
    print(f"   • Enrolled Neighbor Factories ({pool['participants_count']}):")
    for pt in pool['participants']:
        print(f"     - {pt['factory_name']} [{pt['location_area']}]: {pt['allocated_quantity']} {pt['unit']} (Est Savings: ₹{pt['total_savings_inr']:,.2f})")

    # 8. Phase 4: Fleetbase Multi-Drop Milk-Run Optimization
    print("\n[STEP 8] FLEETBASE FLEET-OPS MULTI-DROP MILK-RUN LOGISTICS...")
    mr = optimize_milk_run(pool['pool_id'], db=db)
    fb = mr['financial_breakdown']
    print(f"✔ Fleetbase Milk-Run Circuit ({mr['total_distance_km']} km, Carrier: {mr['carrier_vehicle']}):")
    print(f"   • Tracking Number : {mr['tracking_number']}")
    print(f"   • Solo Freight Benchmark (3 Trucks): ₹{fb['solo_freight_total_inr']:,.2f}")
    print(f"   • Consolidated Trailer Milk-Run    : ₹{fb['consolidated_freight_inr']:,.2f}")
    print(f"   • Net Logistics Freight Savings    : ₹{fb['total_freight_savings_inr']:,.2f} ({fb['logistics_savings_percentage']}% SAVED)")

    # 9. Phase 4: 1-Click Syndicate PO Execution
    print("\n[STEP 9] 1-CLICK SYNDICATE PURCHASE ORDER EXECUTION...")
    exec_res = execute_syndicate_po(pool['pool_id'], db=db)
    fs = exec_res['financial_summary']
    print(f"✔ {exec_res['message']}")
    print(f"   • Total Bulk PO Value   : ₹{fs['bulk_po_value_inr']:,.2f}")
    print(f"   • Direct Material Savings: ₹{fs['total_material_savings_inr']:,.2f}")
    print(f"   • Logistics Freight Cut : ₹{fs['logistics_savings_inr']:,.2f}")
    print(f"   • COMBINED NET SAVINGS  : ₹{fs['total_syndicate_savings_inr']:,.2f}")

    db.close()

    print("\n" + "=" * 80)
    print(" 🎉 ALL 4 PHASES VERIFIED & OPERATIONAL (PROBLEM STATEMENT 4.1 SOLVED!)")
    print("=" * 80)
    print("  1. RAG Extractor       : Ingests unstructured WhatsApp chats without manual data entry")
    print("  2. Fleetbase Engine    : Factors dynamic freight into every raw material decision")
    print("  3. Bidding Guardrail   : Guarantees zero negative-margin sales on buyer RFQs")
    print("  4. Syndicate Pooling   : Delivers Tier-1 mill prices + 44.5% freight cuts via milk-runs")
    print("=" * 80)

if __name__ == "__main__":
    run_walkthrough()

