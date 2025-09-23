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
Write-Host "[INSTALL] Installing dependencies..." -ForegroundColor Yellow
npm install --silent
pip install fastapi uvicorn numpy pandas scikit-learn aiohttp requests web3 python-json-logger --quiet

# Create logs directory
if (!(Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

Write-Host "[SERVICES] Starting all services..." -ForegroundColor Green

# Start ML API Service
Write-Host "[ML] Starting ML API Service (Port 8000)..." -ForegroundColor Cyan
Start-Process -FilePath "python" -ArgumentList "ml_api_service.py" -WindowStyle Normal -WorkingDirectory $PWD
Start-Sleep -Seconds 3

# Start Backend Server
Write-Host "[BACKEND] Starting Backend Server (Port 25001)..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "backend_server_enhanced.js" -WindowStyle Normal -WorkingDirectory $PWD
Start-Sleep -Seconds 3

# Start Deposit Service
Write-Host "[DEPOSIT] Starting Deposit Service (Port 25002)..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "backend_deposit_service.js" -WindowStyle Normal -WorkingDirectory $PWD
Start-Sleep -Seconds 3

# Start Capital Allocation Service
Write-Host "[CAPITAL] Starting Capital Allocation Service (Port 25003)..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "capital_allocation_service.js" -WindowStyle Normal -WorkingDirectory $PWD
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
Write-Host "  - Backend:         http://127.0.0.1:25001" -ForegroundColor White
Write-Host "  - ML API:          http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  - ML API Docs:     http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "  - Deposit Service: http://127.0.0.1:25002" -ForegroundColor White
Write-Host "  - Capital Service: http://127.0.0.1:25003" -ForegroundColor White
Write-Host ""
Write-Host "[INFO] All services are running in separate windows" -ForegroundColor Cyan
Write-Host "[INFO] Close the windows to stop services" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to continue"