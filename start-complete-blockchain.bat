@echo off
echo ========================================
echo  LokiAI Complete Blockchain Integration
echo ========================================
echo.
echo This will start the complete LokiAI system with:
echo - Real blockchain integration
echo - Smart contract interactions
echo - MetaMask wallet connection
echo - Live transaction monitoring
echo - Production-ready agents
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo Checking Docker Compose...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker Compose is not available.
    pause
    exit /b 1
)

echo.
echo Starting complete blockchain system...
echo.

REM Stop any existing containers
echo Stopping existing containers...
docker-compose -f docker-compose.complete-blockchain.yml down

REM Remove old images (optional)
set /p rebuild="Do you want to rebuild all images? (y/N): "
if /i "%rebuild%"=="y" (
    echo Rebuilding all images...
    docker-compose -f docker-compose.complete-blockchain.yml build --no-cache
)

REM Start the complete system
echo Starting all services...
docker-compose -f docker-compose.complete-blockchain.yml up -d

REM Wait for services to be ready
echo.
echo Waiting for services to start...
timeout /t 30 /nobreak >nul

REM Check service health
echo.
echo Checking service health...
docker-compose -f docker-compose.complete-blockchain.yml ps

echo.
echo ========================================
echo  System Status
echo ========================================
echo.

REM Check if services are running
for /f "tokens=*" %%i in ('docker-compose -f docker-compose.complete-blockchain.yml ps --services --filter "status=running"') do (
    echo ✅ %%i is running
)

echo.
echo ========================================
echo  Access Information
echo ========================================
echo.
echo 🌐 Frontend (Blockchain UI):     http://localhost:3000
echo 🔧 Backend API:                 http://localhost:5000
echo 📊 System Health:               http://localhost:5000/health
echo 📈 Prometheus Monitoring:       http://localhost:9090
echo 📊 Grafana Dashboard:           http://localhost:3001
echo    └─ Username: admin
echo    └─ Password: lokiai2024
echo.
echo 🔗 Blockchain Integration:
echo    └─ Network: Sepolia Testnet
echo    └─ Explorer: https://sepolia.etherscan.io
echo    └─ MetaMask Required: Yes
echo.
echo 📋 Smart Contracts:
echo    └─ Yield Optimizer:    0x079f3a87f579eA15c0CBDc375455F6FB39C8de21
echo    └─ Arbitrage Bot:      0x04a95ab21D2491b9314A1D50ab7aD234E6006dB1
echo    └─ Risk Manager:       0x5c3aDdd97D227cD58f54B48Abd148E255426D860
echo    └─ Portfolio Rebalancer: 0x1234567890123456789012345678901234567890
echo.

REM Test API connectivity
echo Testing API connectivity...
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend API is responding
) else (
    echo ⚠️  Backend API is not responding yet (may still be starting)
)

curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is responding
) else (
    echo ⚠️  Frontend is not responding yet (may still be starting)
)

echo.
echo ========================================
echo  Next Steps
echo ========================================
echo.
echo 1. Open http://localhost:3000 in your browser
echo 2. Install MetaMask if you haven't already
echo 3. Switch to Sepolia testnet in MetaMask
echo 4. Get test ETH from Sepolia faucet:
echo    https://sepoliafaucet.com/
echo 5. Connect your wallet and start using blockchain agents!
echo.
echo To view logs: docker-compose -f docker-compose.complete-blockchain.yml logs -f
echo To stop system: docker-compose -f docker-compose.complete-blockchain.yml down
echo.

set /p open="Open frontend in browser? (Y/n): "
if /i not "%open%"=="n" (
    start http://localhost:3000
)

echo.
echo System is running! Press any key to exit...
pause >nul