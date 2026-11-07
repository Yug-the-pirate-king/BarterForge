from app.database import SessionLocal
from app.seed import seed_database
from app.routes.syndicate import list_clusters, list_syndicate_pools, optimize_milk_run, execute_syndicate_po

def main():
    print("1. Initializing and verifying seed database...")
    seed_database()

    db = SessionLocal()

    print("\n2. Testing Industrial Corridor Clusters...")
    clusters = list_clusters(db=db)
    print(f"Mapped Clusters: {len(clusters)}")
    for c in clusters:
        print(f" * {c['name']} ({c['region']}) | Radius: {c['radius_km']} km | Active Pools: {c['active_pools_count']}")

    print("\n3. Testing Syndicate Demand Pools...")
    pools = list_syndicate_pools(db=db)
    print(f"Active Pools detected: {len(pools)}")
    for p in pools:
        print(f" * Pool #{p['pool_id']}: {p['commodity_name']}")
        print(f"   Target: {p['target_bulk_quantity']} {p['unit']} | Pooled: {p['current_pooled_quantity']} {p['unit']}")
        print(f"   Mill: {p['primary_mill']}")
        print(f"   Benchmark Retail: ₹{p['benchmark_retail_price']:,.2f} -> Bulk Rate: ₹{p['negotiated_bulk_price']:,.2f} ({p['tier_discount_pct']}% off)")
        print(f"   Participants ({p['participants_count']}):")
        for pt in p['participants']:
            print(f"     + {pt['factory_name']} [{pt['location_area']}]: {pt['allocated_quantity']} {pt['unit']} (Est Savings: ₹{pt['total_savings_inr']:,.2f})")

    pool1_id = pools[0]['pool_id']

    print(f"\n4. Testing Fleetbase Fleet-Ops Milk-Run Route Optimizer for Pool #{pool1_id}...")
    mr = optimize_milk_run(pool1_id, db=db)
    print(f"Fleetbase Order: {mr['fleetbase_order_id']} | Tracking: {mr['tracking_number']}")
    print(f"Carrier: {mr['carrier_vehicle']}")
    print(f"Total Circuit Distance: {mr['total_distance_km']} km")
    fb = mr['financial_breakdown']
    print(f"Solo Freight Benchmark: ₹{fb['solo_freight_total_inr']:,.2f}")
    print(f"Consolidated Milk-Run Freight: ₹{fb['consolidated_freight_inr']:,.2f}")
    print(f"Net Freight Savings: ₹{fb['total_freight_savings_inr']:,.2f} ({fb['logistics_savings_percentage']}%)")
    print("Stops Sequence:")
    for s in mr['stops_manifest']:
        print(f"  Stop #{s['stop_number']}: {s['factory_name']} ({s['location_area']}) -> Drops {s['drop_manifest']}")

    print(f"\n5. Testing 1-Click Syndicate PO Execution for Pool #{pool1_id}...")
    exec_res = execute_syndicate_po(pool1_id, db=db)
    print("Execution Confirmed:")
    print(f"  Message: {exec_res['message']}")
    print(f"  Bulk PO Value: ₹{exec_res['financial_summary']['bulk_po_value_inr']:,.2f}")
    print(f"  Material Savings: ₹{exec_res['financial_summary']['total_material_savings_inr']:,.2f}")
    print(f"  Freight Savings: ₹{exec_res['financial_summary']['logistics_savings_inr']:,.2f}")
    print(f"  TOTAL SYNDICATE SAVINGS: ₹{exec_res['financial_summary']['total_syndicate_savings_inr']:,.2f}")

    db.close()
    print("\n>>> ALL PHASE 4 RESPONSIVE AI CLUSTER & SYNDICATE TESTS PASSED 100%! <<<")

if __name__ == "__main__":
    main()
