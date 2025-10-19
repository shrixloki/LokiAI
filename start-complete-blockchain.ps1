#!/usr/bin/env pwsh

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " LokiAI Complete Blockchain Integration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will start the complete LokiAI system with:" -ForegroundColor Yellow
Write-Host "- Real blockchain integration" -ForegroundColor Green
Write-Host "- Smart contract interactions" -ForegroundColor Green
Write-Host "- MetaMask wallet connection" -ForegroundColor Green
Write-Host "- Live transaction monitoring" -ForegroundColor Green
Write-Host "- Production-ready agents" -ForegroundColor Green
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Docker Compose
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose is available" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Docker Compose is not available." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Starting complete blockchain system..." -ForegroundColor Yellow
Write-Host ""

# Stop any existing containers
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.complete-blockchain.yml down

# Ask about rebuilding
$rebuild = Read-Host "Do you want to rebuild all images? (y/N)"
if ($rebuild -eq "y" -or $rebuild -eq "Y") {
    Write-Host "Rebuilding all images..." -ForegroundColor Yellow
    docker-compose -f docker-compose.complete-blockchain.yml build --no-cache
}

# Start the complete system
Write-Host "Starting all services..." -ForegroundColor Yellow
docker-compose -f docker-compose.complete-blockchain.yml up -d

# Wait for services to be ready
Write-Host ""
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check service health
Write-Host ""
Write-Host "Checking service health..." -ForegroundColor Yellow
docker-compose -f docker-compose.complete-blockchain.yml ps

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " System Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if services are running
$runningServices = docker-compose -f docker-compose.complete-blockchain.yml ps --services --filter "status=running"
foreach ($service in $runningServices) {
    Write-Host "✅ $service is running" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Access Information" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Frontend (Blockchain UI):     http://localhost:3000" -ForegroundColor White
Write-Host "🔧 Backend API:                 http://localhost:5000" -ForegroundColor White
Write-Host "📊 System Health:               http://localhost:5000/health" -ForegroundColor White
Write-Host "📈 Prometheus Monitoring:       http://localhost:9090" -ForegroundColor White
Write-Host "📊 Grafana Dashboard:           http://localhost:3001" -ForegroundColor White
Write-Host "   └─ Username: admin" -ForegroundColor Gray
Write-Host "   └─ Password: lokiai2024" -ForegroundColor Gray
Write-Host ""
Write-Host "🔗 Blockchain Integration:" -ForegroundColor Yellow
Write-Host "   └─ Network: Sepolia Testnet" -ForegroundColor Gray
Write-Host "   └─ Explorer: https://sepolia.etherscan.io" -ForegroundColor Gray
Write-Host "   └─ MetaMask Required: Yes" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 Smart Contracts:" -ForegroundColor Yellow
Write-Host "   └─ Yield Optimizer:    0x079f3a87f579eA15c0CBDc375455F6FB39C8de21" -ForegroundColor Gray
Write-Host "   └─ Arbitrage Bot:      0x04a95ab21D2491b9314A1D50ab7aD234E6006dB1" -ForegroundColor Gray
Write-Host "   └─ Risk Manager:       0x5c3aDdd97D227cD58f54B48Abd148E255426D860" -ForegroundColor Gray
Write-Host "   └─ Portfolio Rebalancer: 0x1234567890123456789012345678901234567890" -ForegroundColor Gray
Write-Host ""

# Test API connectivity
Write-Host "Testing API connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Backend API is responding" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend API is not responding yet (may still be starting)" -ForegroundColor Yellow
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Frontend is responding" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Frontend is not responding yet (may still be starting)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "2. Install MetaMask if you haven't already" -ForegroundColor White
Write-Host "3. Switch to Sepolia testnet in MetaMask" -ForegroundColor White
Write-Host "4. Get test ETH from Sepolia faucet:" -ForegroundColor White
Write-Host "   https://sepoliafaucet.com/" -ForegroundColor Cyan
Write-Host "5. Connect your wallet and start using blockchain agents!" -ForegroundColor White
Write-Host ""
Write-Host "To view logs: docker-compose -f docker-compose.complete-blockchain.yml logs -f" -ForegroundColor Gray
Write-Host "To stop system: docker-compose -f docker-compose.complete-blockchain.yml down" -ForegroundColor Gray
Write-Host ""

$open = Read-Host "Open frontend in browser? (Y/n)"
if ($open -ne "n" -and $open -ne "N") {
    Start-Process "http://localhost:3000"
}

Write-Host ""
Write-Host "System is running! Press any key to exit..." -ForegroundColor Green
Read-Host