from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import IndustrialCluster, SyndicatePool, SyndicateParticipant, MilkRunRoute
from app.services.cluster_agent import cluster_agent

router = APIRouter(prefix="/syndicate", tags=["Responsive AI Clusters (Syndicate)"])

@router.get("/clusters")
def list_clusters(db: Session = Depends(get_db)):
    """Retrieve all mapped industrial corridors and their participating SME factories."""
    clusters = db.query(IndustrialCluster).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "region": c.corridor_region,
            "radius_km": c.radius_km,
            "center": {"lat": c.center_lat, "lng": c.center_lng},
            "active_pools_count": len(c.pools),
        }
        for c in clusters
    ]

@router.get("/pools")
def list_syndicate_pools(db: Session = Depends(get_db)):
    """List all active demand pooling syndicates with bulk discount tiers and participant breakdowns."""
    clusters = db.query(IndustrialCluster).all()
    all_pools = []
    for c in clusters:
        pools = cluster_agent.detect_and_pool_demand(c.id, db)
        all_pools.extend(pools)
    return all_pools

@router.post("/pools/{pool_id}/optimize-milk-run")
def optimize_milk_run(pool_id: int, db: Session = Depends(get_db)):
    """
    Fleetbase Fleet-Ops Integration:
    Calculates consolidated multi-stop milk-run delivery route,
    comparing individual truck costs against single trailer route to unlock up to 40% freight savings.
    """
    try:
        return cluster_agent.optimize_milk_run_route(pool_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/pools/{pool_id}/execute")
def execute_syndicate_po(pool_id: int, db: Session = Depends(get_db)):
    """
    1-Click Syndicate Execution:
    Locks Tier-1 mill bulk discount, dispatches Fleetbase multi-drop milk-run,
    and issues Ledger invoices to participating factory accounts.
    """
    try:
        return cluster_agent.execute_syndicate_po(pool_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

