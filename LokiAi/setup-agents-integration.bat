@echo off
echo ========================================
echo AI Agents Live Integration Setup
echo ========================================
echo.

set WALLET_ADDRESS=%1
if "%WALLET_ADDRESS%"=="" set WALLET_ADDRESS=0x8bbfa86f2766fd05220f319a4d122c97fbc4b529

echo Step 1: Seeding MongoDB with agent data...
echo Wallet: %WALLET_ADDRESS%
echo.
node seed-docker-mongodb.js %WALLET_ADDRESS%

echo.
echo ========================================
echo Step 2: Testing API endpoint...
echo ========================================
echo.
node test-agents-api.js %WALLET_ADDRESS%

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Start backend: node backend-server.js
echo 2. Start frontend: npm run dev
echo 3. Connect MetaMask with wallet: %WALLET_ADDRESS%
echo 4. Navigate to AI Agents page
echo.
echo API Endpoint: http://localhost:5000/api/agents/status?wallet=%WALLET_ADDRESS%
echo.
pause
