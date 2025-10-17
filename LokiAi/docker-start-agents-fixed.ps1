#!/usr/bin/env pwsh

Write-Host "🐳 Starting LokiAI Agents System with Docker" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Checking Docker..." -ForegroundColor Yellow

# Check if Docker is installed and running
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker is available: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not running" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from https://docker.com/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "🛑 Stopping any existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.agents.yml down

Write-Host ""
Write-Host "🏗️ Building and starting LokiAI Agents system..." -ForegroundColor Yellow
docker-compose -f docker-compose.agents.yml up --build -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start Docker services" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "🧪 Testing system health..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test backend health
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:5001/health" -TimeoutSec 10
    Write-Host "✅ Backend health check passed" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Backend health check failed (may still be starting)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 LokiAI Agents System Started with Docker!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access Points:" -ForegroundColor Cyan
Write-Host "   Frontend:     http://localhost:5175" -ForegroundColor White
Write-Host "   Backend API:  http://localhost:5001" -ForegroundColor White
Write-Host "   MongoDB:      localhost:27017" -ForegroundColor White
Write-Host "   Biometrics:   http://localhost:25000" -ForegroundColor White
Write-Host ""
Write-Host "🐳 Docker Services:" -ForegroundColor Cyan
docker-compose -f docker-compose.agents.yml ps

Write-Host ""
Write-Host "📊 Useful Commands:" -ForegroundColor Cyan
Write-Host "   View logs:    docker-compose -f docker-compose.agents.yml logs -f" -ForegroundColor White
Write-Host "   Stop system:  docker-compose -f docker-compose.agents.yml down" -ForegroundColor White
Write-Host "   Restart:      docker-compose -f docker-compose.agents.yml restart" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to open the application..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Open the application in default browser
Start-Process "http://localhost:5175"

Write-Host ""
Write-Host "🔄 System is running in Docker containers." -ForegroundColor Green
Write-Host "Use docker-compose -f docker-compose.agents.yml down to stop." -ForegroundColor Yellow
Read-Host "Press Enter to exit this script"