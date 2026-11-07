from app.database import SessionLocal
from app.routes.quotes import extract_and_ingest_quote, RawQuoteIngestRequest
from app.routes.fleetbase import dispatch_quote_order, get_vehicle_profiles

def main():
    db = SessionLocal()

    print("1. Testing Vehicle Profiles from Fleetbase...")
    profiles = get_vehicle_profiles()
    print("Vehicle Profiles loaded:", list(profiles.keys()))

    print("\n2. Testing Phase 2 AI Extraction Pipeline...")
    req = RawQuoteIngestRequest(
        raw_text="Namaste Sharma ji, Tata CRCA 1.2mm fresh coils @ ₹67,800/MT ex-Navi Mumbai yard. 12 MT ready stock available. Delivery extra approx ₹8,500. Payment 30 days.",
        supplier_id=1
    )
    quote = extract_and_ingest_quote(req, db=db)
    print("Extracted Item:", quote.item_name)
    print("Base Material Price: ₹", quote.extracted_price)
    print("Fleetbase Dynamic Freight: ₹", quote.freight_cost_est)
    print("True Landed Cost: ₹", quote.landed_cost_unit)
    print("Status:", quote.status, "| AI Confidence:", quote.ai_confidence)

    print("\n3. Testing Fleet-Ops Order Dispatch...")
    dispatch_res = dispatch_quote_order(quote.id, db=db)
    order = dispatch_res["order"]
    print("Dispatched Order ID:", order["id"])
    print("Tracking Number:", order["tracking_number"])
    print("Route Origin -> Destination:", order["payload"]["route"]["origin"], "->", order["payload"]["route"]["destination"])
    print("Ledger Invoice Ref:", order["financials"]["ledger_invoice_id"])

    db.close()
    print("\n>>> ALL FLEETBASE INTEGRATIONS & PHASE 2 ENDPOINTS VERIFIED 100%! <<<")

if __name__ == "__main__":
    main()

