@echo off
echo 🐳 Starting LokiAI Agents System with Docker
echo ==========================================

echo.
echo 📋 Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not running
    echo Please install Docker Desktop from https://docker.com/
    pause
    exit /b 1
)

echo ✅ Docker is available

echo.
echo 🛑 Stopping any existing containers...
docker-compose -f docker-compose.agents.yml down

echo.
echo 🏗️ Building and starting LokiAI Agents system...
docker-compose -f docker-compose.agents.yml up --build -d

echo.
echo ⏳ Waiting for services to start...
timeout /t 30 /nobreak >nul

echo.
echo 🧪 Testing system health...
timeout /t 5 /nobreak >nul

echo.
echo 🎉 LokiAI Agents System Started with Docker!
echo.
echo 📍 Access Points:
echo    Frontend:     http://localhost:5175
echo    Backend API:  http://localhost:5001
echo    MongoDB:      localhost:27017
echo    Biometrics:   http://localhost:25000
echo.
echo 🐳 Docker Services:
docker-compose -f docker-compose.agents.yml ps

echo.
echo 📊 To view logs:
echo    docker-compose -f docker-compose.agents.yml logs -f
echo.
echo 🛑 To stop system:
echo    docker-compose -f docker-compose.agents.yml down
echo.
echo Press any key to open the application...
pause >nul
start http://localhost:5175