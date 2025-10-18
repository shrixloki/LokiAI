@echo off
echo ========================================
echo 🐳 Docker Rebuild - Simple Commands
echo ========================================
echo.

REM Test basic connectivity first
echo 🧪 Testing current system...
node test-simple.js

echo.
echo ========================================
echo 🔨 Docker Rebuild Process
echo ========================================
echo.

REM Stop containers
echo 🛑 Stopping containers...
docker-compose -f docker-compose.simple.yml down

REM Clean system
echo 🧹 Cleaning Docker system...
docker system prune -f

REM Build services
echo 🔨 Building services...
docker-compose -f docker-compose.simple.yml build --no-cache

REM Start services
echo 🚀 Starting services...
docker-compose -f docker-compose.simple.yml up -d

REM Wait for initialization
echo ⏳ Waiting for services...
timeout /t 20 /nobreak >nul

REM Check status
echo 📊 Service status:
docker-compose -f docker-compose.simple.yml ps

echo.
echo ========================================
echo ✅ Docker Rebuild Complete!
echo ========================================
echo.

REM Test rebuilt system
echo 🧪 Testing rebuilt system...
node test-simple.js

echo.
echo 🌐 Service URLs:
echo - Backend: http://localhost:5000/health
echo - Rebalancer: http://localhost:5001/api/health
echo.

REM Start frontend
echo 🌐 Starting frontend...
cd LokiAi
start cmd /k "npm run dev"
cd ..

echo.
echo 🎯 Frontend will open at: http://localhost:5173
echo 🎯 Full test: node test-complete-system.js
echo.
pause