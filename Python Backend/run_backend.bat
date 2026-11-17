@echo off
title Yogashrini Python AI Backend [Port 5000 - RTX 3050 GPU]
echo ======================================================================
echo    YOGASHRINI PYTHON AI BACKEND (PORT 5000)
echo    NVIDIA GeForce RTX 3050 Laptop GPU Acceleration
echo ======================================================================
echo.

if exist "C:\Users\ABHIROOP\anaconda3\envs\py310\python.exe" (
    echo [OK] Using dedicated GPU environment: C:\Users\ABHIROOP\anaconda3\envs\py310\python.exe
    "C:\Users\ABHIROOP\anaconda3\envs\py310\python.exe" app.py
) else (
    echo [INFO] Falling back to default system python...
    python app.py
)

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Python backend stopped with an error code.
    pause
)
