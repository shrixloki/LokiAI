@echo off
echo ========================================
echo 🚀 LokiAI Production Blockchain System
echo ========================================
echo.

echo 📋 Starting Production Blockchain System...
echo.

echo 🔧 Environment: Production
echo 🌐 Network: Sepolia Testnet
echo 📦 Smart Contracts: Deployed
echo 🤖 Agents: Production Mode
echo.

echo 📋 Checking dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🚀 Starting LokiAI Production System...
echo.
echo 📡 API Endpoints:
echo   - System Status: http://localhost:5000/api/production-blockchain/system/status
echo   - Health Check: http://localhost:5000/api/production-blockchain/system/health
echo   - Start Agents: POST http://localhost:5000/api/production-blockchain/system/start
echo   - Yield Optimization: POST http://localhost:5000/api/production-blockchain/yield/optimize
echo   - Arbitrage: POST http://localhost:5000/api/production-blockchain/arbitrage/execute
echo   - Risk Assessment: POST http://localhost:5000/api/production-blockchain/risk/evaluate
echo   - Portfolio Rebalance: POST http://localhost:5000/api/production-blockchain/portfolio/rebalance
echo.
echo 🔗 Blockchain Explorer: https://sepolia.etherscan.io
echo 📊 Smart Contracts:
echo   - YieldOptimizer: 0x079f3a87f579eA15c0CBDc375455F6FB39C8de21
echo   - ArbitrageBot: 0x04a95ab21D2491b9314A1D50ab7aD234E6006dB1
echo   - RiskManager: 0x5c3aDdd97D227cD58f54B48Abd148E255426D860
echo.
echo ⚠️  PRODUCTION MODE - Real blockchain transactions!
echo 💰 Using real testnet ETH for gas fees
echo 📡 Real-time notifications enabled
echo.

npm run dev

echo.
echo 🔴 Production system stopped
pause