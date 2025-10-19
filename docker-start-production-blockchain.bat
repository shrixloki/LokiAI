@echo off
echo ========================================
echo 🚀 LokiAI Production Blockchain System
echo ========================================
echo.

echo 🐳 Starting LokiAI Production System with Docker...
echo.

echo 📋 System Components:
echo   - MongoDB Database
echo   - Production Backend with Blockchain Integration
echo   - React Frontend
echo   - Nginx Reverse Proxy
echo   - Redis Cache
echo   - Blockchain Monitor
echo.

echo 🔧 Configuration:
echo   - Network: Sepolia Testnet
echo   - Smart Contracts: Deployed and Verified
echo   - Real-time Notifications: Enabled
echo   - Production Mode: Active
echo.

echo 🚀 Building and starting all services...
docker-compose -f docker-compose.production-blockchain.yml up --build -d

if %errorlevel% neq 0 (
    echo ❌ Failed to start services
    pause
    exit /b 1
)

echo.
echo ✅ All services started successfully!
echo.
echo 📡 Available Endpoints:
echo   - Frontend: http://localhost:3000
echo   - Backend API: http://localhost:5000
echo   - Health Check: http://localhost:5000/health
echo   - Production Blockchain API: http://localhost:5000/api/production-blockchain
echo   - MongoDB: localhost:27017
echo   - Redis: localhost:6379
echo.
echo 🔗 Smart Contracts (Sepolia):
echo   - YieldOptimizer: 0x079f3a87f579eA15c0CBDc375455F6FB39C8de21
echo   - ArbitrageBot: 0x04a95ab21D2491b9314A1D50ab7aD234E6006dB1
echo   - RiskManager: 0x5c3aDdd97D227cD58f54B48Abd148E255426D860
echo.
echo 📊 Monitor Services:
docker-compose -f docker-compose.production-blockchain.yml ps

echo.
echo 🎉 LokiAI Production Blockchain System is now running!
echo.
echo 💡 Useful Commands:
echo   - View logs: docker-compose -f docker-compose.production-blockchain.yml logs -f
echo   - Stop system: docker-compose -f docker-compose.production-blockchain.yml down
echo   - Restart: docker-compose -f docker-compose.production-blockchain.yml restart
echo.

pause