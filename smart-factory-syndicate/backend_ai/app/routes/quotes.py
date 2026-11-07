from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Quote, Supplier, InventoryItem
from app.schemas import QuoteCreate, QuoteStatusUpdate, QuoteOut
from app.services.procurement_service import procurement_service
from app.services.extraction_service import extraction_service

router = APIRouter(prefix="/quotes", tags=["Quotes"])

class RawQuoteIngestRequest(BaseModel):
    raw_text: str = Field(..., description="Unstructured WhatsApp / email / PDF text")
    supplier_id: Optional[int] = Field(None, description="Optional supplier ID; defaults to first or matched")
    sender_phone: Optional[str] = Field(None, description="Sender phone number from webhook")

@router.get("", response_model=List[QuoteOut])
def list_quotes(
    status: Optional[str] = Query(None, description="Filter by status (PENDING, APPROVED, REJECTED)"),
    db: Session = Depends(get_db)
):
    """List incoming supplier quotes with Landed Cost calculations."""
    query = db.query(Quote)
    if status:
        query = query.filter(Quote.status == status.upper())
    return query.order_by(Quote.created_at.desc()).all()

@router.post("/extract", response_model=QuoteOut, status_code=201)
def extract_and_ingest_quote(
    payload: RawQuoteIngestRequest,
    db: Session = Depends(get_db)
):
    """
    Phase 2 RAG Ingestion Pipeline:
    Ingests unstructured WhatsApp message / PDF quote sheet, extracts
    structured pricing JSON, computes Fleetbase live freight, and registers
    the quote for Human-in-the-Loop owner approval.
    """
    # 1. Resolve Supplier
    supplier = None
    if payload.supplier_id:
        supplier = db.query(Supplier).filter(Supplier.id == payload.supplier_id).first()
    elif payload.sender_phone:
        supplier = db.query(Supplier).filter(Supplier.phone.contains(payload.sender_phone[-10:])).first()

    if not supplier:
        supplier = db.query(Supplier).first()
        if not supplier:
            raise HTTPException(status_code=400, detail="No suppliers registered in directory.")

    # 2. Run LangChain / AI Extraction Pipeline
    extracted = extraction_service.process_raw_message(payload.raw_text)

    # 3. Compute Fleetbase dynamic freight
    landed = procurement_service.calculate_landed_cost(
        material_price=extracted.extracted_price,
        quantity=extracted.quantity,
        supplier_city=supplier.city,
        delivery_terms=extracted.delivery_terms,
        distance_km=supplier.distance_km,
    )

    # 4. Save into Database
    quote = Quote(
        supplier_id=supplier.id,
        item_name=extracted.item_name,
        sku_match=extracted.sku_match,
        raw_message=payload.raw_text,
        extracted_price=extracted.extracted_price,
        quantity=extracted.quantity,
        unit=extracted.unit,
        delivery_terms=extracted.delivery_terms,
        freight_cost_est=landed["estimated_freight"],
        landed_cost_unit=landed["landed_cost_unit"],
        lead_time_days=extracted.lead_time_days,
        notes=extracted.notes,
        status="PENDING",
        ai_confidence=extracted.ai_confidence,
    )

    db.add(quote)
    db.commit()
    db.refresh(quote)
    return quote

