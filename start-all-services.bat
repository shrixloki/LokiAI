@echo off
echo ========================================
echo 🚀 LokiAI Complete System Startup
echo ========================================
echo.

echo 📋 Checking prerequisites...

REM Check if MongoDB is running
echo 🔍 Checking MongoDB...
netstat -an | findstr :27017 >nul
if %errorlevel% neq 0 (
    echo ❌ MongoDB is not running on port 27017
    echo Please start MongoDB first
    pause
    exit /b 1
)
echo ✅ MongoDB is running

echo.
echo 🛑 Stopping any existing services...
taskkill /f /im node.exe 2>nul
taskkill /f /im python.exe 2>nul

echo.
echo 📦 Installing dependencies...
cd LokiAi
call npm install --silent
cd ..

echo.
echo 🚀 Starting Backend Server...
cd LokiAi
start "LokiAI Backend" cmd /k "echo Backend Server Starting... && node backend/server.js"
cd ..

echo.
echo ⏳ Waiting for backend to initialize...
timeout /t 10 /nobreak >nul

echo.
echo 🐍 Starting Rebalancer API...
cd Rebalancer
start "LokiAI Rebalancer" cmd /k "echo Rebalancer API Starting... && python api_server.py"
cd ..

echo.
echo ⏳ Waiting for rebalancer to initialize...
timeout /t 10 /nobreak >nul

echo.
echo 🌐 Starting Frontend...
cd LokiAi
start "LokiAI Frontend" cmd /k "echo Frontend Starting... && npm run dev"
cd ..

echo.
echo ⏳ Waiting for all services to be ready...
timeout /t 15 /nobreak >nul

echo.
echo 🧪 Testing the complete system...
node test-complete-system.js

echo.
echo ========================================
echo ✅ LokiAI System Started Successfully!
echo ========================================
echo.
echo 🌐 Access Points:
echo - Frontend:    http://localhost:5176 (or check terminal)
echo - Backend:     http://localhost:5000/health
echo - Rebalancer:  http://localhost:5001/api/health
echo - MongoDB:     localhost:27017
echo.
echo 📋 Management:
echo - All services are running in separate windows
echo - Close the windows to stop individual services
echo - Or run: taskkill /f /im node.exe && taskkill /f /im python.exe
echo.
echo 🎯 Open your browser to the frontend URL shown above!
echo.
pause