from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Factory(Base):
    __tablename__ = "factories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    city = Column(String(100), default="Pune")
    address = Column(String(255), default="Plot 42, Bhosari MIDC, Pune 411026")
    contact_email = Column(String(100), default="operations@apexsteel.in")
    contact_phone = Column(String(50), default="+91-9876543210")
    fleetbase_place_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    inventory_items = relationship("InventoryItem", back_populates="factory", cascade="all, delete-orphan")


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), default="Raw Materials")
    phone = Column(String(50), nullable=False)
    email = Column(String(100), nullable=True)
    city = Column(String(100), default="Mumbai")
    distance_km = Column(Float, default=145.0)  # Distance from factory
    rating = Column(Float, default=4.5)
    fleetbase_vendor_id = Column(String(100), nullable=True)
    payment_terms = Column(String(100), default="Net 30 Days")
    created_at = Column(DateTime, default=datetime.utcnow)

    quotes = relationship("Quote", back_populates="supplier", cascade="all, delete-orphan")


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(100), default="Sheet Metals")
    current_stock = Column(Float, default=0.0)
    minimum_stock = Column(Float, default=10.0)  # Safety stock threshold
    reorder_quantity = Column(Float, default=25.0)
    unit = Column(String(20), default="MT")  # Metric Ton, KG, Pcs
    current_unit_cost = Column(Float, default=0.0)  # Average historic cost
    reorder_triggered = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    factory = relationship("Factory", back_populates="inventory_items")


class Quote(Base):
    __tablename__ = "quotes"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    item_name = Column(String(255), nullable=False)
    sku_match = Column(String(50), nullable=True)
    raw_message = Column(Text, nullable=True)  # Original WhatsApp message / PDF snippet
    extracted_price = Column(Float, nullable=False)  # Unit price extracted
    quantity = Column(Float, default=1.0)
    unit = Column(String(20), default="MT")
    delivery_terms = Column(String(100), default="Ex-Factory")
    freight_cost_est = Column(Float, default=0.0)  # Fleetbase calculated freight
    landed_cost_unit = Column(Float, default=0.0)  # (extracted_price * qty + freight) / qty
    status = Column(String(20), default="PENDING")  # PENDING, APPROVED, REJECTED
    ai_confidence = Column(Float, default=0.92)
    lead_time_days = Column(Integer, default=3)
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    supplier = relationship("Supplier", back_populates="quotes")


class FleetbaseSyncLog(Base):
    __tablename__ = "fleetbase_sync_logs"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False)  # VENDOR, PLACE, ORDER
    local_id = Column(Integer, nullable=False)
    fleetbase_id = Column(String(100), nullable=False)
    status = Column(String(20), default="SYNCED")
    sync_details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# --- Phase 4: Responsive AI Syndicate & Demand Pooling Models ---

class IndustrialCluster(Base):
    __tablename__ = "industrial_clusters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    corridor_region = Column(String(100), default="Pune Industrial Corridor")
    center_lat = Column(Float, default=18.6298)
    center_lng = Column(Float, default=73.8131)
    radius_km = Column(Float, default=35.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    pools = relationship("SyndicatePool", back_populates="cluster", cascade="all, delete-orphan")


class SyndicatePool(Base):
    __tablename__ = "syndicate_pools"

    id = Column(Integer, primary_key=True, index=True)
    cluster_id = Column(Integer, ForeignKey("industrial_clusters.id"), nullable=False)
    commodity_name = Column(String(255), nullable=False)
    sku_pattern = Column(String(50), default="RAW-STL-001")
    target_bulk_quantity = Column(Float, default=50.0)  # Threshold to unlock tier-1 bulk discount
    current_pooled_quantity = Column(Float, default=0.0)
    unit = Column(String(20), default="MT")
    primary_mill_name = Column(String(255), default="Tata Steel / JSW Primary Mill")
    benchmark_retail_price = Column(Float, default=68500.0)
    negotiated_bulk_price = Column(Float, default=61200.0)  # Bulk tier price
    tier_discount_pct = Column(Float, default=10.65)
    status = Column(String(30), default="OPEN_FOR_POOLING")  # OPEN_FOR_POOLING, READY_TO_EXECUTE, DISPATCHED
    created_at = Column(DateTime, default=datetime.utcnow)

    cluster = relationship("IndustrialCluster", back_populates="pools")
    participants = relationship("SyndicateParticipant", back_populates="pool", cascade="all, delete-orphan")
    milk_run = relationship("MilkRunRoute", back_populates="pool", uselist=False, cascade="all, delete-orphan")


class SyndicateParticipant(Base):
    __tablename__ = "syndicate_participants"

    id = Column(Integer, primary_key=True, index=True)
    pool_id = Column(Integer, ForeignKey("syndicate_pools.id"), nullable=False)
    factory_name = Column(String(255), nullable=False)
    factory_city = Column(String(100), default="Pune")
    location_area = Column(String(100), default="Bhosari MIDC")
    allocated_quantity = Column(Float, nullable=False)
    unit = Column(String(20), default="MT")
    material_savings_inr = Column(Float, default=0.0)
    freight_savings_inr = Column(Float, default=0.0)
    total_savings_inr = Column(Float, default=0.0)
    status = Column(String(20), default="CONFIRMED")
    created_at = Column(DateTime, default=datetime.utcnow)

    pool = relationship("SyndicatePool", back_populates="participants")


class MilkRunRoute(Base):
    __tablename__ = "milk_run_routes"

    id = Column(Integer, primary_key=True, index=True)
    pool_id = Column(Integer, ForeignKey("syndicate_pools.id"), nullable=False)
    fleetbase_order_id = Column(String(100), nullable=False)
    tracking_number = Column(String(100), nullable=False)
    vehicle_type = Column(String(50), default="trailer_25t")
    stops_manifest = Column(Text, nullable=False)  # JSON representation of sequential stops
    total_distance_km = Column(Float, default=185.0)
    consolidated_freight_inr = Column(Float, default=24500.0)
    solo_freight_benchmark_inr = Column(Float, default=41200.0)
    freight_savings_pct = Column(Float, default=40.5)
    status = Column(String(30), default="OPTIMIZED")
    created_at = Column(DateTime, default=datetime.utcnow)

    pool = relationship("SyndicatePool", back_populates="milk_run")

