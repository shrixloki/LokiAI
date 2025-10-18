@echo off
echo ========================================
echo 🚀 LokiAI Simple Production Start
echo ========================================
echo.
echo Starting Essential Services:
echo 1. Backend with 4 Production Agents
echo 2. MongoDB Database  
echo 3. Rebalancer API
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

REM Stop any existing containers
echo 🛑 Stopping existing containers...
docker-compose -f docker-compose.simple.yml down

REM Build and start essential services
echo 🔨 Building essential services...
docker-compose -f docker-compose.simple.yml build

echo 🚀 Starting production agents...
docker-compose -f docker-compose.simple.yml up -d

REM Wait for services to start
echo ⏳ Waiting for services to initialize...
timeout /t 20 /nobreak >nul

REM Check service status
echo 📊 Checking service status...
docker-compose -f docker-compose.simple.yml ps

echo.
echo ========================================
echo ✅ Essential Services Started!
echo ========================================
echo.
echo 🔧 Backend API: http://localhost:5000
echo 🔄 Rebalancer API: http://localhost:5001
echo 📊 MongoDB: localhost:27017
echo.
echo 🎯 Test the API: http://localhost:5000/health
echo.

REM Start frontend development server
echo 🌐 Starting frontend development server...
cd LokiAi
start cmd /k "npm run dev"

echo.
echo 🎯 Frontend will open at: http://localhost:5173
echo.
pause