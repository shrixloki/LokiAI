@echo off
cls
echo ============================================
echo RESTARTING BACKEND SERVER
echo ============================================
echo.

echo [Step 1] Killing all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo Done!

echo.
echo [Step 2] Starting backend server...
echo.
echo Backend will start in a new window.
echo Watch for: "Server running on: http://0.0.0.0:5000"
echo.

start "LokiAI Backend - DO NOT CLOSE" cmd /k "cd /d %~dp0 && echo Starting backend server... && node backend-server.js"

timeout /t 3 /nobreak >nul

echo.
echo ============================================
echo Backend server is starting!
echo ============================================
echo.
echo Check the new window for server logs.
echo Wait for "MongoDB connected" message.
echo.
echo Then refresh your browser and try reset again.
echo.
pause
