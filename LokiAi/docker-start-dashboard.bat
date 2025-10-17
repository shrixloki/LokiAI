@echo off
echo ========================================
echo  LokiAI Dashboard - Docker Startup
echo  With Live Data Integration
echo ========================================
echo.

echo [1/5] Stopping any existing containers...
docker-compose -f docker-compose.yml down
echo.

echo [2/5] Building Docker images...
docker-compose -f docker-compose.yml build
echo.

echo [3/5] Starting all services...
docker-compose -f docker-compose.yml up -d
echo.

echo [4/5] Waiting for services to be ready...
timeout /t 10 /nobreak >nul
echo.

echo [5/5] Checking service status...
docker-compose -f docker-compose.yml ps
echo.

echo ========================================
echo  Services Started Successfully!
echo ========================================
echo.
echo  Frontend:  http://localhost:5173
echo  Backend:   http://localhost:5000
echo  GhostKey:  http://localhost:25000
echo  MongoDB:   mongodb://localhost:27017
echo.
echo  Dashboard API: http://localhost:5000/api/dashboard/summary
echo.
echo ========================================
echo  Next Steps:
echo ========================================
echo  1. Open http://localhost:5173
echo  2. Connect MetaMask (Sepolia testnet)
echo  3. Navigate to Dashboard
echo  4. See your real portfolio value!
echo.
echo  To view logs: docker-compose -f docker-compose.yml logs -f
echo  To stop: docker-compose -f docker-compose.yml down
echo.
pause
