#!/usr/bin/env pwsh

Write-Host "🚀 Starting LokiAI Agents System" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not available" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "🔧 Starting MongoDB (if not running)..." -ForegroundColor Yellow
# Try to start MongoDB service (Windows)
try {
    Start-Service -Name "MongoDB" -ErrorAction SilentlyContinue
} catch {
    Write-Host "⚠️ MongoDB service not found or already running" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🖥️ Starting Backend Server..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "node backend/server.js" -WindowStyle Normal

Write-Host ""
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "🌐 Starting Frontend Development Server..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "⏳ Waiting for frontend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "🧪 Running Agent Functionality Tests..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
node test-agents-functionality.js

Write-Host ""
Write-Host "🎉 LokiAI Agents System Started Successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access Points:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5175" -ForegroundColor White
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "   Health:   http://localhost:5000/health" -ForegroundColor White
Write-Host ""
Write-Host "🤖 Available AI Agents:" -ForegroundColor Cyan
Write-Host "   - Arbitrage Bot (Cross-DEX price scanning)" -ForegroundColor White
Write-Host "   - Yield Optimizer (DeFi protocol analysis)" -ForegroundColor White
Write-Host ""
Write-Host "💡 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Open http://localhost:5175 in your browser" -ForegroundColor White
Write-Host "   2. Connect your MetaMask wallet" -ForegroundColor White
Write-Host "   3. Navigate to AI Agents tab" -ForegroundColor White
Write-Host "   4. Click 'Run Agent' to execute live trading logic" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to open the application..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Open the application in default browser
Start-Process "http://localhost:5175"

Write-Host ""
Write-Host "🔄 System is running. Press Ctrl+C in the terminal windows to stop." -ForegroundColor Green
Read-Host "Press Enter to exit this script"