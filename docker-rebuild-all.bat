@echo off
echo ========================================
echo 🐳 LokiAI Complete Docker Rebuild
echo ========================================
echo.
echo This will:
echo 1. Stop all running containers
echo 2. Remove old images and containers
echo 3. Rebuild all services from scratch
echo 4. Start the complete production system
echo.

REM Check if Docker is running
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not running
    echo Please install Docker Desktop and try again
    pause
    exit /b 1
)

echo ✅ Docker is running
echo.

REM Stop all containers
echo 🛑 Stopping all containers...
docker stop $(docker ps -aq) 2>nul
docker-compose -f docker-compose.simple.yml down 2>nul
docker-compose -f docker-compose.production-agents.yml down 2>nul

REM Remove all containers
echo 🗑️ Removing old containers...
docker rm $(docker ps -aq) 2>nul

REM Remove all images (force clean rebuild)
echo 🧹 Removing old images...
docker rmi $(docker images -q) -f 2>nul

REM Clean Docker system
echo 🧽 Cleaning Docker system...
docker system prune -af --volumes

REM Build all services from scratch
echo 🔨 Building all services from scratch...
docker-compose -f docker-compose.simple.yml build --no-cache --parallel

REM Start all services
echo 🚀 Starting all production services...
docker-compose -f docker-compose.simple.yml up -d

REM Wait for services to initialize
echo ⏳ Waiting for services to initialize...
timeout /t 30 /nobreak >nul

REM Check service status
echo 📊 Checking service status...
docker-compose -f docker-compose.simple.yml ps

echo.
echo ========================================
echo ✅ Docker Rebuild Complete!
echo ========================================
echo.
echo 🔧 Backend API: http://localhost:5000
echo 🔄 Rebalancer API: http://localhost:5001
echo 📊 MongoDB: localhost:27017
echo.
echo 🌐 Starting frontend...
cd LokiAi
start cmd /k "npm run dev"

echo.
echo 🎯 Frontend will open at: http://localhost:5173
echo 🎯 Test backend: node ../test-backend-connection.js
echo.
pause