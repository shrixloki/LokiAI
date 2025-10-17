#!/usr/bin/env pwsh

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  LokiAI Production Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] Stopping existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml down

Write-Host ""
Write-Host "[2/5] Cleaning up old images..." -ForegroundColor Yellow
docker system prune -f

Write-Host ""
Write-Host "[3/5] Building production images..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml build --no-cache

Write-Host ""
Write-Host "[4/5] Starting all services..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml up -d

Write-Host ""
Write-Host "[5/5] Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Service Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml ps

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Access Points" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Frontend:          http://localhost" -ForegroundColor White
Write-Host "Backend API:       http://localhost/api/health" -ForegroundColor White
Write-Host "Biometrics:        http://localhost/biometrics/health" -ForegroundColor White
Write-Host "MongoDB:           mongodb://localhost:27017" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Logs" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "View logs: docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to continue"
