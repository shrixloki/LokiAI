@echo off
echo ========================================
echo Starting LokiAI with Docker
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not running
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo ✅ Docker is installed

echo.
echo [2/4] Building Docker images...
docker-compose build

echo.
echo [3/4] Starting services...
docker-compose up -d

echo.
echo [4/4] Waiting for services to be ready...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo Services Status
echo ========================================
docker-compose ps

echo.
echo ========================================
echo LokiAI is starting!
echo ========================================
echo.
echo 🌐 Frontend:  http://localhost:5173
echo 🔧 Backend:   http://localhost:5000
echo 🔐 GhostKey:  http://localhost:25000
echo 💾 MongoDB:   mongodb://localhost:27017
echo.
echo View logs with: docker-compose logs -f
echo Stop services with: docker-compose down
echo.
pause
