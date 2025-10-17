#!/usr/bin/env pwsh

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AI Agents Live Integration Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$WALLET_ADDRESS = if ($args[0]) { $args[0] } else { "0x8bbfa86f2766fd05220f319a4d122c97fbc4b529" }

Write-Host "Step 1: Seeding MongoDB with agent data..." -ForegroundColor Yellow
Write-Host "Wallet: $WALLET_ADDRESS" -ForegroundColor White
Write-Host ""
node seed-docker-mongodb.js $WALLET_ADDRESS

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 2: Testing API endpoint..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
node test-agents-api.js $WALLET_ADDRESS

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start backend: node backend-server.js" -ForegroundColor White
Write-Host "2. Start frontend: npm run dev" -ForegroundColor White
Write-Host "3. Connect MetaMask with wallet: $WALLET_ADDRESS" -ForegroundColor White
Write-Host "4. Navigate to AI Agents page" -ForegroundColor White
Write-Host ""
Write-Host "API Endpoint: http://localhost:5000/api/agents/status?wallet=$WALLET_ADDRESS" -ForegroundColor Cyan
Write-Host ""
