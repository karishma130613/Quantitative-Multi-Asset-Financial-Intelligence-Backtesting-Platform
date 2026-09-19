@echo off
title QUANTLAB Multi-Asset Platform Launcher
echo ====================================================
echo Starting QUANTLAB Multi-Asset Platform...
echo ====================================================

echo [1/2] Starting Backend Server on http://127.0.0.1:8000 ...
start "QuantLab Backend (FastAPI)" cmd /k "py -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting Frontend Server on http://127.0.0.1:5173 ...
start "QuantLab Frontend (Vite)" cmd /k "cd frontend && npm run dev"

timeout /t 3 >nul
echo Opening QuantLab in default browser...
start http://127.0.0.1:5173/#/login

echo ====================================================
echo Both servers started successfully!
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://127.0.0.1:5173/#/login
echo ====================================================
