Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 LokiAI Production Blockchain System" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Starting Production Blockchain System..." -ForegroundColor Yellow
Write-Host ""

Write-Host "🔧 Environment: Production" -ForegroundColor White
Write-Host "🌐 Network: Sepolia Testnet" -ForegroundColor White
Write-Host "📦 Smart Contracts: Deployed" -ForegroundColor Green
Write-Host "🤖 Agents: Production Mode" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Checking dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "🚀 Starting LokiAI Production System..." -ForegroundColor Green
Write-Host ""
Write-Host "📡 API Endpoints:" -ForegroundColor Cyan
Write-Host "  - System Status: http://localhost:5000/api/production-blockchain/system/status" -ForegroundColor White
Write-Host "  - Health Check: http://localhost:5000/api/production-blockchain/system/health" -ForegroundColor White
Write-Host "  - Start Agents: POST http://localhost:5000/api/production-blockchain/system/start" -ForegroundColor White
Write-Host "  - Yield Optimization: POST http://localhost:5000/api/production-blockchain/yield/optimize" -ForegroundColor White
Write-Host "  - Arbitrage: POST http://localhost:5000/api/production-blockchain/arbitrage/execute" -ForegroundColor White
Write-Host "  - Risk Assessment: POST http://localhost:5000/api/production-blockchain/risk/evaluate" -ForegroundColor White
Write-Host "  - Portfolio Rebalance: POST http://localhost:5000/api/production-blockchain/portfolio/rebalance" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Blockchain Explorer: https://sepolia.etherscan.io" -ForegroundColor Cyan
Write-Host "📊 Smart Contracts:" -ForegroundColor Cyan
Write-Host "  - YieldOptimizer: 0x079f3a87f579eA15c0CBDc375455F6FB39C8de21" -ForegroundColor White
Write-Host "  - ArbitrageBot: 0x04a95ab21D2491b9314A1D50ab7aD234E6006dB1" -ForegroundColor White
Write-Host "  - RiskManager: 0x5c3aDdd97D227cD58f54B48Abd148E255426D860" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  PRODUCTION MODE - Real blockchain transactions!" -ForegroundColor Red
Write-Host "Using real testnet ETH for gas fees" -ForegroundColor Yellow
Write-Host "📡 Real-time notifications enabled" -ForegroundColor Green
Write-Host ""

npm run dev

Write-Host ""
Write-Host "🔴 Production system stopped" -ForegroundColor Red
Read-Host "Press Enter to exit"