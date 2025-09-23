# LokiAI System Startup Script for PowerShell
# Starts all components of the LokiAI ML-driven DeFi agent system

Write-Host "[START] Starting LokiAI Complete System..." -ForegroundColor Green
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>$null
    Write-Host "[OK] Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.8+ and try again" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    Write-Host "[OK] Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js 18+ and try again" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[INSTALL] Installing dependencies..." -ForegroundColor Yellow

# Install Python dependencies
Write-Host "Installing Python packages..." -ForegroundColor Gray
pip install fastapi uvicorn numpy pandas scikit-learn aiohttp requests web3 python-json-logger pytest pytest-asyncio 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARN] Some Python packages may have failed to install" -ForegroundColor Yellow
}

# Install Node.js dependencies
Write-Host "Installing Node.js packages..." -ForegroundColor Gray
npm install express cors ethers node-fetch winston dotenv web3 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARN] Some Node.js packages may have failed to install" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[SERVICES] Starting all services..." -ForegroundColor Green
Write-Host ""

# Create logs directory
if (!(Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

# Start ML API Service
Write-Host "[ML] Starting ML API Service (Port 8000)..." -ForegroundColor Cyan
Start-Process -FilePath "python" -ArgumentList "ml_api_service.py" -WindowStyle Normal
Start-Sleep -Seconds 3

# Start Backend Server
Write-Host "[BACKEND] Starting Backend Server (Port 25001)..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "backend_server_enhanced.js" -WindowStyle Normal
Start-Sleep -Seconds 3

# Start Deposit Service
Write-Host "[DEPOSIT] Starting Deposit Service (Port 25002)..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "backend_deposit_service.js" -WindowStyle Normal
Start-Sleep -Seconds 3

# Start Capital Allocation Service
Write-Host "[CAPITAL] Starting Capital Allocation Service (Port 25003)..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "capital_allocation_service.js" -WindowStyle Normal
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "[FRONTEND] Starting Frontend (Port 5173)..." -ForegroundColor Cyan
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Normal
Start-Sleep -Seconds 3

# Start Monitor (Optional)
Write-Host "[MONITOR] Starting System Monitor..." -ForegroundColor Cyan
Start-Process -FilePath "python" -ArgumentList "system_status.py" -WindowStyle Normal

Write-Host ""
Write-Host "[SUCCESS] All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "[URLS] Service URLs:" -ForegroundColor Yellow
Write-Host "  - Frontend:        http://localhost:5173" -ForegroundColor White
Write-Host "  - Backend:         http://127.0.0.1:25001" -ForegroundColor White
Write-Host "  - Deposit Service: http://127.0.0.1:25002" -ForegroundColor White
Write-Host "  - Capital Service: http://127.0.0.1:25003" -ForegroundColor White
Write-Host "  - ML API:          http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  - ML API Docs:     http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "[TESTS] To run integration tests:" -ForegroundColor Yellow
Write-Host "  node test_integration.js" -ForegroundColor White
Write-Host "  node test_deposit_flow.js" -ForegroundColor White
Write-Host "  node test_capital_allocation.js" -ForegroundColor White
Write-Host ""
Write-Host "[STOP] To stop all services, close the opened windows" -ForegroundColor Red
Write-Host ""

Read-Host "Press Enter to continue"