@echo off
echo ========================================
echo    LokiAI Simple Blockchain Startup
echo ========================================
echo.

REM Check if Docker is running
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not running
    pause
    exit /b 1
)

echo ✅ Docker is available

echo.
echo 🔧 Starting LokiAI Blockchain System (Simple Mode)...
echo.

REM Stop any existing containers
echo 🛑 Stopping existing containers...
docker-compose -f docker-compose.simple-blockchain.yml down

REM Build and start services
echo 🚀 Building and starting services...
docker-compose -f docker-compose.simple-blockchain.yml up --build -d

REM Wait for services to start
echo ⏳ Waiting for services to initialize...
timeout /t 45 /nobreak >nul

REM Check service health
echo 🔍 Checking service health...
echo.

REM Check MongoDB
docker-compose -f docker-compose.simple-blockchain.yml exec -T mongodb mongosh --eval "db.adminCommand('ping')" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ MongoDB: Running
) else (
    echo ❌ MongoDB: Not responding
)

REM Check Backend
curl -f http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend: Running
) else (
    echo ❌ Backend: Not responding
)

echo.
echo ========================================
echo       🎉 LokiAI System Status
echo ========================================
echo.
echo 🔧 Backend API:  http://localhost:5000
echo 📊 Health Check: http://localhost:5000/health
echo 🗄️  MongoDB:     localhost:27017
echo 🔗 Blockchain:   Multi-chain integration active
echo.
echo 📋 Available Commands:
echo    docker-compose -f docker-compose.simple-blockchain.yml logs -f     (View logs)
echo    docker-compose -f docker-compose.simple-blockchain.yml ps          (Check status)
echo    docker-compose -f docker-compose.simple-blockchain.yml down        (Stop system)
echo.
echo 🎯 Test the system:
echo    curl http://localhost:5000/health
echo    curl http://localhost:5000/api/blockchain/status
echo.
echo Press any key to view live logs (Ctrl+C to exit logs)...
pause >nul

REM Show live logs
docker-compose -f docker-compose.simple-blockchain.yml logs -f