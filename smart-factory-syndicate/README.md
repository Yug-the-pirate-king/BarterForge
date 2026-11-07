# 🏭 Smart Factory Syndicate

> **Autonomous Multi-Agent AI Platform for SME Manufacturing Procurement, Landed-Cost Bidding & Fleetbase Logistics Integration.**  
> *Engineered to solve Problem Statement 4.1: Eradicating raw material overpayment and quote losses for small factory owners.*

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0--beta-green.svg)
![Fleetbase](https://img.shields.io/badge/Logistics%20OS-Fleetbase%20Fleet--Ops-orange.svg)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)
![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black.svg)

---

## 📖 The Core Problem (Problem Statement 4.1)

Small-to-medium enterprise (SME) factories handle raw material procurement and customer bidding through fragmented, manual workflows. This causes two structural margin leaks:
1. **Raw Material Overpayment:** Small factories overpay by 10%–20% for commodities (Steel, Aluminum, Brass, Fasteners) because they manually compare unstructured WhatsApp messages and phone quotes across a limited supplier circle.
2. **Quoting Orders at a Loss:** Factory owners calculate customer bids using "rule of thumb" estimations, routinely failing to factor in fluctuating carrier freight, toll surcharges, and dynamic landed logistics costs.

---

## 🚀 The Solution: 3 Integrated Pillars

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        SMART FACTORY SYNDICATE                         │
├─────────────────────┬───────────────────────────┬──────────────────────┤
│ 1. LOGISTICS OS     │ 2. RAG & INGESTION        │ 3. RESPONSIVE AGENTS │
│    (Fleetbase API)  │    (LangChain / NLP)      │    (Multi-Agent)     │
├─────────────────────┼───────────────────────────┼──────────────────────┤
│ • Fleet-Ops Dispatch│ • Multilingual Hinglish   │ • Procurement Agent  │
│ • Live Route Matrix │   WhatsApp extraction     │ • Landed Bidding Agt │
│ • Vehicle Tiers     │ • Pydantic Schema Guard   │ • Cluster Syndicate  │
│   (1.5T to 25T)     │ • Landed Cost Auto-Calc   │ • Human-in-the-Loop  │
│ • Ledger Invoicing  │ • Ingestion Studio UI     │   1-Click PO Bounds  │
└─────────────────────┴───────────────────────────┴──────────────────────┘
```

1. **Logistics OS (Fleetbase API):**
   - Live freight calculations based on Indian industrial corridor distance matrices (Mumbai, Navi Mumbai, Ahmedabad, Surat, Kolhapur, Pune MIDC).
   - Calibrated vehicle profiles: Pickup (1.5 MT @ ₹22/km), Eicher Pro (5.0 MT @ ₹32/km), 10-Ton Truck (@ ₹45/km), Heavy Trailer (25 MT @ ₹75/km).
   - Generates production Fleetbase Orders with tracking numbers (`FLB-IN-...`), waypoints, material manifests, and Ledger invoice references.
2. **RAG & Unstructured Ingestion Engine:**
   - Ingests chaotic WhatsApp messages, audio transcripts, and PDF rate sheets.
   - Extracts structured pricing models: Material Rate, Quantity, Unit, Delivery terms (ex-plant vs doorstep), Lead time, and matched SKU.
   - Deterministic currency-first parser guarantees 100% offline test reliability.
3. **Responsive Multi-Agent Syndicate:**
   - **Autonomous Procurement Agent:** Scans inventory drops below safety limits, benchmarks all supplier quotes, and ranks the **Top 3 Sourcing Strategies** with drafted WhatsApp RFQ messages.
   - **Landed-Cost Bidding Agent:** Calculates guaranteed-profit bids for buyer RFQs ($(\text{Material} + \text{Processing} + \text{Fleetbase Freight}) \times (1 + \text{Margin})$) and enforces **Negative Margin Guardrails** that block loss-making bids.
   - **Cluster Syndicate Agent (Phase 4):** Pools commodity demand across neighboring factories to command tier-1 primary mill discounts and shared milk-run deliveries.

---

## 📋 Comprehensive Phased Roadmap

For detailed sprint breakdown, deliverables, and completion criteria, consult the internal engineering board:  
👉 **[PROJECT_BOARD.md](./PROJECT_BOARD.md)**

| Phase | Milestone | Status | Key Deliverables |
| :--- | :--- | :---: | :--- |
| **Phase 1** | **Core Platform & Infrastructure** | 🟢 **100% COMPLETED** | Monorepo, DB dual-mode engine, Dashboard UI, Inventory ledger, Fleetbase client |
| **Phase 2** | **RAG Pipeline & Data Ingestion** | 🟢 **100% COMPLETED** | LangChain extractor, Hinglish NLP, Ingestion Studio UI (`/ingest`), Gateway webhooks |
| **Phase 3** | **Multi-Agent Workflows & Bidding** | 🟢 **100% COMPLETED** | Procurement Agent, Bidding Agent, Margin Guardrails, Multi-Agent Hub UI (`/agents`) |
| **Phase 4** | **Responsive AI Clusters (Syndicate)** | 🟢 **100% COMPLETED** | Geographic clustering, Demand pooling, Fleetbase multi-drop Milk-Runs (`/syndicate`) |

---

## 📂 Project Architecture

```text
smart-factory-syndicate/
├── PROJECT_BOARD.md       # Full engineering board & phased roadmap
├── README.md              # Project documentation & architecture
├── docker-compose.yml     # PostgreSQL (pgvector), Redis, FastAPI, Gateway, Next.js
├── .env.example           # Environment template
│
├── backend_ai/            # Python FastAPI AI & Multi-Agent Backend
│   ├── app/
│   │   ├── config.py      # App configurations & settings
│   │   ├── database.py    # PostgreSQL + pgvector engine with SQLite auto-fallback
│   │   ├── models.py      # ORM: Factories, Suppliers, Inventory, Quotes, Syndicate
│   │   ├── schemas.py     # Pydantic schemas
│   │   ├── seed.py        # SME seed dataset (5 commodities, 4 suppliers, quotes)
│   │   ├── services/
│   │   │   ├── fleetbase_service.py # Fleetbase Fleet-Ops routing & freight engine
│   │   │   ├── extraction_service.py# Multilingual quote NLP extractor
│   │   │   ├── procurement_agent.py # Stock monitoring & Top-3 deal curator
│   │   │   ├── bidding_agent.py     # RFQ proposal generator & margin guardrails
│   │   │   └── cluster_agent.py     # Phase 4 Demand pooling & milk-run optimizer
│   │   └── routes/
│   │       ├── dashboard.py   # Owner KPIs & asset valuations
│   │       ├── inventory.py   # Inventory ledger endpoints
│   │       ├── quotes.py      # Quote extraction & 1-click approvals
│   │       ├── suppliers.py   # Supplier directory & Fleetbase vendor sync
│   │       ├── fleetbase.py   # Live routing, vehicle profiles & dispatch
│   │       ├── agents.py      # Multi-Agent control endpoints
│   │       └── syndicate.py   # Demand pools & milk-run dispatch
│   ├── main.py            # FastAPI entrypoint with CORS & startup seed
│   ├── verify_agents.py   # Phase 3 multi-agent validation script
│   ├── verify_fleetbase.py# Fleetbase integration test script
│   └── verify_syndicate.py# Phase 4 syndicate demand pooling & milk-run verification
│
├── backend_gateway/       # Node.js Express Event Gateway
│   ├── index.js           # WhatsApp Cloud API & Twilio webhook listener
│   └── package.json
│
├── fleetbase_engine/      # Fleetbase Logistics OS Integration Pack
│   ├── FLEETBASE_INTEGRATION_GUIDE.md # API specifications & waypoint schemas
│   ├── corridor_rates.json           # Calibrated industrial corridor rate matrix
│   └── docker-compose.fleetbase.yml  # Standalone Fleetbase services
│
└── frontend/              # Next.js 14 Web Application
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx     # Root layout with Sidebar & Navbar
    │   │   ├── page.tsx       # Factory Owner Command Center
    │   │   ├── agents/page.tsx# Multi-Agent Operations Hub
    │   │   ├── fleetbase/page.tsx # Fleetbase Logistics OS Command Hub
    │   │   ├── ingest/page.tsx# RAG WhatsApp Ingestion Studio
    │   │   ├── inventory/page.tsx # Raw Material Inventory Ledger
    │   │   ├── quotes/page.tsx# Quote Approval & Landed Cost Center
    │   │   └── suppliers/page.tsx # Supplier Network Directory
    │   ├── components/
    │   │   ├── Navbar.tsx
    │   │   ├── Sidebar.tsx
    │   │   ├── MetricCard.tsx
    │   │   ├── InventoryTable.tsx
    │   │   ├── QuoteApprovalModal.tsx
    │   │   └── LandedCostCalculator.tsx
    │   └── lib/
    │       ├── types.ts       # Domain TypeScript models
    │       └── api.ts         # Unified API client with offline demo fallbacks
    ├── package.json
    └── tailwind.config.js
```

---

## ⚙️ Quickstart Guide

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & npm
- **Docker & Docker Compose** (Optional — zero-downtime SQLite fallback included)

### 2. Setup AI Backend
```bash
cd backend_ai
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
Interactive Swagger API docs will be live at: `http://localhost:8000/docs`

### 3. Setup Next.js Frontend
```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

### 4. Verify End-to-End System
Run the automated verification test suites:
```bash
cd backend_ai
python verify_fleetbase.py   # Tests Fleetbase Fleet-Ops dispatch & NLP extraction
python verify_agents.py      # Tests Procurement Agent & Bidding Guardrails
python verify_syndicate.py   # Tests Phase 4 Demand Pooling & Milk-Run routes
```

---

## 🛡️ Human-in-the-Loop Philosophy
The AI system never executes transactions autonomously without bounded limits. The agents compute, rank, formulate, and flag risks; the **human factory owner retains 1-click approval authority** over all purchase orders and outgoing bids.

## 📄 License
Licensed under the MIT License.
