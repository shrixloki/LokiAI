#!/usr/bin/env pwsh

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 LokiAI Simple Production Start" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting Essential Services:" -ForegroundColor Yellow
Write-Host "1. Backend with 4 Production Agents" -ForegroundColor White
Write-Host "2. MongoDB Database" -ForegroundColor White
Write-Host "3. Rebalancer API" -ForegroundColor White
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
docker-compose -f docker-compose.simple.yml down

# Build and start essential services
Write-Host "🔨 Building essential services..." -ForegroundColor Yellow
docker-compose -f docker-compose.simple.yml build

Write-Host "🚀 Starting production agents..." -ForegroundColor Green
docker-compose -f docker-compose.simple.yml up -d

# Wait for services to start
Write-Host "⏳ Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Check service status
Write-Host "📊 Checking service status..." -ForegroundColor Yellow
docker-compose -f docker-compose.simple.yml ps

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Essential Services Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 Backend API: http://localhost:5000" -ForegroundColor Cyan
Write-Host "🔄 Rebalancer API: http://localhost:5001" -ForegroundColor Cyan
Write-Host "📊 MongoDB: localhost:27017" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 Test the API: http://localhost:5000/health" -ForegroundColor Green
Write-Host ""

# Start frontend development server
Write-Host "🌐 Starting frontend development server..." -ForegroundColor Yellow
Set-Location LokiAi

# Start frontend in background
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Normal

Write-Host ""
Write-Host "🎯 Frontend will open at: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop services when done" -ForegroundColor Yellow
Read-Host "Press Enter to continue"