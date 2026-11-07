from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import InventoryItem
from app.schemas import InventoryItemCreate, InventoryItemUpdate, InventoryItemOut
from app.services.procurement_service import procurement_service

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("", response_model=List[InventoryItemOut])
def list_inventory(
    low_stock_only: bool = Query(False, description="Filter for items needing reorder"),
    db: Session = Depends(get_db)
):
    """Retrieve factory raw material inventory ledger."""
    query = db.query(InventoryItem)
    if low_stock_only:
        query = query.filter(InventoryItem.current_stock <= InventoryItem.minimum_stock)
    return query.order_by(InventoryItem.name.asc()).all()

@router.post("", response_model=InventoryItemOut, status_code=201)
def create_inventory_item(
    item_in: InventoryItemCreate,
    db: Session = Depends(get_db)
):
    """Register a new raw material item in the inventory ledger."""
    existing = db.query(InventoryItem).filter(InventoryItem.sku == item_in.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Item with SKU '{item_in.sku}' already exists.")

    item = InventoryItem(
        factory_id=item_in.factory_id,
        sku=item_in.sku,
        name=item_in.name,
        category=item_in.category,
        current_stock=item_in.current_stock,
        minimum_stock=item_in.minimum_stock,
        reorder_quantity=item_in.reorder_quantity,
        unit=item_in.unit,
        current_unit_cost=item_in.current_unit_cost,
        reorder_triggered=(item_in.current_stock <= item_in.minimum_stock),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/{item_id}", response_model=InventoryItemOut)
def get_inventory_item(item_id: int, db: Session = Depends(get_db)):
    """Retrieve details for a single inventory item."""
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found.")
    return item

@router.patch("/{item_id}", response_model=InventoryItemOut)
def update_inventory_stock(
    item_id: int,
    item_update: InventoryItemUpdate,
    db: Session = Depends(get_db)
):
    """Update stock counts or unit cost for an inventory item."""
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found.")

    if item_update.current_stock is not None:
        item.current_stock = item_update.current_stock
        item.reorder_triggered = (item.current_stock <= item.minimum_stock)
    if item_update.minimum_stock is not None:
        item.minimum_stock = item_update.minimum_stock
    if item_update.reorder_quantity is not None:
        item.reorder_quantity = item_update.reorder_quantity
    if item_update.current_unit_cost is not None:
        item.current_unit_cost = item_update.current_unit_cost

    db.commit()
    db.refresh(item)
    return item

@router.post("/scan-reorders")
def scan_safety_levels(db: Session = Depends(get_db)):
    """Trigger the procurement scanner to check for stock dipping below safety limits."""
    low_stock = procurement_service.check_and_update_reorder_status(db)
    return {
        "scanned_items_count": db.query(InventoryItem).count(),
        "low_stock_alerts": [
            {
                "sku": i.sku,
                "name": i.name,
                "current_stock": i.current_stock,
                "minimum_stock": i.minimum_stock,
                "unit": i.unit,
                "suggested_reorder_qty": i.reorder_quantity,
            }
            for i in low_stock
        ]
    }

