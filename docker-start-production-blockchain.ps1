Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 LokiAI Production Blockchain System" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🐳 Starting LokiAI Production System with Docker..." -ForegroundColor Yellow
Write-Host ""

Write-Host "📋 System Components:" -ForegroundColor Cyan
Write-Host "  - MongoDB Database" -ForegroundColor White
Write-Host "  - Production Backend with Blockchain Integration" -ForegroundColor White
Write-Host "  - React Frontend" -ForegroundColor White
Write-Host "  - Nginx Reverse Proxy" -ForegroundColor White
Write-Host "  - Redis Cache" -ForegroundColor White
Write-Host "  - Blockchain Monitor" -ForegroundColor White
Write-Host ""

Write-Host "🔧 Configuration:" -ForegroundColor Cyan
Write-Host "  - Network: Sepolia Testnet" -ForegroundColor White
Write-Host "  - Smart Contracts: Deployed and Verified" -ForegroundColor Green
Write-Host "  - Real-time Notifications: Enabled" -ForegroundColor Green
Write-Host "  - Production Mode: Active" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 Building and starting all services..." -ForegroundColor Yellow
docker-compose -f docker-compose.production-blockchain.yml up --build -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start services" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "✅ All services started successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "📡 Available Endpoints:" -ForegroundColor Cyan
Write-Host "  - Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  - Backend API: http://localhost:5000" -ForegroundColor White
Write-Host "  - Health Check: http://localhost:5000/health" -ForegroundColor White
Write-Host "  - Production Blockchain API: http://localhost:5000/api/production-blockchain" -ForegroundColor White
Write-Host "  - MongoDB: localhost:27017" -ForegroundColor White
Write-Host "  - Redis: localhost:6379" -ForegroundColor White
Write-Host ""

Write-Host "🔗 Smart Contracts (Sepolia):" -ForegroundColor Cyan
Write-Host "  - YieldOptimizer: 0x079f3a87f579eA15c0CBDc375455F6FB39C8de21" -ForegroundColor White
Write-Host "  - ArbitrageBot: 0x04a95ab21D2491b9314A1D50ab7aD234E6006dB1" -ForegroundColor White
Write-Host "  - RiskManager: 0x5c3aDdd97D227cD58f54B48Abd148E255426D860" -ForegroundColor White
Write-Host ""

Write-Host "📊 Monitor Services:" -ForegroundColor Cyan
docker-compose -f docker-compose.production-blockchain.yml ps

Write-Host ""
Write-Host "🎉 LokiAI Production Blockchain System is now running!" -ForegroundColor Green
Write-Host ""

Write-Host "💡 Useful Commands:" -ForegroundColor Cyan
Write-Host "  - View logs: docker-compose -f docker-compose.production-blockchain.yml logs -f" -ForegroundColor White
Write-Host "  - Stop system: docker-compose -f docker-compose.production-blockchain.yml down" -ForegroundColor White
Write-Host "  - Restart: docker-compose -f docker-compose.production-blockchain.yml restart" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to continue"