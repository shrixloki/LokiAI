@echo off
echo 🚀 Starting LokiAI with Fixed AI Agents System
echo.

echo 📋 Checking Docker status...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not running
    echo Please install Docker Desktop and try again
    pause
    exit /b 1
)

echo ✅ Docker is available

echo.
echo 🧹 Cleaning up previous containers...
docker-compose down --remove-orphans

echo.
echo 🔧 Building and starting services...
docker-compose up --build -d

echo.
echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

echo.
echo 📊 Checking service status...
docker-compose ps

echo.
echo 🧪 Testing AI Agents functionality...
timeout /t 5 /nobreak >nul

echo.
echo 🎯 Testing arbitrage agent with mock data...
curl -X POST "http://localhost:5050/run-agent" ^
  -H "Content-Type: application/json" ^
  -d "{\"walletAddress\":\"0x1234567890123456789012345678901234567890\",\"agentType\":\"arbitrage\",\"config\":{}}"

echo.
echo.
echo ✅ LokiAI AI Agents System Started Successfully!
echo.
echo 🌐 Frontend: http://localhost:5173
echo 🔧 Backend API: http://localhost:5000
echo 🤖 AI Agents Socket: http://localhost:5050
echo 📊 MongoDB: localhost:27017
echo 🔐 GhostKey: http://localhost:25000
echo.
echo 📝 Check logs with: docker-compose logs -f
echo 🛑 Stop with: docker-compose down
echo.
pause