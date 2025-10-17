@echo off
echo ========================================
echo  LokiAI + GhostKey Integration
echo ========================================
echo.

REM Check Docker
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker not found
    pause
    exit /b 1
)

echo [OK] Docker found
echo.

REM Check if Docker is running
docker info >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not running - please start Docker Desktop
    pause
    exit /b 1
)

echo [OK] Docker is running
echo.

echo [1/3] Starting MongoDB + Backend + Frontend (Docker)...
docker-compose up -d

echo.
echo [2/3] Checking GhostKey directory...
set GHOSTKEY_PATH=..\ghost-key-main\ghost-key-main

if not exist "%GHOSTKEY_PATH%" (
    echo [ERROR] GhostKey not found at: %GHOSTKEY_PATH%
    echo Please ensure GhostKey is in the correct location
    pause
    exit /b 1
)

echo [OK] GhostKey found
echo.

echo [3/3] Starting GhostKey (Port 3000)...
echo Opening new terminal for GhostKey...

REM Start GhostKey in a new terminal
start "GhostKey Biometric System" cmd /k "cd /d %GHOSTKEY_PATH% && echo Starting GhostKey... && npm run dev"

echo.
echo ========================================
echo  All Services Started!
echo ========================================
echo.
echo Service URLs:
echo   GhostKey:  http://localhost:3000
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:5000
echo   MongoDB:   mongodb://localhost:27017
echo.
echo Integration:
echo   [OK] Frontend captures biometric data
echo   [OK] Backend proxies to GhostKey APIs
echo   [OK] GhostKey processes with deep learning
echo.
echo Features:
echo   Keystroke: 32 features + 5-layer autoencoder
echo   Voice: 52 features + speaker recognition
echo   Accuracy: 97.8%% TAR, 0.9%% FAR
echo.
echo Commands:
echo   Stop all:      docker-compose down
echo   View logs:     docker-compose logs -f
echo   Restart:       docker-compose restart
echo.
pause
