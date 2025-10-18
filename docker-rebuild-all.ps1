#!/usr/bin/env pwsh

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🐳 LokiAI Complete Docker Rebuild" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "1. Stop all running containers" -ForegroundColor White
Write-Host "2. Remove old images and containers" -ForegroundColor White
Write-Host "3. Rebuild all services from scratch" -ForegroundColor White
Write-Host "4. Start the complete production system" -ForegroundColor White
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

# Stop all containers
Write-Host "🛑 Stopping all containers..." -ForegroundColor Yellow
try {
    docker stop $(docker ps -aq) 2>$null
    docker-compose -f docker-compose.simple.yml down 2>$null
    docker-compose -f docker-compose.production-agents.yml down 2>$null
} catch {
    Write-Host "No containers to stop" -ForegroundColor Gray
}

# Remove all containers
Write-Host "🗑️ Removing old containers..." -ForegroundColor Yellow
try {
    docker rm $(docker ps -aq) 2>$null
} catch {
    Write-Host "No containers to remove" -ForegroundColor Gray
}

# Remove all images (force clean rebuild)
Write-Host "🧹 Removing old images..." -ForegroundColor Yellow
try {
    docker rmi $(docker images -q) -f 2>$null
} catch {
    Write-Host "No images to remove" -ForegroundColor Gray
}

# Clean Docker system
Write-Host "🧽 Cleaning Docker system..." -ForegroundColor Yellow
docker system prune -af --volumes

# Build all services from scratch
Write-Host "🔨 Building all services from scratch..." -ForegroundColor Yellow
docker-compose -f docker-compose.simple.yml build --no-cache --parallel

# Start all services
Write-Host "🚀 Starting all production services..." -ForegroundColor Green
docker-compose -f docker-compose.simple.yml up -d

# Wait for services to initialize
Write-Host "⏳ Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check service status
Write-Host "📊 Checking service status..." -ForegroundColor Yellow
docker-compose -f docker-compose.simple.yml ps

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Docker Rebuild Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 Backend API: http://localhost:5000" -ForegroundColor Cyan
Write-Host "🔄 Rebalancer API: http://localhost:5001" -ForegroundColor Cyan
Write-Host "📊 MongoDB: localhost:27017" -ForegroundColor Cyan
Write-Host ""

# Start frontend
Write-Host "🌐 Starting frontend..." -ForegroundColor Yellow
Set-Location LokiAi
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Normal

Write-Host ""
Write-Host "🎯 Frontend will open at: http://localhost:5173" -ForegroundColor Green
Write-Host "🎯 Test backend: node ../test-backend-connection.js" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to continue"