# 🚚 Fleetbase Logistics OS Integration Guide

This directory ships and encapsulates all core Fleetbase Logistics OS capabilities required by **Smart Factory Syndicate**.

---

## 🏛️ Fleetbase Architectural Components

| Fleetbase Module | Role in Smart Factory Syndicate | Key Entities & Endpoints |
| :--- | :--- | :--- |
| **Fleet-Ops** | Multi-waypoint freight dispatch, real-time routing, and carrier tracking | `POST /v1/orders`, `GET /v1/routes`, `POST /v1/places`, `POST /v1/vendors` |
| **Ledger** | Landed Cost accounting, carrier payments, and sub-invoicing | `POST /v1/ledger/invoices`, `POST /v1/ledger/transactions` |
| **Pallet** | Factory warehouse raw material inventory & pick-lists | `GET /v1/pallet/inventory`, `POST /v1/pallet/batches` |
| **Storefront** | Multi-supplier marketplace catalog & RFQ exchange | `GET /v1/storefront/products`, `POST /v1/storefront/orders` |
| **SocketCluster** | Real-time GPS telematics & carrier tracking webhooks | WebSockets on `:38000` / `:8001` (`order.dispatched`, `order.delivered`) |

---

## 🗺️ Fleet-Ops Dynamic Routing & Indian Industrial Corridors

The platform calibrates live freight rates from the factory hub (**Pune MIDC Bhosari**) across major Indian industrial clusters:

| Corridor Route | Haul Distance | 1.5T Pickup (₹22/km) | 5T Eicher (₹32/km) | 10T Truck (₹45/km) | 25T Trailer (₹75/km) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Mumbai Yard $\rightarrow$ Pune MIDC** | 150 km | ₹4,265 | ₹6,336 | ₹8,790 | ₹15,175 |
| **Navi Mumbai $\rightarrow$ Pune MIDC** | 130 km | ₹3,803 | ₹5,654 | ₹7,858 | ₹13,565 |
| **Kolhapur $\rightarrow$ Pune MIDC** | 235 km | ₹6,229 | ₹9,248 | ₹12,897 | ₹22,208 |
| **Ahmedabad $\rightarrow$ Pune MIDC** | 660 km | ₹16,042 | ₹23,799 | ₹33,088 | ₹56,900 |
| **Surat $\rightarrow$ Pune MIDC** | 415 km | ₹10,402 | ₹15,447 | ₹21,557 | ₹37,125 |
| **Nagpur $\rightarrow$ Pune MIDC** | 710 km | ₹17,196 | ₹25,513 | ₹35,474 | ₹61,005 |

*Formula:* $\text{Freight} = (\text{Distance} \times \text{Rate/km}) \times (1 + \text{Toll Allowance}) + \text{Fixed Terminal Loading Fee}$

---

## 📦 Fleet-Ops Order Payload Schema (Dispatched Inbound Hauls)

```json
{
  "id": "order_04f4d3",
  "tracking_number": "FLB-IN-0006-6831",
  "status": "DISPATCH_REQUESTED",
  "type": "raw_material_inbound",
  "payload": {
    "pickup": {
      "name": "Tata / Jindal Steel Distributors Yard",
      "city": "Mumbai",
      "type": "supplier_warehouse"
    },
    "dropoff": {
      "name": "Apex Precision Fabrications Ltd.",
      "address": "Plot W-72, MIDC Bhosari Industrial Area",
      "city": "Pune",
      "type": "manufacturing_plant"
    },
    "entities": [
      {
        "name": "CRCA Mild Steel Sheet 1.2mm (Grade D)",
        "quantity": 12.0,
        "unit": "MT",
        "declared_value_freight": 8790.0
      }
    ],
    "route": {
      "origin": "Mumbai",
      "destination": "Pune MIDC",
      "estimated_distance_km": 150.0,
      "estimated_duration_hours": 3.7
    }
  },
  "financials": {
    "ledger_invoice_id": "inv_flb_16330",
    "freight_cost_inr": 8790.0,
    "payment_terms": "To Pay / Fleetbase Ledger"
  }
}
```

---

## ⚙️ How to Spin Up Local Fleetbase Docker Engine

To run Fleetbase independently alongside the Syndicate:

```bash
docker-compose -f fleetbase_engine/docker-compose.fleetbase.yml up -d
```
Access Fleetbase Console at `http://localhost:4200` and API at `http://localhost:8000`.

