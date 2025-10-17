# LokiAI All Services Startup Script
# Starts all services in separate windows like Docker would

Write-Host "🚀 Starting LokiAI Complete System..." -ForegroundColor Green
Write-Host ""

# Check prerequisites
try {
    $nodeVersion = node --version 2>$null
    Write-Host "[OK] Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not installed" -ForegroundColor Red
    exit 1
}

try {
    $pythonVersion = python --version 2>$null
    Write-Host "[OK] Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Python is not installed" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "[INSTALL] Checking dependencies..." -ForegroundColor Yellow
if (!(Test-Path "node_modules")) {
    Write-Host "[INSTALL] Installing Node.js dependencies..." -ForegroundColor Yellow
    npm install --silent
} else {
    Write-Host "[OK] Node.js dependencies already installed" -ForegroundColor Green
}

# Create logs directory
if (!(Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

Write-Host "[SERVICES] Starting all services..." -ForegroundColor Green

# Start Backend Server with Biometric Auth
Write-Host "[BACKEND] Starting Backend Server (Port 5000)..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "backend-server.js" -WindowStyle Normal -WorkingDirectory $PWD
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "[FRONTEND] Starting Frontend (Port 5173)..." -ForegroundColor Cyan
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Normal -WorkingDirectory $PWD
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "[SUCCESS] All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "[URLS] Service URLs:" -ForegroundColor Yellow
Write-Host "  - Frontend:        http://localhost:5173" -ForegroundColor White
Write-Host "  - Frontend (Network): http://192.168.31.233:5173" -ForegroundColor White
Write-Host "  - Backend:         http://localhost:5000" -ForegroundColor White
Write-Host "  - Backend (Network): http://192.168.31.233:5000" -ForegroundColor White
Write-Host "  - Health Check:    http://localhost:5000/health" -ForegroundColor White
Write-Host ""
Write-Host "[INFO] All services are running in separate windows" -ForegroundColor Cyan
Write-Host "[INFO] Close the windows to stop services" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to continue"