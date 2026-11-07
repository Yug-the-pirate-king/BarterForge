from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.procurement_agent import procurement_agent
from app.services.bidding_agent import bidding_agent, BuyerRFQRequest

router = APIRouter(prefix="/agents", tags=["Multi-Agent Syndicate"])

@router.get("/status")
def get_agents_status():
    """Retrieve operational status and active tasks of all multi-agent syndicate workers."""
    return {
        "agents": [
            {
                "id": "agent_procurement",
                "name": "Autonomous Procurement Agent",
                "role": "Continuous inventory stock monitoring, quote benchmarking & RFQ generation",
                "status": "ACTIVE_MONITORING",
                "mode": "Human-in-the-Loop",
                "last_run": "Continuous",
                "active_alerts_count": 3,
            },
            {
                "id": "agent_bidding",
                "name": "Landed-Cost Bidding Agent",
                "role": "Calculates buyer quotes with Fleetbase freight & margin guardrails",
                "status": "OPERATIONAL",
                "mode": "Bounded Execution",
                "last_run": "On-Demand RFQ",
                "guardrail_enforcement": "Active (<12% blocked)",
            },
            {
                "id": "agent_cluster",
                "name": "Cluster Syndicate Agent",
                "role": "Multi-factory demand pooling & Fleetbase consolidated milk-run routing",
                "status": "PHASE_4_STANDBY",
                "mode": "Collaborative Pooling",
                "last_run": "Scheduled",
                "target_clusters": "Pune-Chakan-Bhosari Corridor",
            },
        ]
    }

@router.get("/procurement/recommendations")
def get_procurement_recommendations(db: Session = Depends(get_db)):
    """
    Triggers Procurement Agent to scan inventory and generate ranked Top-3 purchasing
    strategies (Lowest Price, Fastest Delivery, Verified Local) for items below safety stock.
    """
    return procurement_agent.evaluate_inventory_needs(db)

@router.post("/bidding/formulate-bid")
def formulate_buyer_bid(rfq: BuyerRFQRequest, db: Session = Depends(get_db)):
    """
    Triggers Bidding Agent to calculate guaranteed-profit commercial bids for buyer RFQs,
    incorporating Fleetbase live transport and margin protection guardrails.
    """
    return bidding_agent.formulate_buyer_bid(rfq, db)

