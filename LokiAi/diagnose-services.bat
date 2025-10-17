@echo off
echo ========================================
echo LokiAI Services Diagnostic
echo ========================================
echo.

echo [1] Checking Backend Server (port 5000)...
netstat -ano | findstr :5000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend port 5000 is in use
    curl -s http://localhost:5000/health
    echo.
) else (
    echo ❌ Backend is NOT running on port 5000
    echo    Start it with: node backend-server.js
)

echo.
echo [2] Checking GhostKey (port 25000)...
netstat -ano | findstr :25000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ GhostKey port 25000 is in use
    curl -s http://127.0.0.1:25000/health
    echo.
) else (
    echo ❌ GhostKey is NOT running on port 25000
    echo    Start it with: cd GhostKey ^&^& python app.py
)

echo.
echo [3] Checking Frontend (port 5174)...
netstat -ano | findstr :5174 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend port 5174 is in use
) else (
    echo ❌ Frontend is NOT running on port 5174
    echo    Start it with: npm run dev
)

echo.
echo [4] Checking MongoDB Connection...
echo    (Check backend server logs for MongoDB status)

echo.
echo [5] Testing Backend Endpoints...
echo.
echo Testing /health endpoint:
curl -s http://localhost:5000/health
echo.
echo.
echo Testing /api/biometrics/status endpoint:
curl -s "http://localhost:5000/api/biometrics/status?walletAddress=0xtest"
echo.

echo.
echo ========================================
echo Diagnostic Complete
echo ========================================
echo.
echo If any service shows ❌, start it manually:
echo   Backend:  node backend-server.js
echo   GhostKey: cd GhostKey ^&^& python app.py
echo   Frontend: npm run dev
echo.
pause
