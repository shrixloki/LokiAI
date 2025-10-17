@echo off
echo 🚀 Starting LokiAI Agents System (Simple)
echo ========================================

echo.
echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🖥️ Starting Backend Server...
start "LokiAI Backend" cmd /k "node backend/server.js"

echo.
echo ⏳ Waiting for backend to start...
timeout /t 8 /nobreak >nul

echo.
echo 🧪 Testing backend...
node test-backend-simple.js

echo.
echo 🌐 Starting Frontend...
start "LokiAI Frontend" cmd /k "npm run dev"

echo.
echo 🎉 System Started!
echo.
echo 📍 Access Points:
echo    Frontend: http://localhost:5175
echo    Backend:  http://localhost:5000
echo.
echo Press any key to open the application...
pause >nul
start http://localhost:5175