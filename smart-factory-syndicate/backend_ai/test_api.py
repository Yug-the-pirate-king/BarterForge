import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OPERATIONAL"
    assert "Smart Factory Syndicate" in data["platform"]

def test_dashboard_stats():
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_inventory_items" in data
    assert data["total_inventory_items"] >= 5
    assert data["low_stock_alerts_count"] >= 1
    assert data["pending_quotes_count"] >= 1

def test_inventory_list():
    response = client.get("/api/inventory")
    assert response.status_code == 200
    items = response.json()
    assert len(items) >= 5
    skus = [i["sku"] for i in items]
    assert "RAW-STL-001" in skus

def test_quotes_list():
    response = client.get("/api/quotes")
    assert response.status_code == 200
    quotes = response.json()
    assert len(quotes) >= 4
    first = quotes[0]
    assert "landed_cost_unit" in first
    assert first["landed_cost_unit"] > 0

def test_quote_human_in_the_loop_approval():
    # Fetch pending quotes
    response = client.get("/api/quotes?status=PENDING")
    assert response.status_code == 200
    quotes = response.json()
    assert len(quotes) > 0
    target_quote_id = quotes[0]["id"]

    # Factory Owner clicks Approve
    approval_payload = {
        "status": "APPROVED",
        "approval_notes": "Approved by Owner - optimal landed price."
    }
    appr_resp = client.patch(f"/api/quotes/{target_quote_id}/status", json=approval_payload)
    assert appr_resp.status_code == 200
    data = appr_resp.json()
    assert data["status"] == "APPROVED"
    assert "optimal landed price" in data["notes"]

def test_landed_cost_calculation():
    payload = {
        "material_cost_per_unit": 68000.0,
        "quantity": 10.0,
        "supplier_city": "Mumbai",
        "factory_city": "Pune",
        "vehicle_type": "10_ton_truck",
        "margin_percentage": 18.0
    }
    response = client.post("/api/fleetbase/calculate-landed-cost", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["raw_material_total"] == 680000.0
    assert data["total_freight"] > 0
    assert data["landed_cost_total"] > data["raw_material_total"]
    assert data["suggested_selling_price"] > data["landed_cost_total"]
    assert data["margin_percentage"] == 18.0

if __name__ == "__main__":
    pytest.main(["-v", "test_api.py"])

