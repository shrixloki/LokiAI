Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Restarting LokiAI Backend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kill existing Node.js processes
Write-Host "Stopping existing backend server..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*backend-server*" } | Stop-Process -Force
Start-Sleep -Seconds 2

# Start the backend server
Write-Host "Starting backend server on port 5000..." -ForegroundColor Green
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node backend-server.js"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backend server restarted!" -ForegroundColor Green
Write-Host "Server running on: http://localhost:5000" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
