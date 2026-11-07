@echo off
title Smart Factory Syndicate - Launcher
color 0B

echo =====================================================================
echo    🏭 SMART FACTORY SYNDICATE — LAUNCHER (Problem Statement 4.1)
echo    Autonomous Procurement, Landed Cost Bidding & Fleetbase Logistics
echo =====================================================================
echo.

set ROOT_DIR=%~dp0
set SYNDICATE_DIR=%ROOT_DIR%smart-factory-syndicate

echo [1/3] Checking environment...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found in PATH! Please install Python 3.10+.
    pause
    exit /b 1
)

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH! Please install Node.js 18+.
    pause
    exit /b 1
)

echo [2/3] Launching Python FastAPI AI Backend on http://localhost:8000 ...
start "Smart Factory AI Backend (Port 8000)" cmd /k "cd /d %SYNDICATE_DIR%\backend_ai && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

echo [3/3] Launching Next.js Frontend Dashboard on http://localhost:3000 ...
start "Smart Factory Frontend (Port 3000)" cmd /k "cd /d %SYNDICATE_DIR%\frontend && npm run dev"

echo.
echo Waiting 4 seconds for services to initialize...
timeout /t 4 /nobreak >nul

echo Opening Factory Owner Command Center in default browser...
start http://localhost:3000

echo.
echo =====================================================================
echo  STATUS: SMART FACTORY SYNDICATE IS OPERATIONAL!
echo =====================================================================
echo  - Factory Owner Dashboard : http://localhost:3000
echo  - Multi-Agent Hub         : http://localhost:3000/agents
echo  - Cluster Syndicate Hub   : http://localhost:3000/syndicate
echo  - RAG Ingestion Studio    : http://localhost:3000/ingest
echo  - Fleetbase Logistics OS  : http://localhost:3000/fleetbase
echo  - Inventory Ledger        : http://localhost:3000/inventory
echo  - Quote Approval Center   : http://localhost:3000/quotes
echo  - FastAPI Swagger Docs    : http://localhost:8000/docs
echo =====================================================================
echo To stop the platform, close the opened console windows or run STOP_SMART_FACTORY.bat.
echo.
pause
