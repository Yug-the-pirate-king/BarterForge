from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models import InventoryItem, Quote, Supplier
from app.services.fleetbase_service import fleetbase_client

class ProcurementService:
    """Core reasoning algorithms for inventory threshold alerting and landed cost analysis."""

    @staticmethod
    def calculate_landed_cost(
        material_price: float,
        quantity: float,
        supplier_city: str,
        delivery_terms: str,
        factory_city: str = "Pune",
        distance_km: float = 145.0,
    ) -> Dict[str, float]:
        """Calculates accurate landed cost incorporating freight rules."""
        total_material = material_price * quantity
        
        # If delivery terms is "Doorstep included" or "FOR Destination", supplier covers freight
        if "included" in delivery_terms.lower() or "for destination" in delivery_terms.lower():
            estimated_freight = 0.0
        else:
            freight_calc = fleetbase_client.calculate_freight_and_route(
                origin_city=supplier_city,
                destination_city=factory_city,
                distance_km=distance_km,
                weight_metric_tons=quantity,
            )
            estimated_freight = freight_calc["total_freight"]

        landed_total = total_material + estimated_freight
        landed_unit = round(landed_total / max(quantity, 0.001), 2)

        return {
            "total_material": round(total_material, 2),
            "estimated_freight": round(estimated_freight, 2),
            "landed_cost_total": round(landed_total, 2),
            "landed_cost_unit": landed_unit,
        }

    @staticmethod
    def check_and_update_reorder_status(db: Session) -> List[InventoryItem]:
        """Scans inventory items and flags those dropping below minimum safety stock."""
        items = db.query(InventoryItem).all()
        low_stock_items = []
        for item in items:
            if item.current_stock <= item.minimum_stock:
                item.reorder_triggered = True
                low_stock_items.append(item)
            else:
                item.reorder_triggered = False
        db.commit()
        return low_stock_items

procurement_service = ProcurementService()

