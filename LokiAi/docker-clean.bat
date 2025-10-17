@echo off
echo ========================================
echo Clean LokiAI Docker Environment
echo ========================================
echo.
echo WARNING: This will remove all containers, volumes, and data!
echo.
set /p confirm="Are you sure? (yes/no): "

if /i not "%confirm%"=="yes" (
    echo Cancelled.
    pause
    exit /b 0
)

cd /d "%~dp0"

echo.
echo [1/3] Stopping and removing containers...
docker-compose down -v

echo.
echo [2/3] Removing images...
docker-compose down --rmi all

echo.
echo [3/3] Cleaning up Docker system...
docker system prune -f

echo.
echo ========================================
echo Cleanup complete!
echo ========================================
echo.
echo To start fresh: docker-start.bat
echo.
pause
