@echo off
echo ========================================
echo 🚀 LokiAI Production Agents Startup
echo ========================================
echo.
echo Starting 4 Production-Level AI Agents:
echo 1. Arbitrage Bot (LSTM-based)
echo 2. Yield Optimizer (DQN-based)  
echo 3. Risk Manager (Advanced blockchain analysis)
echo 4. Portfolio Rebalancer (Python-based)
echo.

REM Check if Docker is running
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not running
    echo Please install Docker Desktop and try again
    pause
    exit /b 1
)

echo ✅ Docker is running
echo.

REM Stop any existing containers
echo 🛑 Stopping existing containers...
docker-compose -f docker-compose.production-agents.yml down

REM Clean up old images (optional)
echo 🧹 Cleaning up old images...
docker system prune -f

REM Navigate to LokiAi directory
cd /d "%~dp0"

REM Build and start production services
echo 🔨 Building production services...
docker-compose -f docker-compose.production-agents.yml build --no-cache

echo 🚀 Starting production agents...
docker-compose -f docker-compose.production-agents.yml up -d

REM Wait for services to start
echo ⏳ Waiting for services to initialize...
timeout /t 30 /nobreak >nul

REM Check service status
echo 📊 Checking service status...
docker-compose -f docker-compose.production-agents.yml ps

echo.
echo ========================================
echo ✅ Production Agents Started Successfully!
echo ========================================
echo.
echo 🌐 Frontend: http://localhost
echo 🔧 Backend API: http://localhost:5000
echo 📊 Grafana Dashboard: http://localhost:3000 (admin/lokiai2024)
echo 📈 Prometheus: http://localhost:9090
echo 🔬 Biometrics: http://localhost:25000
echo 🔄 Rebalancer API: http://localhost:5001
echo.
echo 🎯 Open http://localhost to start trading with production agents!
echo.
pause