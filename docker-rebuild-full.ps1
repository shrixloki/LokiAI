#!/usr/bin/env pwsh

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 LokiAI Full Docker Containerization" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if Docker is running
function Test-DockerRunning {
    try {
        docker version | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Check Docker
if (-not (Test-DockerRunning)) {
    Write-Host "❌ Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Docker is running" -ForegroundColor Green
Write-Host ""

# Stop existing containers
Write-Host "🛑 Stopping all existing containers..." -ForegroundColor Yellow
try {
    docker-compose -f docker-compose.full.yml down 2>$null
    docker-compose -f docker-compose.simple.yml down 2>$null
    Write-Host "✅ Containers stopped" -ForegroundColor Green
} catch {
    Write-Host "⚠️ No containers to stop" -ForegroundColor Gray
}

Write-Host ""

# Clean Docker system
Write-Host "🧹 Cleaning Docker system..." -ForegroundColor Yellow
try {
    docker system prune -f | Out-Null
    Write-Host "✅ Docker system cleaned" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Docker clean completed with warnings" -ForegroundColor Yellow
}

Write-Host ""

# Build services
Write-Host "🔨 Building all services from scratch..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray

$buildResult = docker-compose -f docker-compose.full.yml build --no-cache
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host "Check the error messages above." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ All services built successfully" -ForegroundColor Green
Write-Host ""

# Start services
Write-Host "🚀 Starting all services..." -ForegroundColor Yellow
$startResult = docker-compose -f docker-compose.full.yml up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start services!" -ForegroundColor Red
    Write-Host "Check the error messages above." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ All services started" -ForegroundColor Green
Write-Host ""

# Wait for services
Write-Host "⏳ Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check status
Write-Host "📊 Checking service status..." -ForegroundColor Yellow
docker-compose -f docker-compose.full.yml ps

Write-Host ""

# Test system
Write-Host "🧪 Testing the containerized system..." -ForegroundColor Yellow
node test-simple.js

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Full Docker Containerization Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🌐 Service URLs:" -ForegroundColor Cyan
Write-Host "- Frontend:    http://localhost:5173" -ForegroundColor White
Write-Host "- Backend:     http://localhost:5000/health" -ForegroundColor White
Write-Host "- Rebalancer:  http://localhost:5001/api/health" -ForegroundColor White
Write-Host "- MongoDB:     localhost:27017" -ForegroundColor White
Write-Host ""

Write-Host "📋 Docker Commands:" -ForegroundColor Cyan
Write-Host "- View logs:   docker-compose -f docker-compose.full.yml logs" -ForegroundColor White
Write-Host "- Stop all:    docker-compose -f docker-compose.full.yml down" -ForegroundColor White
Write-Host "- Restart:     docker-compose -f docker-compose.full.yml restart" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to continue"