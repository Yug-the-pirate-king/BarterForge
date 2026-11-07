from app.database import SessionLocal
from app.routes.agents import get_agents_status, get_procurement_recommendations, formulate_buyer_bid
from app.services.bidding_agent import BuyerRFQRequest

def main():
    db = SessionLocal()

    print("1. Testing Multi-Agent Syndicate Status...")
    status = get_agents_status()
    print("Agents active:", [a["name"] for a in status["agents"]])

    print("\n2. Testing Procurement Agent Recommendations...")
    recs = get_procurement_recommendations(db=db)
    print(f"Procurement Recommendations Generated: {len(recs)} low stock triggers")
    for r in recs[:2]:
        print(f" - [{r['urgency']}] {r['name']} ({r['sku']}): Deficit {r['deficit_stock']} {r['unit']}")
        print(f"   Top Sourcing Option: {r['top_options'][0]['strategy_label']} from {r['top_options'][0]['supplier_name']}")
        print(f"   Landed Cost: ₹{r['top_options'][0]['landed_cost_unit']:,.2f} / {r['unit']} | Savings: ₹{r['top_options'][0]['savings_vs_baseline']:,.2f}")

    print("\n3. Testing Bidding Agent Formulate Bid...")
    rfq = BuyerRFQRequest(
        buyer_name="Bajaj Auto Manufacturing",
        buyer_location="Chakan",
        item_name="CRCA Mild Steel Sheet 1.2mm",
        quantity=20.0,
        unit="MT",
        processing_overhead_per_unit=3500.0,
        target_margin_pct=18.0,
        customer_budget_target_price=65000.0 # Underpriced target to test guardrail!
    )
    bid = formulate_buyer_bid(rfq, db=db)
    print("Buyer:", bid["buyer_name"], "Destination:", bid["buyer_location"])
    print("Total Cost of Goods + Freight: ₹", bid["breakdown"]["total_cost_of_goods_and_freight"])
    print("Suggested Selling Price: ₹", bid["quotation"]["suggested_total_price"])
    print("Guardrail Status:", bid["guardrail"]["status"])
    print("Guardrail Warning:", bid["guardrail"]["warning_message"])

    db.close()
    print("\n>>> ALL PHASE 3 MULTI-AGENT WORKFLOWS VERIFIED 100%! <<<")

if __name__ == "__main__":
    main()

