from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Supplier, FleetbaseSyncLog
from app.schemas import SupplierCreate, SupplierOut
from app.services.fleetbase_service import fleetbase_client

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

@router.get("", response_model=List[SupplierOut])
def list_suppliers(db: Session = Depends(get_db)):
    """List all registered suppliers and their logistics profiles."""
    return db.query(Supplier).order_by(Supplier.rating.desc()).all()

@router.post("", response_model=SupplierOut, status_code=201)
async def create_supplier(supplier_in: SupplierCreate, db: Session = Depends(get_db)):
    """Register a new supplier and sync with Fleetbase Vendors."""
    supplier = Supplier(
        name=supplier_in.name,
        category=supplier_in.category,
        phone=supplier_in.phone,
        email=supplier_in.email,
        city=supplier_in.city,
        distance_km=supplier_in.distance_km,
        rating=supplier_in.rating,
        payment_terms=supplier_in.payment_terms,
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)

    # Sync with Fleetbase OS Vendor Directory
    try:
        fb_vendor_id = await fleetbase_client.register_vendor({
            "id": supplier.id,
            "name": supplier.name,
            "email": supplier.email,
            "phone": supplier.phone,
            "city": supplier.city,
        })
        supplier.fleetbase_vendor_id = fb_vendor_id
        
        # Log sync
        sync_log = FleetbaseSyncLog(
            entity_type="VENDOR",
            local_id=supplier.id,
            fleetbase_id=fb_vendor_id,
            status="SYNCED",
            sync_details=f"Synced supplier {supplier.name} from {supplier.city}",
        )
        db.add(sync_log)
        db.commit()
        db.refresh(supplier)
    except Exception as e:
        db.rollback()

    return supplier

@router.get("/{supplier_id}", response_model=SupplierOut)
def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    """Get single supplier detail with quotes."""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found.")
    return supplier

