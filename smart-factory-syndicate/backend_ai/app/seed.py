from app.database import engine, Base, SessionLocal
from app.models import Factory, Supplier, InventoryItem, Quote, IndustrialCluster, SyndicatePool, SyndicateParticipant, MilkRunRoute
from app.services.procurement_service import procurement_service
from app.services.cluster_agent import cluster_agent

def seed_syndicate_cluster(db):
    """Seeds Phase 4 Industrial Cluster, demand pools, and neighbor participants."""
    if db.query(IndustrialCluster).first():
        print("Syndicate cluster data already exists. Skipping.")
        return

    print("Seeding Phase 4 Responsive AI Cluster Syndicate data...")
    # 1. Industrial Cluster
    cluster = IndustrialCluster(
        name="Pune-Pimpri-Chakan Automotive & Fabrication Corridor",
        corridor_region="Western Maharashtra (PMRDA Belt)",
        center_lat=18.6750,
        center_lng=73.8400,
        radius_km=30.0,
    )
    db.add(cluster)
    db.commit()
    db.refresh(cluster)

    # 2. Syndicate Pool 1: CRCA Steel (Primary Demo)
    pool1 = SyndicatePool(
        cluster_id=cluster.id,
        commodity_name="CRCA Mild Steel Sheet 1.2mm (Grade D)",
        sku_pattern="RAW-STL-001",
        target_bulk_quantity=50.0,
        current_pooled_quantity=42.0,
        unit="MT",
        primary_mill_name="Tata Steel / JSW Khopoli Flat Products Mill",
        benchmark_retail_price=68500.0,
        negotiated_bulk_price=61200.0,
        tier_discount_pct=10.65,
        status="OPEN_FOR_POOLING",
    )
    db.add(pool1)
    db.commit()
    db.refresh(pool1)

    participants_pool1 = [
        SyndicateParticipant(
            pool_id=pool1.id,
            factory_name="Apex Precision Fabrications Ltd.",
            factory_city="Pune",
            location_area="Bhosari MIDC (W-Block)",
            allocated_quantity=18.0,
            unit="MT",
            status="CONFIRMED",
        ),
        SyndicateParticipant(
            pool_id=pool1.id,
            factory_name="Shree Ganesh Auto Forgings Pvt Ltd",
            factory_city="Pune",
            location_area="Chakan MIDC Phase 2",
            allocated_quantity=14.0,
            unit="MT",
            status="CONFIRMED",
        ),
        SyndicateParticipant(
            pool_id=pool1.id,
            factory_name="Maratha Precision Stamping Works",
            factory_city="Pune",
            location_area="Pimpri Industrial Estate",
            allocated_quantity=10.0,
            unit="MT",
            status="CONFIRMED",
        ),
    ]
    for pt in participants_pool1:
        db.add(pt)
    db.commit()

    # Pre-optimize Fleetbase Milk-Run route for Pool 1
    cluster_agent.optimize_milk_run_route(pool1.id, db)

    # 3. Syndicate Pool 2: Aluminum Extrusions
    pool2 = SyndicatePool(
        cluster_id=cluster.id,
        commodity_name="Aluminum Extrusion Rod 6061-T6 (Dia 50mm)",
        sku_pattern="RAW-ALU-002",
        target_bulk_quantity=25.0,
        current_pooled_quantity=18.5,
        unit="MT",
        primary_mill_name="Hindalco Renukoot / Belagavi Depot",
        benchmark_retail_price=242000.0,
        negotiated_bulk_price=221500.0,
        tier_discount_pct=8.47,
        status="OPEN_FOR_POOLING",
    )
    db.add(pool2)
    db.commit()
    db.refresh(pool2)

    participants_pool2 = [
        SyndicateParticipant(
            pool_id=pool2.id,
            factory_name="Apex Precision Fabrications Ltd.",
            factory_city="Pune",
            location_area="Bhosari MIDC (W-Block)",
            allocated_quantity=10.5,
            unit="MT",
            status="CONFIRMED",
        ),
        SyndicateParticipant(
            pool_id=pool2.id,
            factory_name="Western India Toolings & Moulds",
            factory_city="Pune",
            location_area="Talawade Auto Park",
            allocated_quantity=8.0,
            unit="MT",
            status="CONFIRMED",
        ),
    ]
    for pt in participants_pool2:
        db.add(pt)
    db.commit()

    # Pre-optimize Fleetbase Milk-Run route for Pool 2
    cluster_agent.optimize_milk_run_route(pool2.id, db)
    print("Syndicate cluster and milk-run routes successfully seeded!")

