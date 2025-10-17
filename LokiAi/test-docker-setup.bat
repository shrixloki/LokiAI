@echo off
echo 🧪 Testing Docker Setup for LokiAI Agents
echo ==========================================

echo.
echo 📋 Checking Docker...
docker --version
if %errorlevel% neq 0 (
    echo ❌ Docker is not available
    exit /b 1
)

echo.
echo 📋 Checking Docker Compose...
docker-compose --version
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not available
    exit /b 1
)

echo.
echo 📋 Validating Docker Compose file...
docker-compose -f docker-compose.agents.yml config --quiet
if %errorlevel% neq 0 (
    echo ❌ Docker Compose file is invalid
    exit /b 1
)

echo ✅ Docker Compose file is valid

echo.
echo 📋 Checking required files...
if not exist "Dockerfile.agents-backend" (
    echo ❌ Missing Dockerfile.agents-backend
    exit /b 1
)
echo ✅ Backend Dockerfile found

if not exist "Dockerfile.agents-frontend" (
    echo ❌ Missing Dockerfile.agents-frontend
    exit /b 1
)
echo ✅ Frontend Dockerfile found

if not exist "backend-agents-server.js" (
    echo ❌ Missing backend-agents-server.js
    exit /b 1
)
echo ✅ Backend server file found

echo.
echo 🎉 Docker setup is ready!
echo.
echo 🚀 To start the system:
echo    docker-start-simple.bat
echo.
echo 🐳 Or manually:
echo    docker-compose -f docker-compose.agents.yml up --build -d
echo.
pause