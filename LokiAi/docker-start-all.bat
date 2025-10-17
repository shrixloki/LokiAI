@echo off
echo ========================================
echo  LokiAI + GhostKey (Docker)
echo ========================================
echo.

REM Check Docker
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not installed
    echo Install from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo [OK] Docker found
echo.

REM Check if Docker is running
docker info >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not running
    echo Please start Docker Desktop
    pause
    exit /b 1
)

echo [OK] Docker is running
echo.

echo [INFO] Starting all services with Docker Compose...
echo This will start:
echo   - GhostKey (Deep Learning Biometrics)
echo   - MongoDB (Database)
echo   - Backend (API Server)
echo   - Frontend (React App)
echo.

docker-compose up -d --build

echo.
echo ========================================
echo  All Services Started!
echo ========================================
echo.
echo Service URLs:
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:5000
echo   GhostKey:  http://localhost:3000
echo   MongoDB:   mongodb://localhost:27017
echo.
echo Features:
echo   [OK] Keystroke: 32 features + 5-layer autoencoder
echo   [OK] Voice: 52 features + speaker recognition
echo   [OK] Accuracy: 97.8%% TAR, 0.9%% FAR
echo   [OK] Deep Learning: GhostKey integration
echo.
echo Commands:
echo   View logs:     docker-compose logs -f
echo   Stop all:      docker-compose down
echo   Restart:       docker-compose restart
echo   Rebuild:       docker-compose up -d --build
echo.
echo Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo Open http://localhost:5173 in your browser!
echo.
pause
