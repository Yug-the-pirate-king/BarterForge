import logging
from typing import Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.models import InventoryItem, Quote
from app.services.fleetbase_service import fleetbase_client

logger = logging.getLogger("uvicorn.error")

class BuyerRFQRequest(BaseModel):
    buyer_name: str = Field(..., description="Buyer or client organization name (e.g. Bajaj Auto Ltd)")
    buyer_location: str = Field(default="Chakan", description="Delivery destination city or industrial corridor")
    item_name: str = Field(..., description="Raw material or fabricated part name")
    quantity: float = Field(..., description="Order quantity")
    unit: str = Field(default="MT", description="MT, KG, Pcs")
    processing_overhead_per_unit: float = Field(default=3500.0, description="Factory machining / slitting overhead in INR")
    target_margin_pct: float = Field(default=18.0, description="Factory owner's desired profit margin percentage")
    customer_budget_target_price: Optional[float] = Field(None, description="Optional target price requested by buyer")

class BiddingAgent:
    """
    Autonomous Bidding Agent:
    Formulates guaranteed-profit quotations for buyer RFQs by dynamically integrating:
    (1) Lowest Material Landed Cost + (2) Processing Overhead + (3) Fleetbase Outbound Transport + (4) Owner Margin.
    Protects factory owners from loss-making orders through automated margin guardrails.
    """

    @classmethod
    def formulate_buyer_bid(cls, rfq: BuyerRFQRequest, db: Session) -> Dict[str, Any]:
        # 1. Look up material baseline cost
        inv_item = db.query(InventoryItem).filter(
            InventoryItem.name.ilike(f"%{rfq.item_name[:8]}%")
        ).first()

        if inv_item and inv_item.current_unit_cost > 0:
            material_unit_cost = inv_item.current_unit_cost
            material_sku = inv_item.sku
        else:
            # Check latest approved quote
            approved_quote = db.query(Quote).filter(
                Quote.item_name.ilike(f"%{rfq.item_name[:8]}%"),
                Quote.status == "APPROVED"
            ).order_by(Quote.created_at.desc()).first()

            if approved_quote:
                material_unit_cost = approved_quote.landed_cost_unit
                material_sku = approved_quote.sku_match or "RAW-EST-01"
            else:
                material_unit_cost = 68000.0 if "steel" in rfq.item_name.lower() else (240000.0 if "alu" in rfq.item_name.lower() else 18.5)
                material_sku = "RAW-BENCHMARK"

        total_material_cost = material_unit_cost * rfq.quantity
        total_processing_cost = rfq.processing_overhead_per_unit * rfq.quantity

        # 2. Compute Fleetbase Outbound Freight from Pune Factory to Buyer Location
        freight_calc = fleetbase_client.calculate_freight_and_route(
            origin_city="Pune",
            destination_city=rfq.buyer_location,
            weight_metric_tons=rfq.quantity if rfq.unit == "MT" else (rfq.quantity * 0.001),
        )
        outbound_freight_total = freight_calc["total_freight"]

        # 3. True Total Factory Cost (Cost of Goods Sold + Logistics)
        total_cog_and_logistics = total_material_cost + total_processing_cost + outbound_freight_total
        cost_per_unit = round(total_cog_and_logistics / max(rfq.quantity, 0.001), 2)

        # 4. Profit Margin Formulation
        margin_multiplier = 1.0 + (rfq.target_margin_pct / 100.0)
        suggested_total_quote = round(total_cog_and_logistics * margin_multiplier, 2)
        suggested_unit_quote = round(suggested_total_quote / max(rfq.quantity, 0.001), 2)
        net_profit_inr = round(suggested_total_quote - total_cog_and_logistics, 2)

        # 5. Guardrail Analysis: Check against Customer Budget if provided
        guardrail_status = "OPTIMAL_MARGIN"
        warning_message = None
        actual_margin_pct = rfq.target_margin_pct

        if rfq.customer_budget_target_price:
            budget_total = rfq.customer_budget_target_price * rfq.quantity
            budget_margin = ((budget_total - total_cog_and_logistics) / max(total_cog_and_logistics, 1)) * 100

            if budget_total < total_cog_and_logistics:
                guardrail_status = "CRITICAL_LOSS_BLOCKED"
                loss_amount = round(total_cog_and_logistics - budget_total, 2)
                warning_message = (
                    f"GUARDRAIL TRIGGERED: Buyer target price of ₹{rfq.customer_budget_target_price:,.2f}/{rfq.unit} "
                    f"results in a NET LOSS of ₹{loss_amount:,.2f} due to freight & processing overhead! "
                    f"Minimum safe break-even bid is ₹{cost_per_unit:,.2f}/{rfq.unit}."
                )
                actual_margin_pct = round(budget_margin, 2)
            elif budget_margin < 12.0:
                guardrail_status = "LOW_MARGIN_WARNING"
                warning_message = (
                    f"CAUTION: Margin is only {budget_margin:.1f}% (below owner target of {rfq.target_margin_pct}%). "
                    f"Recommend counter-offering at least ₹{suggested_unit_quote:,.2f}/{rfq.unit}."
                )
                actual_margin_pct = round(budget_margin, 2)

        # 6. Formulate Executive Quotation Text
        proposal_text = (
            f"COMMERCIAL PROPOSAL FOR {rfq.buyer_name.upper()}\n"
            f"Item: {rfq.item_name} | Quantity: {rfq.quantity} {rfq.unit}\n"
            f"Delivery Location: {rfq.buyer_location} (Transit via Fleetbase Fleet-Ops)\n"
            f"Quoted Rate: ₹{suggested_unit_quote:,.2f} / {rfq.unit} (All Inclusive Doorstep)\n"
            f"Total Proposal Value: ₹{suggested_total_quote:,.2f}\n"
            f"Dispatch: Within 3 business days from PO receipt."
        )

        return {
            "buyer_name": rfq.buyer_name,
            "buyer_location": rfq.buyer_location,
            "item_name": rfq.item_name,
            "matched_sku": material_sku,
            "quantity": rfq.quantity,
            "unit": rfq.unit,
            "breakdown": {
                "raw_material_unit_cost": material_unit_cost,
                "total_raw_material_cost": round(total_material_cost, 2),
                "total_processing_overhead": round(total_processing_cost, 2),
                "fleetbase_outbound_freight": outbound_freight_total,
                "fleetbase_distance_km": freight_calc["distance_km"],
                "total_cost_of_goods_and_freight": round(total_cog_and_logistics, 2),
                "total_cost_per_unit": cost_per_unit,
            },
            "quotation": {
                "suggested_unit_price": suggested_unit_quote,
                "suggested_total_price": suggested_total_quote,
                "net_profit_amount": net_profit_inr,
                "margin_percentage": actual_margin_pct,
            },
            "guardrail": {
                "status": guardrail_status,
                "warning_message": warning_message,
                "safe_to_dispatch": guardrail_status != "CRITICAL_LOSS_BLOCKED",
            },
            "formal_proposal_text": proposal_text,
            "formulated_at": datetime.utcnow().isoformat(),
        }

bidding_agent = BiddingAgent()

