@echo off
echo ========================================
echo 🚀 LokiAI Full Docker Containerization
echo ========================================
echo.

echo 🛑 Stopping all existing containers...
docker-compose -f docker-compose.full.yml down 2>nul
docker-compose -f docker-compose.simple.yml down 2>nul
docker stop $(docker ps -aq) 2>nul

echo.
echo 🧹 Cleaning Docker system...
docker system prune -f
docker volume prune -f

echo.
echo 🔨 Building all services from scratch...
docker-compose -f docker-compose.full.yml build --no-cache

if %errorlevel% neq 0 (
    echo ❌ Build failed! Check the logs above.
    pause
    exit /b 1
)

echo.
echo 🚀 Starting all services...
docker-compose -f docker-compose.full.yml up -d

if %errorlevel% neq 0 (
    echo ❌ Failed to start services! Check the logs above.
    pause
    exit /b 1
)

echo.
echo ⏳ Waiting for services to initialize...
timeout /t 30 /nobreak >nul

echo.
echo 📊 Checking service status...
docker-compose -f docker-compose.full.yml ps

echo.
echo 🧪 Testing the containerized system...
node test-simple.js

echo.
echo ========================================
echo ✅ Full Docker Containerization Complete!
echo ========================================
echo.
echo 🌐 Service URLs:
echo - Frontend:    http://localhost:5173
echo - Backend:     http://localhost:5000/health
echo - Rebalancer:  http://localhost:5001/api/health
echo - MongoDB:     localhost:27017
echo.
echo 📋 Docker Commands:
echo - View logs:   docker-compose -f docker-compose.full.yml logs
echo - Stop all:    docker-compose -f docker-compose.full.yml down
echo - Restart:     docker-compose -f docker-compose.full.yml restart
echo.
pause