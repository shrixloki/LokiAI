#!/usr/bin/env pwsh

# LokiAI Service Monitoring Script

function Get-ServiceStatus {
    param($serviceName)
    
    $status = docker inspect -f '{{.State.Status}}' "lokiai-$serviceName" 2>$null
    
    if ($status -eq "running") {
        return @{ Status = "✅ Running"; Color = "Green" }
    } elseif ($status -eq "restarting") {
        return @{ Status = "🔄 Restarting"; Color = "Yellow" }
    } else {
        return @{ Status = "❌ Stopped"; Color = "Red" }
    }
}

function Get-ServiceHealth {
    param($url)
    
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            return @{ Status = "✅ Healthy"; Color = "Green" }
        }
    } catch {
        return @{ Status = "❌ Unhealthy"; Color = "Red" }
    }
}

function Show-ServiceInfo {
    Clear-Host
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  LokiAI Service Monitor" -ForegroundColor Cyan
    Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Service Status
    Write-Host "Service Status:" -ForegroundColor Yellow
    Write-Host "---------------" -ForegroundColor Yellow
    
    $services = @("mongodb", "biometrics", "backend", "frontend", "nginx")
    
    foreach ($service in $services) {
        $status = Get-ServiceStatus -serviceName $service
        Write-Host "  $service`: " -NoNewline
        Write-Host $status.Status -ForegroundColor $status.Color
    }
    
    Write-Host ""
    
    # Health Checks
    Write-Host "Health Checks:" -ForegroundColor Yellow
    Write-Host "--------------" -ForegroundColor Yellow
    
    $backend = Get-ServiceHealth -url "http://localhost/api/health"
    Write-Host "  Backend API: " -NoNewline
    Write-Host $backend.Status -ForegroundColor $backend.Color
    
    $biometrics = Get-ServiceHealth -url "http://localhost/biometrics/health"
    Write-Host "  Biometrics:  " -NoNewline
    Write-Host $biometrics.Status -ForegroundColor $biometrics.Color
    
    Write-Host ""
    
    # Resource Usage
    Write-Host "Resource Usage:" -ForegroundColor Yellow
    Write-Host "---------------" -ForegroundColor Yellow
    
    $stats = docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | Select-Object -Skip 1
    
    foreach ($line in $stats) {
        if ($line -match "lokiai") {
            Write-Host "  $line" -ForegroundColor White
        }
    }
    
    Write-Host ""
    
    # Access Points
    Write-Host "Access Points:" -ForegroundColor Yellow
    Write-Host "--------------" -ForegroundColor Yellow
    Write-Host "  Frontend:    http://localhost" -ForegroundColor White
    Write-Host "  Backend:     http://localhost/api/health" -ForegroundColor White
    Write-Host "  Biometrics:  http://localhost/biometrics/health" -ForegroundColor White
    Write-Host "  MongoDB:     mongodb://localhost:27017" -ForegroundColor White
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to exit" -ForegroundColor Gray
    Write-Host ""
}

# Main monitoring loop
Write-Host "Starting LokiAI Service Monitor..." -ForegroundColor Green
Write-Host "Monitoring services every 5 seconds..." -ForegroundColor Green
Write-Host ""

while ($true) {
    Show-ServiceInfo
    Start-Sleep -Seconds 5
}
