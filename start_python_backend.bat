@echo off
title Yogashirini -- Python Backend (EfficientNetB0)
echo.
echo  ======================================================
echo   Yogashirini AI Python Backend
echo   Model: EfficientNetB0 (47 Classical Asanas)
echo   URL  : http://localhost:5000
echo  ======================================================
echo.
cd /d "%~dp0Python Backend"

if exist "C:\Users\ABHIROOP\anaconda3\envs\py310\python.exe" (
    "C:\Users\ABHIROOP\anaconda3\envs\py310\python.exe" app.py
) else (
    python app.py
)

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Python backend stopped with code %ERRORLEVEL%.
    pause
)
