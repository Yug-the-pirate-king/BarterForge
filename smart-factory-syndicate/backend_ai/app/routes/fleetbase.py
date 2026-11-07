from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Supplier, Factory, Quote, FleetbaseSyncLog
from app.schemas import LandedCostRequest, LandedCostResponse
from app.services.fleetbase_service import fleetbase_client, VEHICLE_PROFILES

router = APIRouter(prefix="/fleetbase", tags=["Fleetbase Integration"])

# In-memory store for active Fleet-Ops orders generated from approved quotes
DISPATCHED_ORDERS: List[Dict[str, Any]] = []

@router.get("/status")
async def get_fleetbase_status():
    """Verify live status and connectivity with Fleetbase Logistics OS."""
    status = await fleetbase_client.check_health()
    return status

@router.get("/vehicle-profiles")
def get_vehicle_profiles():
    """Retrieve standard Fleet-Ops vehicle profiles, capacities, and rates."""
    return VEHICLE_PROFILES

@router.post("/calculate-landed-cost", response_model=LandedCostResponse)
def calculate_landed_cost(payload: LandedCostRequest):
    """
    Simulate the Bidding Agent's core landed cost equation:
    Landed Cost = (Raw Material Price * Qty) + Fleetbase Dynamic Freight + Owner Margin
    """
    raw_material_total = payload.material_cost_per_unit * payload.quantity
    
    # Calculate freight via Fleetbase routing engine
    freight_info = fleetbase_client.calculate_freight_and_route(
        origin_city=payload.supplier_city,
        destination_city=payload.factory_city,
        distance_km=payload.distance_km,
        vehicle_type=payload.vehicle_type,
        weight_metric_tons=payload.quantity,
    )
    total_freight = freight_info["total_freight"]

    landed_cost_total = raw_material_total + total_freight
    landed_cost_per_unit = round(landed_cost_total / max(payload.quantity, 0.001), 2)

    # Margin calculation
    margin_mult = 1.0 + (payload.margin_percentage / 100.0)
    suggested_selling_price = round(landed_cost_total * margin_mult, 2)
    net_margin_amount = round(suggested_selling_price - landed_cost_total, 2)

    return LandedCostResponse(
        raw_material_total=round(raw_material_total, 2),
        distance_km=freight_info["distance_km"],
        freight_rate_per_km=freight_info["rate_per_km"],
        total_freight=total_freight,
        landed_cost_total=round(landed_cost_total, 2),
        landed_cost_per_unit=landed_cost_per_unit,
        suggested_selling_price=suggested_selling_price,
        net_margin_amount=net_margin_amount,
        margin_percentage=payload.margin_percentage,
        fleetbase_routing_source=freight_info["source"],
    )

@router.post("/orders/dispatch-quote/{quote_id}")
def dispatch_quote_order(quote_id: int, db: Session = Depends(get_db)):
    """
    Fleetbase Fleet-Ops Integration:
    Creates an operational inbound haulage Order in Fleetbase once a quote is approved.
    Maps supplier pickup yard to factory dropoff hub, calculating live route & tracking ID.
    """
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found.")
    
    supplier = db.query(Supplier).filter(Supplier.id == quote.supplier_id).first()
    factory = db.query(Factory).first()

    factory_name = factory.name if factory else "Apex Precision Fabrications Ltd."
    factory_address = factory.address if factory else "Plot W-72, MIDC Bhosari, Pune"

    fb_order = fleetbase_client.generate_fleetops_order(
        quote_id=quote.id,
        item_name=quote.item_name,
        quantity=quote.quantity,
        unit=quote.unit,
        supplier_name=supplier.name if supplier else "Supplier",
        supplier_city=supplier.city if supplier else "Mumbai",
        factory_name=factory_name,
        factory_address=factory_address,
        freight_cost=quote.freight_cost_est,
    )

    DISPATCHED_ORDERS.insert(0, fb_order)
    return {
        "message": "Fleetbase Fleet-Ops transport order dispatched successfully!",
        "order": fb_order,
    }

@router.get("/orders")
def list_dispatched_orders():
    """List active and historical Fleetbase haulage orders."""
    # If empty, provide seeded example dispatch order
    if not DISPATCHED_ORDERS:
        return [
            {
                "id": "order_7a9c2f",
                "tracking_number": "FLB-IN-0004-9214",
                "status": "IN_TRANSIT",
                "type": "raw_material_inbound",
                "payload": {
                    "pickup": {"name": "Apex Fasteners Depot", "city": "Pune", "type": "supplier_warehouse"},
                    "dropoff": {"name": "Apex Precision Fabrications", "address": "Plot W-72, MIDC Bhosari", "city": "Pune"},
                    "entities": [{"name": "M12 HT 8.8 Hex Bolts x 45mm", "quantity": 10000.0, "unit": "Pcs", "declared_value_freight": 0.0}],
                    "route": {"origin": "Pune MIDC", "destination": "Pune MIDC", "estimated_distance_km": 18.0, "estimated_duration_hours": 0.5}
                },
                "financials": {"ledger_invoice_id": "inv_flb_88291", "freight_cost_inr": 0.0, "payment_terms": "Doorstep Included"},
                "created_at": "2026-11-07T14:30:00Z"
            }
        ]
    return DISPATCHED_ORDERS

@router.post("/sync-all")
async def sync_all_entities(db: Session = Depends(get_db)):
    """Bulk sync all factories and suppliers with Fleetbase Places and Vendors."""
    results = {"factories_synced": 0, "suppliers_synced": 0}
    
    factories = db.query(Factory).all()
    for factory in factories:
        place_id = await fleetbase_client.register_factory_place({
            "name": factory.name,
            "address": factory.address,
            "city": factory.city,
        })
        factory.fleetbase_place_id = place_id
        results["factories_synced"] += 1

    suppliers = db.query(Supplier).all()
    for supplier in suppliers:
        vendor_id = await fleetbase_client.register_vendor({
            "name": supplier.name,
            "email": supplier.email,
            "phone": supplier.phone,
            "city": supplier.city,
        })
        supplier.fleetbase_vendor_id = vendor_id
        results["suppliers_synced"] += 1

    db.commit()
    return {"message": "Sync completed successfully", "details": results}
