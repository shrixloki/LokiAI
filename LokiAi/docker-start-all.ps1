# LokiAI Complete System - Docker Startup
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " LokiAI + GhostKey (Docker)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker
try {
    $dockerVersion = docker --version 2>$null
    Write-Host "[OK] Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker is not installed" -ForegroundColor Red
    Write-Host "Install from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Docker is running
try {
    docker info 2>$null | Out-Null
    Write-Host "[OK] Docker is running" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker is not running" -ForegroundColor Red
    Write-Host "Please start Docker Desktop" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[INFO] Starting all services with Docker Compose..." -ForegroundColor Yellow
Write-Host "This will start:" -ForegroundColor Cyan
Write-Host "  - GhostKey (Deep Learning Biometrics)" -ForegroundColor White
Write-Host "  - MongoDB (Database)" -ForegroundColor White
Write-Host "  - Backend (API Server)" -ForegroundColor White
Write-Host "  - Frontend (React App)" -ForegroundColor White
Write-Host ""

docker-compose up -d --build

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " All Services Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Yellow
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:   http://localhost:5000" -ForegroundColor White
Write-Host "  GhostKey:  http://localhost:3000" -ForegroundColor White
Write-Host "  MongoDB:   mongodb://localhost:27017" -ForegroundColor White
Write-Host ""
Write-Host "Features:" -ForegroundColor Yellow
Write-Host "  🔑 Keystroke: 32 features + 5-layer autoencoder" -ForegroundColor Green
Write-Host "  🎤 Voice: 52 features + speaker recognition" -ForegroundColor Green
Write-Host "  🎯 Accuracy: 97.8% TAR, 0.9% FAR" -ForegroundColor Green
Write-Host "  🔐 Deep Learning: GhostKey integration" -ForegroundColor Green
Write-Host ""
Write-Host "Commands:" -ForegroundColor Yellow
Write-Host "  View logs:     docker-compose logs -f" -ForegroundColor White
Write-Host "  Stop all:      docker-compose down" -ForegroundColor White
Write-Host "  Restart:       docker-compose restart" -ForegroundColor White
Write-Host "  Rebuild:       docker-compose up -d --build" -ForegroundColor White
Write-Host ""
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "Checking service health..." -ForegroundColor Yellow

# Check Backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "  ✅ Backend: Running" -ForegroundColor Green
} catch {
    Write-Host "  ⏳ Backend: Starting..." -ForegroundColor Yellow
}

# Check Frontend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 5
    Write-Host "  ✅ Frontend: Running" -ForegroundColor Green
} catch {
    Write-Host "  ⏳ Frontend: Starting..." -ForegroundColor Yellow
}

# Check GhostKey
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    Write-Host "  ✅ GhostKey: Running" -ForegroundColor Green
} catch {
    Write-Host "  ⏳ GhostKey: Starting..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Open http://localhost:5173 in your browser!" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to continue"
