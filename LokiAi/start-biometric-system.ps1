Write-Host "========================================" -ForegroundColor Cyan
Write-Host " LokiAI Biometric Authentication System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Starting GhostKey Microservice..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ..\ghost-key-main\ghost-key-main; npm run dev"
Start-Sleep -Seconds 5

Write-Host "[2/3] Starting LokiAI Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node backend-server-complete.js"
Start-Sleep -Seconds 3

Write-Host "[3/3] Starting LokiAI Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " All Services Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  GhostKey:  http://127.0.0.1:25000" -ForegroundColor White
Write-Host "  Backend:   http://localhost:5000" -ForegroundColor White
Write-Host "  Frontend:  http://localhost:5175" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
