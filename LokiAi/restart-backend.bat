@echo off
echo ========================================
echo Restarting LokiAI Backend Server
echo ========================================
echo.

REM Kill existing Node.js processes running backend-server.js
echo Stopping existing backend server...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *backend-server*" 2>nul
timeout /t 2 /nobreak >nul

REM Start the backend server
echo Starting backend server on port 5000...
cd /d "%~dp0"
start "LokiAI Backend" cmd /k "node backend-server.js"

echo.
echo ========================================
echo Backend server restarted!
echo Server running on: http://localhost:5000
echo ========================================
echo.
pause
