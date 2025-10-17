@echo off
echo ========================================
echo Restarting LokiAI Docker Services
echo ========================================
echo.

cd /d "%~dp0"

echo Restarting all services...
docker-compose restart

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
echo Services restarted!
echo ========================================
echo.
pause