def seed_database():
    """Initializes tables and seeds realistic factory, supplier, and quote data."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if factory data already exists
    if db.query(Factory).first():
        print("Core factory database already seeded. Verifying syndicate data...")
        seed_syndicate_cluster(db)
        db.close()
        return

    print("Seeding Smart Factory Syndicate demo dataset...")

    # 1. Create Factory
    factory = Factory(
        name="Apex Precision Fabrications Ltd.",
        city="Pune",
        address="Plot W-72, MIDC Bhosari Industrial Area, Pune 411026",
        contact_email="operations@apexsteel.in",
        contact_phone="+91-9823012345",
        fleetbase_place_id="flb_plc_pune_hub_01"
    )
    db.add(factory)
    db.commit()
    db.refresh(factory)

    # 2. Create Suppliers
    suppliers_data = [
        {
            "name": "Tata / Jindal Steel Distributors (Mahalaxmi Metals)",
            "category": "Prime Steel & Sheets",
            "phone": "+91-9820011223",
            "email": "sales@mahalaxmisteels.com",
            "city": "Mumbai",
            "distance_km": 150.0,
            "rating": 4.8,
            "payment_terms": "Net 30 Days",
            "fleetbase_vendor_id": "flb_vdr_00101",
        },
        {
            "name": "Gujarat Extrusions & Alloys Corp",
            "category": "Aluminum & Non-Ferrous",
            "phone": "+91-9712345678",
            "email": "quotes@gujratextrusions.in",
            "city": "Ahmedabad",
            "distance_km": 660.0,
            "rating": 4.6,
            "payment_terms": "Advance 20%, Balance on LR",
            "fleetbase_vendor_id": "flb_vdr_00102",
        },
        {
            "name": "Kolhapur Brass & Forging Works",
            "category": "Brass & Copper Rods",
            "phone": "+91-9422098765",
            "email": "contact@kolhapurbrass.com",
            "city": "Kolhapur",
            "distance_km": 235.0,
            "rating": 4.3,
            "payment_terms": "Immediate on Delivery",
            "fleetbase_vendor_id": "flb_vdr_00103",
        },
        {
            "name": "Apex Fasteners & Hardware Syndicate",
            "category": "Industrial Fasteners",
            "phone": "+91-9890123456",
            "email": "orders@apexfasteners.co.in",
            "city": "Pune",
            "distance_km": 18.0,
            "rating": 4.9,
            "payment_terms": "Net 15 Days",
            "fleetbase_vendor_id": "flb_vdr_00104",
        },
    ]

    supplier_objs = []
    for s in suppliers_data:
        sup = Supplier(**s)
        db.add(sup)
        supplier_objs.append(sup)
    db.commit()

    # 3. Create Inventory Items
    inventory_data = [
        {
            "factory_id": factory.id,
            "sku": "RAW-STL-001",
            "name": "CRCA Mild Steel Sheet 1.2mm (Grade D)",
            "category": "Prime Steel & Sheets",
            "current_stock": 4.2,  # Low stock! Minimum is 10.0
            "minimum_stock": 10.0,
            "reorder_quantity": 20.0,
            "unit": "MT",
            "current_unit_cost": 69500.0,
            "reorder_triggered": True,
        },
        {
            "factory_id": factory.id,
            "sku": "RAW-ALU-002",
            "name": "Aluminum Rod 6061-T6 (Dia 50mm)",
            "category": "Aluminum & Non-Ferrous",
            "current_stock": 18.5,
            "minimum_stock": 8.0,
            "reorder_quantity": 15.0,
            "unit": "MT",
            "current_unit_cost": 242000.0,
            "reorder_triggered": False,
        },
        {
            "factory_id": factory.id,
            "sku": "RAW-BRS-003",
            "name": "Brass Hex Bar CW614N (19mm A/F)",
            "category": "Brass & Copper Rods",
            "current_stock": 1.2,  # Low stock!
            "minimum_stock": 3.0,
            "reorder_quantity": 5.0,
            "unit": "MT",
            "current_unit_cost": 485000.0,
            "reorder_triggered": True,
        },
        {
            "factory_id": factory.id,
            "sku": "RAW-FST-004",
            "name": "M12 High Tensile 8.8 Hex Bolt x 45mm",
            "category": "Industrial Fasteners",
            "current_stock": 8500.0,
            "minimum_stock": 3000.0,
            "reorder_quantity": 10000.0,
            "unit": "Pcs",
            "current_unit_cost": 19.2,
            "reorder_triggered": False,
        },
        {
            "factory_id": factory.id,
            "sku": "RAW-COP-005",
            "name": "Electrolytic Copper Busbar Strip 25x3mm",
            "category": "Brass & Copper Rods",
            "current_stock": 0.8,  # Critical stock!
            "minimum_stock": 2.5,
            "reorder_quantity": 4.0,
            "unit": "MT",
            "current_unit_cost": 740000.0,
            "reorder_triggered": True,
        },
    ]

    for inv in inventory_data:
        db.add(InventoryItem(**inv))
    db.commit()

    # 4. Create Sample Incoming WhatsApp Quotes with Landed Cost calculations
    quotes_data = [
        {
            "supplier_id": supplier_objs[0].id,
            "item_name": "CRCA Mild Steel Sheet 1.2mm",
            "sku_match": "RAW-STL-001",
            "raw_message": "Namaste Sharma ji, Tata CRCA 1.2mm fresh coils @ ₹67,800/MT ex-Navi Mumbai yard. 12 MT ready. Freight to Bhosari will be approx ₹8,500 by 10T truck. Payment 30 days as usual.",
            "extracted_price": 67800.0,
            "quantity": 10.0,
            "unit": "MT",
            "delivery_terms": "Ex-Factory",
            "lead_time_days": 2,
            "notes": "Lowest material base price this month; Fleetbase calculated ₹8,790 freight.",
        },
        {
            "supplier_id": supplier_objs[1].id,
            "item_name": "Aluminum Rod 6061-T6 Dia 50mm",
            "sku_match": "RAW-ALU-002",
            "raw_message": "Sir, Ahmedabad depot rate for 6061-T6 rods is ₹238/kg (₹238,000/MT). For 15 MT batch we can offer door delivery free (FOR Pune). Dispatch within 48 hrs.",
            "extracted_price": 238000.0,
            "quantity": 15.0,
            "unit": "MT",
            "delivery_terms": "Doorstep included",
            "lead_time_days": 3,
            "notes": "Doorstep freight waived for bulk 15 MT order. Syndicate pooling candidate.",
        },
        {
            "supplier_id": supplier_objs[2].id,
            "item_name": "Brass Hex Bar CW614N 19mm",
            "sku_match": "RAW-BRS-003",
            "raw_message": "Bhaiya, Kolhapur stock CW614N brass hex 19mm ready. Rate ₹472/kg (₹472,000/MT) ex-works. 3 MT available. Truck freight Kolhapur-Pune ₹12,500. Cash discount 1.5% if RTGS today.",
            "extracted_price": 472000.0,
            "quantity": 3.0,
            "unit": "MT",
            "delivery_terms": "Ex-Factory",
            "lead_time_days": 1,
            "notes": "Fastest dispatch (1 day). Urgent reorder for critical inventory stock.",
        },
        {
            "supplier_id": supplier_objs[3].id,
            "item_name": "M12 HT 8.8 Hex Bolts x 45mm",
            "sku_match": "RAW-FST-004",
            "raw_message": "Apex Fasteners Pune: M12x45 Zinc Plated 8.8 grade in stock. Special price ₹17.90/pc for 10,000 pcs lot. Local delivery free in Bhosari MIDC within 4 hours.",
            "extracted_price": 17.90,
            "quantity": 10000.0,
            "unit": "Pcs",
            "delivery_terms": "Doorstep included",
            "lead_time_days": 1,
            "notes": "Local supplier, immediate 4h delivery, saves 6.8% over previous batch cost.",
        },
    ]

    for q in quotes_data:
        sup = db.query(Supplier).filter(Supplier.id == q["supplier_id"]).first()
        landed = procurement_service.calculate_landed_cost(
            material_price=q["extracted_price"],
            quantity=q["quantity"],
            supplier_city=sup.city,
            delivery_terms=q["delivery_terms"],
            distance_km=sup.distance_km,
        )
        quote_obj = Quote(
            supplier_id=q["supplier_id"],
            item_name=q["item_name"],
            sku_match=q["sku_match"],
            raw_message=q["raw_message"],
            extracted_price=q["extracted_price"],
            quantity=q["quantity"],
            unit=q["unit"],
            delivery_terms=q["delivery_terms"],
            freight_cost_est=landed["estimated_freight"],
            landed_cost_unit=landed["landed_cost_unit"],
            lead_time_days=q["lead_time_days"],
            notes=q["notes"],
            status="PENDING",
            ai_confidence=0.96,
        )
        db.add(quote_obj)

    db.commit()
    seed_syndicate_cluster(db)
    print("Database seeding completed successfully!")
    db.close()

if __name__ == "__main__":
    seed_database()

