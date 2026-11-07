@echo off
title Smart Factory Syndicate - Shutdown
color 0C

echo =====================================================================
echo    🛑 SMART FACTORY SYNDICATE — STOPPING ALL SERVICES
echo =====================================================================
echo.

echo Stopping FastAPI backend processes on port 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo Stopping Next.js frontend processes on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo All Smart Factory Syndicate servers have been stopped.
echo.
pause

