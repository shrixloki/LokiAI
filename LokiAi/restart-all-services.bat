@echo off
echo ========================================
echo Restarting ALL LokiAI Services
echo ========================================
echo.

REM Kill existing processes
echo [1/3] Stopping existing services...
echo.

REM Kill backend (port 5000)
echo Stopping backend server (port 5000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    taskkill /F /PID %%a 2>nul
)

REM Kill GhostKey (port 25000)
echo Stopping GhostKey (port 25000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :25000') do (
    taskkill /F /PID %%a 2>nul
)

REM Kill frontend (port 5174)
echo Stopping frontend (port 5174)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5174') do (
    taskkill /F /PID %%a 2>nul
)

timeout /t 3 /nobreak >nul

echo.
echo [2/3] Starting services...
echo.

REM Start backend
echo Starting backend server...
start "LokiAI Backend" cmd /k "cd /d %~dp0 && node backend-server.js"
timeout /t 2 /nobreak >nul

REM Start GhostKey (if exists)
if exist "..\GhostKey\app.py" (
    echo Starting GhostKey...
    start "GhostKey" cmd /k "cd /d %~dp0\..\GhostKey && python app.py"
    timeout /t 2 /nobreak >nul
) else (
    echo WARNING: GhostKey not found at ..\GhostKey\app.py
    echo Keystroke authentication will not work!
)

REM Start frontend
echo Starting frontend...
start "LokiAI Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo [3/3] Verifying services...
timeout /t 5 /nobreak >nul

echo.
echo Checking backend...
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is running on http://localhost:5000
) else (
    echo ❌ Backend is NOT responding
)

echo.
echo Checking GhostKey...
curl -s http://127.0.0.1:25000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ GhostKey is running on http://127.0.0.1:25000
) else (
    echo ❌ GhostKey is NOT responding
)

echo.
echo ========================================
echo Services Restarted!
echo ========================================
echo.
echo Check the opened windows for logs:
echo - LokiAI Backend: Backend server logs
echo - GhostKey: GhostKey service logs
echo - LokiAI Frontend: Vite dev server
echo.
echo Open your browser to: http://localhost:5174
echo.
pause
