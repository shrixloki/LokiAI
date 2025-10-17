@echo off
echo ========================================
echo  LokiAI Biometric Authentication System
echo ========================================
echo.

echo [1/3] Starting GhostKey Microservice...
start "GhostKey" cmd /k "cd ghost-key-main\ghost-key-main && npm run dev"
timeout /t 5 /nobreak >nul

echo [2/3] Starting LokiAI Backend...
start "LokiAI Backend" cmd /k "cd LokiAi && node backend-server-complete.js"
timeout /t 3 /nobreak >nul

echo [3/3] Starting LokiAI Frontend...
start "LokiAI Frontend" cmd /k "cd LokiAi && npm run dev"

echo.
echo ========================================
echo  All Services Started!
echo ========================================
echo.
echo  GhostKey:  http://127.0.0.1:25000
echo  Backend:   http://localhost:5000
echo  Frontend:  http://localhost:5175
echo.
echo  Press any key to stop all services...
pause >nul

taskkill /FI "WindowTitle eq GhostKey*" /T /F
taskkill /FI "WindowTitle eq LokiAI Backend*" /T /F
taskkill /FI "WindowTitle eq LokiAI Frontend*" /T /F

echo All services stopped.
pause
