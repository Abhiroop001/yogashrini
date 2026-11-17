@echo off
title Yogashrini Platform -- Shutdown All Services

color 0C
echo ======================================================================
echo           SHUTTING DOWN ALL YOGASHRINI SERVICES
echo ======================================================================
echo.

echo Terminating processes on ports 2000, 3000, 3001, 5000...
for %%P in (2000 3000 3001 5000) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r /c:":%%P "') do (
        echo   [-] Killing PID %%a on Port %%P...
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo.
echo ======================================================================
echo   [DONE] All Yogashrini frontends and backends are stopped.
echo ======================================================================
echo.
pause
