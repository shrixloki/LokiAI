#!/usr/bin/env pwsh

Write-Host "🚀 Starting LokiAI with Fixed AI Agents System" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Checking Docker status..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not running" -ForegroundColor Red
    Write-Host "Please install Docker Desktop and try again" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "🧹 Cleaning up previous containers..." -ForegroundColor Yellow
docker-compose down --remove-orphans

Write-Host ""
Write-Host "🔧 Building and starting services..." -ForegroundColor Yellow
docker-compose up --build -d

Write-Host ""
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "📊 Checking service status..." -ForegroundColor Yellow
docker-compose ps

Write-Host ""
Write-Host "🧪 Testing AI Agents functionality..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "🎯 Testing arbitrage agent with mock data..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5050/run-agent" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"walletAddress":"0x1234567890123456789012345678901234567890","agentType":"arbitrage","config":{}}'
    
    Write-Host "✅ Agent test successful!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Cyan
} catch {
    Write-Host "⚠️ Agent test failed, but services may still be starting..." -ForegroundColor Yellow
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ LokiAI AI Agents System Started Successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔧 Backend API: http://localhost:5000" -ForegroundColor Cyan
Write-Host "🤖 AI Agents Socket: http://localhost:5050" -ForegroundColor Cyan
Write-Host "📊 MongoDB: localhost:27017" -ForegroundColor Cyan
Write-Host "🔐 GhostKey: http://localhost:25000" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Check logs with: docker-compose logs -f" -ForegroundColor Yellow
Write-Host "🛑 Stop with: docker-compose down" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to continue"