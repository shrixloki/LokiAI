#!/usr/bin/env pwsh

# LokiAI Setup Verification Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  LokiAI Setup Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check Docker
Write-Host "[1/8] Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "  ✅ Docker installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Docker not found. Please install Docker Desktop." -ForegroundColor Red
    $allGood = $false
}

# Check Docker Compose
Write-Host "[2/8] Checking Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker-compose --version
    Write-Host "  ✅ Docker Compose installed: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Docker Compose not found." -ForegroundColor Red
    $allGood = $false
}

# Check Docker running
Write-Host "[3/8] Checking Docker status..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "  ✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    $allGood = $false
}

# Check required files
Write-Host "[4/8] Checking required files..." -ForegroundColor Yellow
$requiredFiles = @(
    "docker-compose.prod.yml",
    "nginx.conf",
    "nginx-frontend.conf",
    "Dockerfile.backend",
    "Dockerfile.biometrics",
    "Dockerfile.frontend.prod",
    "backend/server.js",
    "backend/package.json",
    "biometrics/app.py",
    "biometrics/requirements.txt"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file missing" -ForegroundColor Red
        $missingFiles += $file
        $allGood = $false
    }
}

# Check environment file
Write-Host "[5/8] Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "  ✅ .env file exists" -ForegroundColor Green
    
    # Check for required variables
    $envContent = Get-Content .env -Raw
    $requiredVars = @("MONGODB_URI", "PORT", "BIOMETRICS_URL")
    
    foreach ($var in $requiredVars) {
        if ($envContent -match $var) {
            Write-Host "  ✅ $var configured" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  $var not found in .env" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "  ⚠️  .env file not found. Copy .env.production to .env" -ForegroundColor Yellow
}

# Check ports availability
Write-Host "[6/8] Checking port availability..." -ForegroundColor Yellow
$ports = @(80, 5000, 5050, 25000, 27017)
$portsInUse = @()

foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "  ⚠️  Port $port is in use" -ForegroundColor Yellow
        $portsInUse += $port
    } else {
        Write-Host "  ✅ Port $port available" -ForegroundColor Green
    }
}

# Check disk space
Write-Host "[7/8] Checking disk space..." -ForegroundColor Yellow
$drive = Get-PSDrive -Name C
$freeSpaceGB = [math]::Round($drive.Free / 1GB, 2)

if ($freeSpaceGB -gt 10) {
    Write-Host "  ✅ Sufficient disk space: ${freeSpaceGB}GB free" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Low disk space: ${freeSpaceGB}GB free (10GB+ recommended)" -ForegroundColor Yellow
}

# Check memory
Write-Host "[8/8] Checking system memory..." -ForegroundColor Yellow
$totalRAM = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 2)

if ($totalRAM -ge 8) {
    Write-Host "  ✅ Sufficient RAM: ${totalRAM}GB" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Low RAM: ${totalRAM}GB (8GB+ recommended)" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Verification Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($allGood -and $portsInUse.Count -eq 0) {
    Write-Host "✅ All checks passed! Ready to deploy." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Review .env configuration" -ForegroundColor White
    Write-Host "  2. Run: .\docker-start-production.ps1" -ForegroundColor White
    Write-Host "  3. Test: node test-production-deployment.js" -ForegroundColor White
    Write-Host "  4. Access: http://localhost" -ForegroundColor White
} else {
    Write-Host "⚠️  Some issues found. Please resolve them before deploying." -ForegroundColor Yellow
    
    if ($missingFiles.Count -gt 0) {
        Write-Host ""
        Write-Host "Missing files:" -ForegroundColor Red
        foreach ($file in $missingFiles) {
            Write-Host "  - $file" -ForegroundColor Red
        }
    }
    
    if ($portsInUse.Count -gt 0) {
        Write-Host ""
        Write-Host "Ports in use:" -ForegroundColor Yellow
        foreach ($port in $portsInUse) {
            Write-Host "  - Port $port" -ForegroundColor Yellow
        }
        Write-Host "Stop services using these ports or modify docker-compose.prod.yml" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to exit"
