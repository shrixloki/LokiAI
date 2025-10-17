@echo off
echo ========================================
echo LokiAI Docker Logs
echo ========================================
echo.

cd /d "%~dp0"

echo Press Ctrl+C to stop viewing logs
echo.
timeout /t 2 /nobreak >nul

docker-compose logs -f
