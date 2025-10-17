#!/usr/bin/env pwsh

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " LokiAI Dashboard - Docker Startup" -ForegroundColor Cyan
Write-Host " With Live Data Integration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] Stopping any existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.yml down
Write-Host ""

Write-Host "[2/5] Building Docker images..." -ForegroundColor Yellow
docker-compose -f docker-compose.yml build
Write-Host ""

Write-Host "[3/5] Starting all services..." -ForegroundColor Yellow
docker-compose -f docker-compose.yml up -d
Write-Host ""

Write-Host "[4/5] Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
Write-Host ""

Write-Host "[5/5] Checking service status..." -ForegroundColor Yellow
docker-compose -f docker-compose.yml ps
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host " Services Started Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:   http://localhost:5000" -ForegroundColor White
Write-Host "  GhostKey:  http://localhost:25000" -ForegroundColor White
Write-Host "  MongoDB:   mongodb://localhost:27017" -ForegroundColor White
Write-Host ""
Write-Host "  Dashboard API: http://localhost:5000/api/dashboard/summary" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Next Steps:" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "  1. Open http://localhost:5173" -ForegroundColor White
Write-Host "  2. Connect MetaMask (Sepolia testnet)" -ForegroundColor White
Write-Host "  3. Navigate to Dashboard" -ForegroundColor White
Write-Host "  4. See your real portfolio value!" -ForegroundColor White
Write-Host ""
Write-Host "  To view logs: docker-compose -f docker-compose.yml logs -f" -ForegroundColor Gray
Write-Host "  To stop: docker-compose -f docker-compose.yml down" -ForegroundColor Gray
Write-Host ""
