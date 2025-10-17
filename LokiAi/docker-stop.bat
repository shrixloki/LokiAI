@echo off
echo ========================================
echo Stopping LokiAI Docker Services
echo ========================================
echo.

cd /d "%~dp0"

echo Stopping all services...
docker-compose down

echo.
echo ========================================
echo All services stopped!
echo ========================================
echo.
echo To start again: docker-start.bat
echo To remove volumes: docker-compose down -v
echo.
pause
