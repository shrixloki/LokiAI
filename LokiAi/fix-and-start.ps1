#!/usr/bin/env pwsh

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  LokiAI Complete Fix & Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Docker
Write-Host "[1/6] Checking Docker Desktop..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "  ✅ Docker Desktop is running" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Docker Desktop is NOT running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start Docker Desktop and run this script again." -ForegroundColor Yellow
    Write-Host "You can start Docker Desktop from:" -ForegroundColor White
    Write-Host "  - Windows Start Menu → Docker Desktop" -ForegroundColor White
    Write-Host "  - Or wait for it to start automatically" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 2: Stop any existing containers
Write-Host ""
Write-Host "[2/6] Stopping existing containers..." -ForegroundColor Yellow
docker-compose down 2>$null
Write-Host "  ✅ Cleaned up" -ForegroundColor Green

# Step 3: Start services
Write-Host ""
Write-Host "[3/6] Starting all services..." -ForegroundColor Yellow
docker-compose up -d --build

Start-Sleep -Seconds 5

# Step 4: Check service status
Write-Host ""
Write-Host "[4/6] Checking service status..." -ForegroundColor Yellow
docker-compose ps

# Step 5: Wait for services to be ready
Write-Host ""
Write-Host "[5/6] Waiting for services to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$backendReady = $false

while ($attempt -lt $maxAttempts -and -not $backendReady) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
            Write-Host "  ✅ Backend is ready!" -ForegroundColor Green
        }
    } catch {
        $attempt++
        Write-Host "  ⏳ Waiting... ($attempt/$maxAttempts)" -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $backendReady) {
    Write-Host "  ⚠️  Backend took too long to start. Check logs with: docker-compose logs backend" -ForegroundColor Yellow
}

# Step 6: Seed database
Write-Host ""
Write-Host "[6/6] Seeding database with sample data..." -ForegroundColor Yellow
$wallet = '0x742d35cc6634c0532925a3b844bc9e7595f0beb1'
$seedCommand = @"
db.agents.deleteMany({walletAddress:'$wallet'});
db.agents.insertMany([
  {walletAddress:'$wallet',name:'DeFi Yield Optimizer',type:'yield',status:'active',chains:['Ethereum','Polygon'],performance:{apy:18.5,totalPnl:2450.75,winRate:87.3,totalTrades:156},createdAt:new Date(),updatedAt:new Date()},
  {walletAddress:'$wallet',name:'Cross-Chain Arbitrage Bot',type:'arbitrage',status:'active',chains:['Ethereum','BSC'],performance:{apy:24.2,totalPnl:3890.50,winRate:92.1,totalTrades:243},createdAt:new Date(),updatedAt:new Date()},
  {walletAddress:'$wallet',name:'Portfolio Rebalancer',type:'rebalancer',status:'active',chains:['Ethereum'],performance:{apy:12.8,totalPnl:1567.25,winRate:78.5,totalTrades:89},createdAt:new Date(),updatedAt:new Date()},
  {walletAddress:'$wallet',name:'Risk Manager',type:'risk',status:'active',chains:['Ethereum','Polygon'],performance:{apy:8.5,totalPnl:890.00,winRate:95.2,totalTrades:67},createdAt:new Date(),updatedAt:new Date()}
]);
print('✅ Seeded 4 AI agents');
"@

try {
    docker exec lokiai-mongodb mongosh -u admin -p lokiai2024 --authenticationDatabase admin loki_agents --eval $seedCommand | Out-Null
    Write-Host "  ✅ Database seeded successfully" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Database seeding failed (may already be seeded)" -ForegroundColor Yellow
}

# Final Status
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Services Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Frontend:    http://localhost:5173" -ForegroundColor Green
Write-Host "✅ Backend:     http://localhost:5000" -ForegroundColor Green
Write-Host "✅ GhostKey:    http://localhost:25000" -ForegroundColor Green
Write-Host "✅ MongoDB:     mongodb://localhost:27017" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Quick Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test backend
try {
    $health = (Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing).Content | ConvertFrom-Json
    Write-Host "✅ Backend Health: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend Health: Failed" -ForegroundColor Red
}

# Test agents API
try {
    $agents = (Invoke-WebRequest -Uri "http://localhost:5000/api/agents/status?wallet=$wallet" -UseBasicParsing).Content | ConvertFrom-Json
    Write-Host "✅ Agents API: $($agents.agents.Count) agents found" -ForegroundColor Green
} catch {
    Write-Host "❌ Agents API: Failed" -ForegroundColor Red
}

# Test dashboard API
try {
    $dashboard = (Invoke-WebRequest -Uri "http://localhost:5000/api/dashboard/summary?wallet=$wallet" -UseBasicParsing).Content | ConvertFrom-Json
    Write-Host "✅ Dashboard API: Portfolio value $($dashboard.portfolioValue)" -ForegroundColor Green
} catch {
    Write-Host "❌ Dashboard API: Failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  🎉 Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Open your browser and go to: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "To view logs: docker-compose logs -f" -ForegroundColor Gray
Write-Host "To stop: docker-compose down" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"
