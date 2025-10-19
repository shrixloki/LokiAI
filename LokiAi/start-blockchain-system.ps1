# LokiAI Blockchain System Startup Script (PowerShell)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    LokiAI Blockchain System Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is available" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Docker is not installed or not running" -ForegroundColor Red
    Write-Host "Please install Docker Desktop and make sure it's running" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "⚠️  No .env file found. Creating from template..." -ForegroundColor Yellow
    Copy-Item ".env.blockchain" ".env"
    Write-Host ""
    Write-Host "📝 IMPORTANT: Please edit the .env file with your actual:" -ForegroundColor Yellow
    Write-Host "   - RPC URLs (Alchemy, Infura, QuickNode)" -ForegroundColor Yellow
    Write-Host "   - Private keys for server wallets" -ForegroundColor Yellow
    Write-Host "   - API keys for blockchain providers" -ForegroundColor Yellow
    Write-Host "   - Notification service tokens (optional)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to continue with demo configuration..." -ForegroundColor Cyan
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

Write-Host ""
Write-Host "🔧 Starting LokiAI Blockchain System..." -ForegroundColor Cyan
Write-Host ""

# Stop any existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.blockchain.yml down

# Build and start all services
Write-Host "🚀 Building and starting all services..." -ForegroundColor Green
docker-compose -f docker-compose.blockchain.yml up --build -d

# Wait for services to start
Write-Host "⏳ Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check service health
Write-Host "🔍 Checking service health..." -ForegroundColor Cyan
Write-Host ""

# Check MongoDB
try {
    docker-compose -f docker-compose.blockchain.yml exec -T mongodb mongosh --eval "db.adminCommand('ping')" | Out-Null
    Write-Host "✅ MongoDB: Running" -ForegroundColor Green
} catch {
    Write-Host "❌ MongoDB: Not responding" -ForegroundColor Red
}

# Check Redis
try {
    docker-compose -f docker-compose.blockchain.yml exec -T redis redis-cli ping | Out-Null
    Write-Host "✅ Redis: Running" -ForegroundColor Green
} catch {
    Write-Host "❌ Redis: Not responding" -ForegroundColor Red
}

# Check Backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend: Running" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend: Not responding" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend: Not responding" -ForegroundColor Red
}

# Check Frontend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend: Running" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend: Not responding" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Frontend: Not responding" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       🎉 LokiAI System Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Frontend:     http://localhost:3000" -ForegroundColor White
Write-Host "🔧 Backend API:  http://localhost:5000" -ForegroundColor White
Write-Host "📊 Health Check: http://localhost:5000/health" -ForegroundColor White
Write-Host "🗄️  MongoDB:     localhost:27017" -ForegroundColor White
Write-Host "💾 Redis:       localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "📋 Available Commands:" -ForegroundColor Yellow
Write-Host "   docker-compose -f docker-compose.blockchain.yml logs -f     (View logs)" -ForegroundColor Gray
Write-Host "   docker-compose -f docker-compose.blockchain.yml ps          (Check status)" -ForegroundColor Gray
Write-Host "   docker-compose -f docker-compose.blockchain.yml down        (Stop system)" -ForegroundColor Gray
Write-Host "   docker-compose -f docker-compose.blockchain.yml restart     (Restart system)" -ForegroundColor Gray
Write-Host ""
Write-Host "🔐 SECURITY REMINDER:" -ForegroundColor Red
Write-Host "   - Configure real RPC URLs in .env file" -ForegroundColor Yellow
Write-Host "   - Use secure private keys for production" -ForegroundColor Yellow
Write-Host "   - Enable notifications for monitoring" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to view live logs (Ctrl+C to exit logs)..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Show live logs
docker-compose -f docker-compose.blockchain.yml logs -f