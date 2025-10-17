@echo off
echo 🐳 Starting LokiAI Backend in Docker
echo ==================================

echo.
echo 🛑 Stopping existing containers...
docker-compose -f docker-compose.simple.yml down

echo.
echo 🏗️ Starting backend services...
docker-compose -f docker-compose.simple.yml up -d

echo.
echo ⏳ Waiting for services...
timeout /t 10 /nobreak >nul

echo.
echo ✅ Backend services started!
echo.
echo 📍 Services:
echo    Backend API:  http://localhost:5001
echo    MongoDB:      localhost:27017
echo    Redis:        localhost:6379
echo.
echo 🐳 Container Status:
docker-compose -f docker-compose.simple.yml ps

echo.
echo 🧪 Testing backend...
curl -s http://localhost:5001/health

echo.
echo ✅ Backend is ready! Now start frontend locally:
echo    npm run dev
echo.
pause