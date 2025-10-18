#!/usr/bin/env pwsh

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 LokiAI Setup & Docker Rebuild" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "docker-compose.simple.yml")) {
    Write-Host "❌ Error: docker-compose.simple.yml not found" -ForegroundColor Red
    Write-Host "Please run this script from the root directory (S:\Projects\LokiAI\loki.ai\)" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Found docker-compose.simple.yml - in correct directory" -ForegroundColor Green
Write-Host ""

# Step 1: Install Node.js dependencies
Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Some dependency issues, but continuing..." -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️ No package.json found, skipping npm install" -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Test basic connectivity (no dependencies)
Write-Host "🧪 Running basic connectivity test..." -ForegroundColor Yellow
node test-simple.js

Write-Host ""

# Step 3: Check Docker
Write-Host "🐳 Checking Docker status..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker is running: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Step 4: Docker rebuild
Write-Host "🔨 Starting Docker rebuild..." -ForegroundColor Yellow
Write-Host "This will:" -ForegroundColor White
Write-Host "1. Stop existing containers" -ForegroundColor White
Write-Host "2. Remove old images" -ForegroundColor White
Write-Host "3. Rebuild all services" -ForegroundColor White
Write-Host "4. Start production system" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Continue with Docker rebuild? (y/N)"
if ($confirm -eq "y" -or $confirm -eq "Y") {
    
    # Stop containers
    Write-Host "🛑 Stopping containers..." -ForegroundColor Yellow
    docker-compose -f docker-compose.simple.yml down 2>$null
    
    # Clean system
    Write-Host "🧹 Cleaning Docker system..." -ForegroundColor Yellow
    docker system prune -f 2>$null
    
    # Build services
    Write-Host "🔨 Building services..." -ForegroundColor Yellow
    docker-compose -f docker-compose.simple.yml build --no-cache
    
    if ($LASTEXITCODE -eq 0) {
        # Start services
        Write-Host "🚀 Starting services..." -ForegroundColor Green
        docker-compose -f docker-compose.simple.yml up -d
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "⏳ Waiting for services to initialize..." -ForegroundColor Yellow
            Start-Sleep -Seconds 20
            
            # Check status
            Write-Host "📊 Checking service status..." -ForegroundColor Yellow
            docker-compose -f docker-compose.simple.yml ps
            
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Cyan
            Write-Host "✅ Docker Rebuild Complete!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Cyan
            Write-Host ""
            
            # Test again
            Write-Host "🧪 Testing rebuilt system..." -ForegroundColor Yellow
            node test-simple.js
            
            Write-Host ""
            Write-Host "🌐 Service URLs:" -ForegroundColor Cyan
            Write-Host "- Backend: http://localhost:5000/health" -ForegroundColor White
            Write-Host "- Rebalancer: http://localhost:5001/api/health" -ForegroundColor White
            Write-Host "- Frontend: Starting..." -ForegroundColor White
            
            # Start frontend
            Write-Host ""
            Write-Host "🌐 Starting frontend..." -ForegroundColor Yellow
            Set-Location LokiAi
            Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Normal
            Set-Location ..
            
            Write-Host ""
            Write-Host "🎯 Frontend will open at: http://localhost:5173" -ForegroundColor Green
            Write-Host "🎯 Full test: npm run test (after dependencies install)" -ForegroundColor Green
            
        } else {
            Write-Host "❌ Failed to start services" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Failed to build services" -ForegroundColor Red
    }
    
} else {
    Write-Host "⏭️ Skipping Docker rebuild" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to continue"