from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import InventoryItem, Quote, Supplier
from app.schemas import DashboardStats
from app.services.fleetbase_service import fleetbase_client

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Fetch high-level KPIs for the factory owner dashboard."""
    total_items = db.query(InventoryItem).count()
    low_stock = db.query(InventoryItem).filter(InventoryItem.current_stock <= InventoryItem.minimum_stock).count()
    pending_quotes = db.query(Quote).filter(Quote.status == "PENDING").count()
    active_suppliers = db.query(Supplier).count()

    # Calculate total current inventory value
    items = db.query(InventoryItem).all()
    total_inv_value = sum(item.current_stock * item.current_unit_cost for item in items)

    # Projected syndicate / intelligent quote optimization savings (~12.5% benchmark)
    projected_savings = total_inv_value * 0.125

    fb_status = await fleetbase_client.check_health()

    return DashboardStats(
        total_inventory_items=total_items,
        low_stock_alerts_count=low_stock,
        pending_quotes_count=pending_quotes,
        active_suppliers_count=active_suppliers,
        estimated_inventory_value_inr=round(total_inv_value, 2),
        projected_syndicate_savings_inr=round(projected_savings, 2),
        fleetbase_connection_status=f"{fb_status['status']} ({fb_status['mode']})",
    )

