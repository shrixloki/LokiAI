@echo off
echo 🐳 Starting LokiAI with Docker Database
echo ======================================

echo.
echo 🛑 Stopping existing containers...
docker-compose -f docker-compose.minimal.yml down

echo.
echo 🏗️ Starting database services...
docker-compose -f docker-compose.minimal.yml up -d

echo.
echo ⏳ Waiting for database...
timeout /t 10 /nobreak >nul

echo.
echo 🖥️ Starting backend locally...
start "LokiAI Backend" cmd /k "node backend-agents-server.js"

echo.
echo ⏳ Waiting for backend...
timeout /t 8 /nobreak >nul

echo.
echo 🌐 Starting frontend locally...
start "LokiAI Frontend" cmd /k "npm run dev"

echo.
echo ⏳ Waiting for frontend...
timeout /t 10 /nobreak >nul

echo.
echo 🎉 LokiAI Agents Started Successfully!
echo.
echo 📍 Services:
echo    Frontend:     http://localhost:5175 (Local)
echo    Backend:      http://localhost:5001 (Local)
echo    MongoDB:      localhost:27017 (Docker)
echo    Redis:        localhost:6379 (Docker)
echo.
echo 🐳 Docker Services:
docker-compose -f docker-compose.minimal.yml ps

echo.
echo Press any key to open the application...
pause >nul
start http://localhost:5175

echo.
echo ✅ System is running!
echo Database in Docker, Backend and Frontend locally.
pause