@echo off
echo ========================================
echo    LokiAI Blockchain System Startup
echo ========================================
echo.

REM Check if Docker is running
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not running
    echo Please install Docker Desktop and make sure it's running
    pause
    exit /b 1
)

echo ✅ Docker is available

REM Check if .env file exists
if not exist ".env" (
    echo.
    echo ⚠️  No .env file found. Creating from template...
    copy ".env.blockchain" ".env"
    echo.
    echo 📝 IMPORTANT: Please edit the .env file with your actual:
    echo    - RPC URLs (Alchemy, Infura, QuickNode)
    echo    - Private keys for server wallets
    echo    - API keys for blockchain providers
    echo    - Notification service tokens (optional)
    echo.
    echo Press any key to continue with demo configuration...
    pause >nul
)

echo.
echo 🔧 Starting LokiAI Blockchain System...
echo.

REM Stop any existing containers
echo 🛑 Stopping existing containers...
docker-compose -f docker-compose.blockchain.yml down

REM Build and start all services
echo 🚀 Building and starting all services...
docker-compose -f docker-compose.blockchain.yml up --build -d

REM Wait for services to start
echo ⏳ Waiting for services to initialize...
timeout /t 30 /nobreak >nul

REM Check service health
echo 🔍 Checking service health...
echo.

REM Check MongoDB
docker-compose -f docker-compose.blockchain.yml exec -T mongodb mongosh --eval "db.adminCommand('ping')" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ MongoDB: Running
) else (
    echo ❌ MongoDB: Not responding
)

REM Check Redis
docker-compose -f docker-compose.blockchain.yml exec -T redis redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Redis: Running
) else (
    echo ❌ Redis: Not responding
)

REM Check Backend
curl -f http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend: Running
) else (
    echo ❌ Backend: Not responding
)

REM Check Frontend
curl -f http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend: Running
) else (
    echo ❌ Frontend: Not responding
)

echo.
echo ========================================
echo       🎉 LokiAI System Status
echo ========================================
echo.
echo 🌐 Frontend:     http://localhost:3000
echo 🔧 Backend API:  http://localhost:5000
echo 📊 Health Check: http://localhost:5000/health
echo 🗄️  MongoDB:     localhost:27017
echo 💾 Redis:       localhost:6379
echo.
echo 📋 Available Commands:
echo    docker-compose -f docker-compose.blockchain.yml logs -f     (View logs)
echo    docker-compose -f docker-compose.blockchain.yml ps          (Check status)
echo    docker-compose -f docker-compose.blockchain.yml down        (Stop system)
echo    docker-compose -f docker-compose.blockchain.yml restart     (Restart system)
echo.
echo 🔐 SECURITY REMINDER:
echo    - Configure real RPC URLs in .env file
echo    - Use secure private keys for production
echo    - Enable notifications for monitoring
echo.
echo Press any key to view live logs (Ctrl+C to exit logs)...
pause >nul

REM Show live logs
docker-compose -f docker-compose.blockchain.yml logs -f