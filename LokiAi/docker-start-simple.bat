@echo off
echo 🐳 Starting LokiAI Agents with Docker
echo ===================================

echo.
echo 📋 Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or running
    echo Please install Docker Desktop and make sure it's running
    pause
    exit /b 1
)

echo ✅ Docker is available

echo.
echo 🛑 Stopping existing containers...
docker-compose -f docker-compose.agents.yml down

echo.
echo 🏗️ Building and starting services...
docker-compose -f docker-compose.agents.yml up --build -d

if %errorlevel% neq 0 (
    echo ❌ Failed to start Docker services
    echo Check the logs above for errors
    pause
    exit /b 1
)

echo.
echo ⏳ Waiting for services to start...
timeout /t 20 /nobreak >nul

echo.
echo 🧪 Testing system...
timeout /t 5 /nobreak >nul

echo.
echo 🎉 LokiAI Agents Started Successfully!
echo.
echo 📍 Access Points:
echo    Frontend:     http://localhost:5175
echo    Backend API:  http://localhost:5001
echo    Health Check: http://localhost:5001/health
echo.
echo 🐳 Container Status:
docker-compose -f docker-compose.agents.yml ps

echo.
echo 📊 Useful Commands:
echo    View logs:    docker-compose -f docker-compose.agents.yml logs -f
echo    Stop system:  docker-compose -f docker-compose.agents.yml down
echo    Restart:      docker-compose -f docker-compose.agents.yml restart
echo.
echo Press any key to open the application...
pause >nul
start http://localhost:5175

echo.
echo System is running! Use Ctrl+C to exit this window.
pause