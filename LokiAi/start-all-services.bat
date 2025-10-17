@echo off
echo ========================================
echo  Starting LokiAI Services
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed
    pause
    exit /b 1
)

echo [OK] Node.js found
echo.

REM Start Backend Server
echo [BACKEND] Starting Backend Server on port 5000...
if exist backend\src\server.js (
    start "LokiAI Backend" cmd /k "cd /d %~dp0\backend && npm run dev"
) else if exist backend-server.js (
    start "LokiAI Backend" cmd /k "cd /d %~dp0 && node backend-server.js"
) else (
    echo [ERROR] Backend server file not found
)
timeout /t 3 /nobreak >nul

REM Start Frontend
echo [FRONTEND] Starting Frontend on port 5173...
start "LokiAI Frontend" cmd /k "cd /d %~dp0 && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo  All Services Started!
echo ========================================
echo.
echo Service URLs:
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:5000
echo   Network:   http://192.168.31.233:5173
echo.
echo Close the command windows to stop services
echo.
pause
