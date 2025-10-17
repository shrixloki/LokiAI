@echo off
echo 🐳 Starting LokiAI Agents - Hybrid Mode
echo ======================================
echo Backend + Database in Docker, Frontend locally
echo.

echo 📋 Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or running
    pause
    exit /b 1
)

echo ✅ Docker is available

echo.
echo 🛑 Stopping existing containers...
docker-compose -f docker-compose.simple.yml down

echo.
echo 🏗️ Starting backend services in Docker...
docker-compose -f docker-compose.simple.yml up --build -d

if %errorlevel% neq 0 (
    echo ❌ Failed to start Docker services
    pause
    exit /b 1
)

echo.
echo ⏳ Waiting for backend to start...
timeout /t 15 /nobreak >nul

echo.
echo 🧪 Testing backend health...
timeout /t 5 /nobreak >nul

echo.
echo 🌐 Starting frontend locally...
start "LokiAI Frontend" cmd /k "npm run dev"

echo.
echo ⏳ Waiting for frontend to start...
timeout /t 10 /nobreak >nul

echo.
echo 🎉 LokiAI Agents Started in Hybrid Mode!
echo.
echo 📍 Access Points:
echo    Frontend:     http://localhost:5175 (Local)
echo    Backend API:  http://localhost:5001 (Docker)
echo    MongoDB:      localhost:27017 (Docker)
echo    Redis:        localhost:6379 (Docker)
echo.
echo 🐳 Docker Services:
docker-compose -f docker-compose.simple.yml ps

echo.
echo 📊 Commands:
echo    View backend logs: docker-compose -f docker-compose.simple.yml logs -f
echo    Stop Docker:       docker-compose -f docker-compose.simple.yml down
echo.
echo Press any key to open the application...
pause >nul
start http://localhost:5175

echo.
echo 🔄 System is running in hybrid mode.
echo Frontend runs locally, backend in Docker.
pause