@router.get("/sample-messages")
def get_sample_supplier_messages():
    """Provides realistic unstructured supplier WhatsApp communications for Phase 2 testing."""
    return [
        {
            "supplier_id": 1,
            "supplier_name": "Tata / Jindal Steel Distributors",
            "phone": "+91-9820011223",
            "message": "Namaste Sir, Tata CRCA 1.2mm fresh coils @ ₹67,800/MT ex-Navi Mumbai yard. 12 MT ready stock available. Delivery extra by 10T truck approx ₹8,500. Payment 30 days as usual.",
            "category": "Prime Steel & Sheets",
        },
        {
            "supplier_id": 2,
            "supplier_name": "Gujarat Extrusions & Alloys Corp",
            "phone": "+91-9712345678",
            "message": "Sir, Ahmedabad depot rate for 6061-T6 rods is ₹238/kg (₹238,000/MT). For 15 MT batch we can offer door delivery free (FOR Pune). Dispatch within 48 hrs.",
            "category": "Aluminum & Non-Ferrous",
        },
        {
            "supplier_id": 3,
            "supplier_name": "Kolhapur Brass & Forging Works",
            "phone": "+91-9422098765",
            "message": "Bhaiya, Kolhapur stock CW614N brass hex 19mm ready. Rate ₹472/kg (₹472,000/MT) ex-works. 3 MT available. Truck freight Kolhapur-Pune ₹12,500. Cash discount 1.5% if RTGS today.",
            "category": "Brass & Copper Rods",
        },
        {
            "supplier_id": 4,
            "supplier_name": "Apex Fasteners & Hardware Syndicate",
            "phone": "+91-9890123456",
            "message": "Apex Fasteners Pune: M12x45 Zinc Plated 8.8 grade in stock. Special price ₹17.90/pc for 10,000 pcs lot. Local delivery free in Bhosari MIDC within 4 hours.",
            "category": "Industrial Fasteners",
        },
        {
            "supplier_id": 1,
            "supplier_name": "Tata / Jindal Steel Distributors",
            "phone": "+91-9820011223",
            "message": "URGENT FLASH OFFER: 25 MT Cold Rolled 1.2mm Grade D surplus lot @ ₹66,200/MT ex-plant Navi Mumbai. Pickup today only. Payment immediate RTGS.",
            "category": "Prime Steel & Sheets",
        },
    ]

@router.post("", response_model=QuoteOut, status_code=201)
def create_quote(
    quote_in: QuoteCreate,
    db: Session = Depends(get_db)
):
    """Manually create a structured quote."""
    supplier = db.query(Supplier).filter(Supplier.id == quote_in.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found.")

    landed_calc = procurement_service.calculate_landed_cost(
        material_price=quote_in.extracted_price,
        quantity=quote_in.quantity,
        supplier_city=supplier.city,
        delivery_terms=quote_in.delivery_terms,
        distance_km=supplier.distance_km,
    )

    quote = Quote(
        supplier_id=quote_in.supplier_id,
        item_name=quote_in.item_name,
        sku_match=quote_in.sku_match,
        raw_message=quote_in.raw_message,
        extracted_price=quote_in.extracted_price,
        quantity=quote_in.quantity,
        unit=quote_in.unit,
        delivery_terms=quote_in.delivery_terms,
        freight_cost_est=landed_calc["estimated_freight"],
        landed_cost_unit=landed_calc["landed_cost_unit"],
        lead_time_days=quote_in.lead_time_days,
        notes=quote_in.notes,
        status="PENDING",
        ai_confidence=0.95,
    )

    db.add(quote)
    db.commit()
    db.refresh(quote)
    return quote

@router.patch("/{quote_id}/status", response_model=QuoteOut)
def update_quote_status(
    quote_id: int,
    status_update: QuoteStatusUpdate,
    db: Session = Depends(get_db)
):
    """Human-in-the-Loop decision gate: Approve or Reject."""
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found.")

    new_status = status_update.status.upper()
    quote.status = new_status
    if status_update.approval_notes:
        quote.notes = (quote.notes or "") + f" [Owner Decision: {status_update.approval_notes}]"

    if new_status == "APPROVED" and quote.sku_match:
        inv_item = db.query(InventoryItem).filter(InventoryItem.sku == quote.sku_match).first()
        if inv_item:
            inv_item.current_unit_cost = quote.landed_cost_unit

    db.commit()
    db.refresh(quote)
    return quote

@router.get("/{quote_id}", response_model=QuoteOut)
def get_quote_detail(quote_id: int, db: Session = Depends(get_db)):
    """Retrieve full quote detail."""
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found.")
    return quote
