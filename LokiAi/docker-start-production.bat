@echo off
echo ========================================
echo   LokiAI Production Deployment
echo ========================================
echo.

echo [1/5] Stopping existing containers...
docker-compose -f docker-compose.prod.yml down

echo.
echo [2/5] Cleaning up old images...
docker system prune -f

echo.
echo [3/5] Building production images...
docker-compose -f docker-compose.prod.yml build --no-cache

echo.
echo [4/5] Starting all services...
docker-compose -f docker-compose.prod.yml up -d

echo.
echo [5/5] Waiting for services to be healthy...
timeout /t 10 /nobreak > nul

echo.
echo ========================================
echo   Service Status
echo ========================================
docker-compose -f docker-compose.prod.yml ps

echo.
echo ========================================
echo   Access Points
echo ========================================
echo Frontend:          http://localhost
echo Backend API:       http://localhost/api/health
echo Biometrics:        http://localhost/biometrics/health
echo MongoDB:           mongodb://localhost:27017
echo.
echo ========================================
echo   Logs
echo ========================================
echo View logs: docker-compose -f docker-compose.prod.yml logs -f
echo.

pause
