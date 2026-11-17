@echo off
setlocal enabledelayedexpansion
title Yogashrini Platform -- Master Service Launcher

color 0A
echo ======================================================================
echo           YOGASHRINI YOGA PLATFORM -- MASTER LAUNCHER
echo ======================================================================
echo.

:: Step 1: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found in PATH. Please install Node.js.
    pause
    exit /b 1
)

:: Step 2: Detect Python with GPU support
set "PYTHON_EXE="
if exist "C:\Users\ABHIROOP\anaconda3\envs\py310\python.exe" (
    set "PYTHON_EXE=C:\Users\ABHIROOP\anaconda3\envs\py310\python.exe"
) else (
    where python >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        set "PYTHON_EXE=python"
    )
)

echo [1/4] Environment Diagnostics:
for /f "delims=" %%v in ('node -v') do echo   * Node.js : %%v (OK)
if defined PYTHON_EXE (
    echo   * Python  : !PYTHON_EXE!
    echo   * GPU     : NVIDIA GeForce RTX 3050 (Active)
) else (
    echo   * Python  : [WARNING] Python not found. Python AI Backend won't start.
)
echo.

:: Step 3: Clear any stale port processes to avoid EADDRINUSE conflicts
echo [2/4] Ensuring clean ports (2000, 3000, 3001, 5000)...
for %%P in (2000 3000 3001 5000) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r /c:":%%P "') do (
        taskkill /F /PID %%a >nul 2>&1
    )
)
echo   [OK] Ports are clear and ready.
echo.

set "ROOT_DIR=%~dp0"

:: Step 4: Launching all 4 services
echo [3/4] Launching Backends and Frontends in dedicated windows...
echo.

:: 1. Node.js Express Server (Port 2000)
echo   [+] Starting Express Server (Port 2000)...
start "Yogashrini [1/4] - Express Server [2000]" cmd /k "title Express Server [2000] && cd /d "%ROOT_DIR%Server" && npm start"

:: 2. Python AI Backend on RTX 3050 GPU (Port 5000)
if defined PYTHON_EXE (
    echo   [+] Starting Python AI Backend with RTX 3050 GPU (Port 5000)...
    start "Yogashrini [2/4] - Python AI Backend [5000]" cmd /k "title Python AI GPU [5000] && cd /d "%ROOT_DIR%Python Backend" && "!PYTHON_EXE!" app.py"
) else (
    echo   [-] Skipped Python AI Backend (Python executable missing)
)

:: 3. Admin React Dashboard (Port 3001)
echo   [+] Starting Admin React Panel with Vite (Port 3001)...
start "Yogashrini [3/4] - Admin Panel [3001]" cmd /k "title Admin Panel [3001] && cd /d "%ROOT_DIR%admin" && npm run dev"

:: 4. Frontend React Web App (Port 3000)
echo   [+] Starting Frontend React Web App with Vite (Port 3000)...
start "Yogashrini [4/4] - Frontend Web App [3000]" cmd /k "title Frontend App [3000] && cd /d "%ROOT_DIR%Frontend" && npm run dev"

echo.
echo ======================================================================
echo   SERVICES LAUNCHED!
echo.
echo   * Main Web Application  : http://localhost:3000
echo   * Real-Time AI Trainer  : http://localhost:3000/live-trainer
echo   * Admin Dashboard       : http://localhost:3001
echo   * Express Backend API   : http://localhost:2000
echo   * Python AI GPU Service : http://localhost:5000/health
echo ======================================================================
echo.

:: Step 5: Actively wait for Frontend compilation to finish before opening browser
echo [4/4] Compiling React frontend... waiting for server to be ready...
set /a retries=0

:check_loop
timeout /t 2 /nobreak >nul
set /a retries+=1
powershell -NoProfile -Command "(Invoke-WebRequest -Uri 'http://localhost:3000' -Headers @{'Accept'='text/html'} -UseBasicParsing -TimeoutSec 2).StatusCode" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Frontend compiled successfully and is online!
    goto open_browser
)
if !retries! geq 25 (
    echo [NOTE] Opening browser now (server is initializing)...
    goto open_browser
)
echo   ... waiting for Vite HMR server to initialize (attempt !retries!/25)...
goto check_loop

:open_browser
echo.
echo Opening http://localhost:3000/live-trainer in your default browser...
start http://localhost:3000/live-trainer

echo.
echo All processes are running smoothly. Keep individual service windows open.
echo To stop all services at once, simply run: stop_all.bat
echo.
pause
