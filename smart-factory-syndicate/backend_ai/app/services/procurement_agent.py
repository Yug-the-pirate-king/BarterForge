import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import InventoryItem, Quote, Supplier, Factory
from app.services.fleetbase_service import fleetbase_client

logger = logging.getLogger("uvicorn.error")

class ProcurementAgent:
    """
    Autonomous Procurement Agent:
    Monitors factory inventory levels, detects low-stock conditions,
    queries the database for available supplier bids, and ranks the
    Top 3 procurement strategies for the factory owner.
    """

    @classmethod
    def evaluate_inventory_needs(cls, db: Session) -> List[Dict[str, Any]]:
        """
        Scans all inventory items and generates smart procurement recommendations
        for every item dipping below its safety stock threshold.
        """
        factory = db.query(Factory).first()
        factory_city = factory.city if factory else "Pune"
        
        # Identify items needing reorder
        depleted_items = db.query(InventoryItem).filter(
            InventoryItem.current_stock <= InventoryItem.minimum_stock
        ).all()

        recommendations = []

        for item in depleted_items:
            reorder_qty = item.reorder_quantity
            deficit = round(item.minimum_stock - item.current_stock, 2)
            
            # Find relevant quotes for this item (by SKU match or name)
            quotes = db.query(Quote).filter(
                (Quote.sku_match == item.sku) | (Quote.item_name.ilike(f"%{item.name[:8]}%"))
            ).all()

            evaluated_options = []

            for q in quotes:
                supplier = db.query(Supplier).filter(Supplier.id == q.supplier_id).first()
                if not supplier:
                    continue

                # Calculate fresh landed cost for the needed reorder quantity
                freight_info = fleetbase_client.calculate_freight_and_route(
                    origin_city=supplier.city,
                    destination_city=factory_city,
                    distance_km=supplier.distance_km,
                    weight_metric_tons=reorder_qty if item.unit == "MT" else (reorder_qty * 0.001),
                )
                
                material_total = q.extracted_price * reorder_qty
                freight_total = freight_info["total_freight"] if "included" not in q.delivery_terms.lower() else 0.0
                total_landed = material_total + freight_total
                landed_per_unit = round(total_landed / max(reorder_qty, 0.001), 2)

                # Historic cost comparison: savings vs current baseline
                savings_per_unit = round(item.current_unit_cost - landed_per_unit, 2)
                total_savings = round(savings_per_unit * reorder_qty, 2)

                # Composite score (Lower landed cost = higher score, faster delivery = higher score)
                cost_score = max(0, 100 - ((landed_per_unit / max(item.current_unit_cost, 1)) * 50))
                speed_score = max(0, 100 - (q.lead_time_days * 15))
                rating_score = (supplier.rating / 5.0) * 100
                composite_score = round((cost_score * 0.50) + (speed_score * 0.30) + (rating_score * 0.20), 1)

                evaluated_options.append({
                    "quote_id": q.id,
                    "supplier_id": supplier.id,
                    "supplier_name": supplier.name,
                    "supplier_city": supplier.city,
                    "distance_km": supplier.distance_km,
                    "supplier_rating": supplier.rating,
                    "quoted_unit_price": q.extracted_price,
                    "freight_cost_est": freight_total,
                    "landed_cost_unit": landed_per_unit,
                    "total_order_cost": round(total_landed, 2),
                    "savings_vs_baseline": total_savings,
                    "lead_time_days": q.lead_time_days,
                    "payment_terms": q.supplier.payment_terms if q.supplier else supplier.payment_terms,
                    "composite_score": composite_score,
                })

            # Sort options by composite rank
            evaluated_options.sort(key=lambda x: x["composite_score"], reverse=True)
            top_3 = evaluated_options[:3]

            # Label strategies
            if len(top_3) >= 1:
                top_3[0]["strategy_label"] = "Best Value & Landed Price"
            if len(top_3) >= 2:
                # Find fastest option
                fastest = min(top_3, key=lambda x: x["lead_time_days"])
                if fastest != top_3[0]:
                    fastest["strategy_label"] = "Fastest Delivery (Critical Stock)"
                else:
                    top_3[1]["strategy_label"] = "High-Reliability Secondary"
            if len(top_3) >= 3:
                top_3[2]["strategy_label"] = "Verified Local Supplier"

            # Generate drafted WhatsApp RFQ ping for suppliers
            whatsapp_rfq_draft = (
                f"Namaste! From Apex Precision Fabrications, Pune. "
                f"We require immediate dispatch of {reorder_qty} {item.unit} of {item.name}. "
                f"Please reply with your latest rate ex-works or delivered to Bhosari MIDC Pune. Delivery within 3 days required."
            )

            recommendations.append({
                "item_id": item.id,
                "sku": item.sku,
                "name": item.name,
                "category": item.category,
                "current_stock": item.current_stock,
                "minimum_stock": item.minimum_stock,
                "deficit_stock": deficit,
                "recommended_order_qty": reorder_qty,
                "unit": item.unit,
                "current_baseline_cost": item.current_unit_cost,
                "urgency": "CRITICAL" if item.current_stock < (item.minimum_stock * 0.5) else "WARNING",
                "top_options": top_3,
                "draft_whatsapp_rfq": whatsapp_rfq_draft,
                "scanned_at": datetime.utcnow().isoformat(),
            })

        return recommendations

procurement_agent = ProcurementAgent()

