@echo off
echo 🚀 Starting LokiAI Complete System...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js 18+ and try again
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed
echo.

REM Install Python dependencies
echo 📦 Installing Python dependencies...
pip install fastapi uvicorn numpy pandas scikit-learn aiohttp requests web3 python-json-logger pytest pytest-asyncio >nul 2>&1
if errorlevel 1 (
    echo ⚠️ Some Python packages may have failed to install
)

REM Install Node.js dependencies
echo 📦 Installing Node.js dependencies...
npm install express cors ethers node-fetch winston dotenv web3 >nul 2>&1
if errorlevel 1 (
    echo ⚠️ Some Node.js packages may have failed to install
)

echo.
echo 🎯 Starting all services...
echo.

REM Create log directory
if not exist "logs" mkdir logs

REM Start ML API Service
echo 🤖 Starting ML API Service (Port 8000)...
start "ML API Service" cmd /k "python ml_api_service.py"
timeout /t 3 /nobreak >nul

REM Start Backend Server
echo ⚙️ Starting Backend Server (Port 25001)...
start "Backend Server" cmd /k "node backend_server_enhanced.js"
timeout /t 3 /nobreak >nul

REM Start Deposit Service
echo 💰 Starting Deposit Service (Port 25002)...
start "Deposit Service" cmd /k "node backend_deposit_service.js"
timeout /t 3 /nobreak >nul

REM Start Frontend
echo 🌐 Starting Frontend (Port 5173)...
start "Frontend" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

REM Start Monitor (Optional)
echo 🔍 Starting System Monitor...
start "System Monitor" cmd /k "python agent_monitor.py"

echo.
echo ✅ All services started!
echo.
echo 📊 Service URLs:
echo   - Frontend:      http://localhost:5173
echo   - Backend:       http://127.0.0.1:25001
echo   - Deposit Service: http://127.0.0.1:25002
echo   - ML API:        http://127.0.0.1:8000
echo   - ML API Docs:   http://127.0.0.1:8000/docs
echo.
echo 🧪 To run integration tests:
echo   node test_integration.js
echo.
echo 🛑 To stop all services, close the terminal windows
echo.
pause