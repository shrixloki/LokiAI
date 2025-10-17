@echo off
echo 🚀 Starting LokiAI Agents System
echo ================================

echo.
echo 📋 Checking prerequisites...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not available
    pause
    exit /b 1
)

echo ✅ Node.js and npm are available

echo.
echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🔧 Starting MongoDB (if not running)...
REM Try to start MongoDB service (Windows)
net start MongoDB >nul 2>&1

echo.
echo 🖥️ Starting Backend Server...
start "LokiAI Backend" cmd /k "node backend/server.js"

echo.
echo ⏳ Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo 🌐 Starting Frontend Development Server...
start "LokiAI Frontend" cmd /k "npm run dev"

echo.
echo ⏳ Waiting for frontend to start...
timeout /t 10 /nobreak >nul

echo.
echo 🧪 Running Agent Functionality Tests...
timeout /t 3 /nobreak >nul
node test-agents-functionality.js

echo.
echo 🎉 LokiAI Agents System Started Successfully!
echo.
echo 📍 Access Points:
echo    Frontend: http://localhost:5175
echo    Backend:  http://localhost:5000
echo    Health:   http://localhost:5000/health
echo.
echo 🤖 Available AI Agents:
echo    - Arbitrage Bot (Cross-DEX price scanning)
echo    - Yield Optimizer (DeFi protocol analysis)
echo.
echo 💡 Next Steps:
echo    1. Open http://localhost:5175 in your browser
echo    2. Connect your MetaMask wallet
echo    3. Navigate to AI Agents tab
echo    4. Click "Run Agent" to execute live trading logic
echo.
echo Press any key to open the application...
pause >nul

REM Open the application in default browser
start http://localhost:5175

echo.
echo 🔄 System is running. Press Ctrl+C in the terminal windows to stop.
pause