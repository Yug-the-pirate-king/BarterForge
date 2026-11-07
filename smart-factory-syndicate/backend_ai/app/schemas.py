from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

# --- Factory Schemas ---
class FactoryBase(BaseModel):
    name: str
    city: str = "Pune"
    address: str = "Plot 42, Bhosari MIDC, Pune 411026"
    contact_email: str = "operations@apexsteel.in"
    contact_phone: str = "+91-9876543210"
    fleetbase_place_id: Optional[str] = None

class FactoryCreate(FactoryBase):
    pass

class FactoryOut(FactoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Supplier Schemas ---
class SupplierBase(BaseModel):
    name: str
    category: str = "Raw Materials"
    phone: str
    email: Optional[str] = None
    city: str = "Mumbai"
    distance_km: float = 145.0
    rating: float = 4.5
    fleetbase_vendor_id: Optional[str] = None
    payment_terms: str = "Net 30 Days"

class SupplierCreate(SupplierBase):
    pass

class SupplierOut(SupplierBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Inventory Schemas ---
class InventoryItemBase(BaseModel):
    sku: str
    name: str
    category: str = "Sheet Metals"
    current_stock: float
    minimum_stock: float = 10.0
    reorder_quantity: float = 25.0
    unit: str = "MT"
    current_unit_cost: float = 0.0

class InventoryItemCreate(InventoryItemBase):
    factory_id: int = 1

class InventoryItemUpdate(BaseModel):
    current_stock: Optional[float] = None
    minimum_stock: Optional[float] = None
    reorder_quantity: Optional[float] = None
    current_unit_cost: Optional[float] = None

class InventoryItemOut(InventoryItemBase):
    id: int
    factory_id: int
    reorder_triggered: bool
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Quote Schemas ---
class QuoteBase(BaseModel):
    supplier_id: int
    item_name: str
    sku_match: Optional[str] = None
    raw_message: Optional[str] = None
    extracted_price: float
    quantity: float = 1.0
    unit: str = "MT"
    delivery_terms: str = "Ex-Factory"
    freight_cost_est: float = 0.0
    lead_time_days: int = 3
    notes: Optional[str] = None

class QuoteCreate(QuoteBase):
    pass

class QuoteStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(APPROVED|REJECTED|PENDING)$")
    approval_notes: Optional[str] = None

class QuoteOut(QuoteBase):
    id: int
    landed_cost_unit: float
    status: str
    ai_confidence: float
    created_at: datetime
    supplier: Optional[SupplierOut] = None

    class Config:
        from_attributes = True


# --- Landed Cost Calculation Schema ---
class LandedCostRequest(BaseModel):
    material_cost_per_unit: float
    quantity: float
    supplier_city: str
    factory_city: str = "Pune"
    distance_km: Optional[float] = None
    vehicle_type: str = "10_ton_truck"
    margin_percentage: float = 15.0

class LandedCostResponse(BaseModel):
    raw_material_total: float
    distance_km: float
    freight_rate_per_km: float
    total_freight: float
    landed_cost_total: float
    landed_cost_per_unit: float
    suggested_selling_price: float
    net_margin_amount: float
    margin_percentage: float
    fleetbase_routing_source: str


# --- Dashboard KPI Schema ---
class DashboardStats(BaseModel):
    total_inventory_items: int
    low_stock_alerts_count: int
    pending_quotes_count: int
    active_suppliers_count: int
    estimated_inventory_value_inr: float
    projected_syndicate_savings_inr: float
    fleetbase_connection_status: str

