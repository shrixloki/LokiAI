#!/usr/bin/env pwsh

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 LokiAI Production Agents Startup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting 4 Production-Level AI Agents:" -ForegroundColor Yellow
Write-Host "1. Arbitrage Bot (LSTM-based)" -ForegroundColor White
Write-Host "2. Yield Optimizer (DQN-based)" -ForegroundColor White
Write-Host "3. Risk Manager (Advanced blockchain analysis)" -ForegroundColor White
Write-Host "4. Portfolio Rebalancer (Python-based)" -ForegroundColor White
Write-Host ""

# Check if Docker is running
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker is running: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not running" -ForegroundColor Red
    Write-Host "Please install Docker Desktop and try again" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Stop any existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.production-agents.yml down

# Clean up old images (optional)
Write-Host "🧹 Cleaning up old images..." -ForegroundColor Yellow
docker system prune -f

# Navigate to script directory
Set-Location $PSScriptRoot

# Build and start production services
Write-Host "🔨 Building production services..." -ForegroundColor Yellow
docker-compose -f docker-compose.production-agents.yml build --no-cache

Write-Host "🚀 Starting production agents..." -ForegroundColor Green
docker-compose -f docker-compose.production-agents.yml up -d

# Wait for services to start
Write-Host "⏳ Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check service status
Write-Host "📊 Checking service status..." -ForegroundColor Yellow
docker-compose -f docker-compose.production-agents.yml ps

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Production Agents Started Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Frontend: http://localhost" -ForegroundColor Cyan
Write-Host "🔧 Backend API: http://localhost:5000" -ForegroundColor Cyan
Write-Host "📊 Grafana Dashboard: http://localhost:3000 (admin/lokiai2024)" -ForegroundColor Cyan
Write-Host "📈 Prometheus: http://localhost:9090" -ForegroundColor Cyan
Write-Host "🔬 Biometrics: http://localhost:25000" -ForegroundColor Cyan
Write-Host "🔄 Rebalancer API: http://localhost:5001" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 Open http://localhost to start trading with production agents!" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to continue"