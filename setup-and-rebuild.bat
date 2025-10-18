@echo off
echo ========================================
echo 🚀 LokiAI Setup ^& Docker Rebuild
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "docker-compose.simple.yml" (
    echo ❌ Error: docker-compose.simple.yml not found
    echo Please run this script from the root directory
    pause
    exit /b 1
)

echo ✅ Found docker-compose.simple.yml - in correct directory
echo.

REM Step 1: Install dependencies
echo 📦 Installing Node.js dependencies...
if exist "package.json" (
    npm install
    if %errorlevel% equ 0 (
        echo ✅ Dependencies installed successfully
    ) else (
        echo ⚠️ Some dependency issues, but continuing...
    )
) else (
    echo ⚠️ No package.json found, skipping npm install
)

echo.

REM Step 2: Test basic connectivity
echo 🧪 Running basic connectivity test...
node test-simple.js

echo.

REM Step 3: Check Docker
echo 🐳 Checking Docker status...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)

echo ✅ Docker is running
echo.

REM Step 4: Docker rebuild
echo 🔨 Starting Docker rebuild...
echo This will:
echo 1. Stop existing containers
echo 2. Remove old images
echo 3. Rebuild all services
echo 4. Start production system
echo.

set /p confirm="Continue with Docker rebuild? (y/N): "
if /i "%confirm%"=="y" (
    
    REM Stop containers
    echo 🛑 Stopping containers...
    docker-compose -f docker-compose.simple.yml down 2>nul
    
    REM Clean system
    echo 🧹 Cleaning Docker system...
    docker system prune -f 2>nul
    
    REM Build services
    echo 🔨 Building services...
    docker-compose -f docker-compose.simple.yml build --no-cache
    
    if %errorlevel% equ 0 (
        REM Start services
        echo 🚀 Starting services...
        docker-compose -f docker-compose.simple.yml up -d
        
        if %errorlevel% equ 0 (
            echo.
            echo ⏳ Waiting for services to initialize...
            timeout /t 20 /nobreak >nul
            
            REM Check status
            echo 📊 Checking service status...
            docker-compose -f docker-compose.simple.yml ps
            
            echo.
            echo ========================================
            echo ✅ Docker Rebuild Complete!
            echo ========================================
            echo.
            
            REM Test again
            echo 🧪 Testing rebuilt system...
            node test-simple.js
            
            echo.
            echo 🌐 Service URLs:
            echo - Backend: http://localhost:5000/health
            echo - Rebalancer: http://localhost:5001/api/health
            echo - Frontend: Starting...
            
            REM Start frontend
            echo.
            echo 🌐 Starting frontend...
            cd LokiAi
            start cmd /k "npm run dev"
            cd ..
            
            echo.
            echo 🎯 Frontend will open at: http://localhost:5173
            echo 🎯 Full test: npm run test
            
        ) else (
            echo ❌ Failed to start services
        )
    ) else (
        echo ❌ Failed to build services
    )
    
) else (
    echo ⏭️ Skipping Docker rebuild
)

echo.
pause