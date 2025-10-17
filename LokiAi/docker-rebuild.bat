@echo off
echo ========================================
echo Rebuilding LokiAI Docker Images
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Stopping services...
docker-compose down

echo.
echo [2/3] Rebuilding images (this may take a few minutes)...
docker-compose build --no-cache

echo.
echo [3/3] Starting services...
docker-compose up -d

echo.
echo Waiting for services to be ready...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo Services Status
echo ========================================
docker-compose ps

echo.
echo ========================================
echo Rebuild complete!
echo ========================================
echo.
pause
