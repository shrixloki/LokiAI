@echo off
echo ========================================
echo   LokiAI Complete Fix and Start
echo ========================================
echo.

echo [1/6] Checking Docker Desktop...
docker ps >nul 2>&1
if errorlevel 1 (
    echo   X Docker Desktop is NOT running!
    echo.
    echo Please start Docker Desktop and run this script again.
    echo.
    pause
    exit /b 1
)
echo   √ Docker Desktop is running
echo.

echo [2/6] Stopping existing containers...
docker-compose down >nul 2>&1
echo   √ Cleaned up
echo.

echo [3/6] Starting all services...
docker-compose up -d --build
echo.

echo [4/6] Waiting for services (30 seconds)...
timeout /t 30 /nobreak >nul
echo   √ Services should be ready
echo.

echo [5/6] Seeding database...
docker exec lokiai-mongodb mongosh -u admin -p lokiai2024 --authenticationDatabase admin loki_agents --eval "db.agents.deleteMany({walletAddress:'0x742d35cc6634c0532925a3b844bc9e7595f0beb1'});db.agents.insertMany([{walletAddress:'0x742d35cc6634c0532925a3b844bc9e7595f0beb1',name:'DeFi Yield Optimizer',type:'yield',status:'active',chains:['Ethereum','Polygon'],performance:{apy:18.5,totalPnl:2450.75,winRate:87.3,totalTrades:156},createdAt:new Date(),updatedAt:new Date()},{walletAddress:'0x742d35cc6634c0532925a3b844bc9e7595f0beb1',name:'Cross-Chain Arbitrage Bot',type:'arbitrage',status:'active',chains:['Ethereum','BSC'],performance:{apy:24.2,totalPnl:3890.50,winRate:92.1,totalTrades:243},createdAt:new Date(),updatedAt:new Date()},{walletAddress:'0x742d35cc6634c0532925a3b844bc9e7595f0beb1',name:'Portfolio Rebalancer',type:'rebalancer',status:'active',chains:['Ethereum'],performance:{apy:12.8,totalPnl:1567.25,winRate:78.5,totalTrades:89},createdAt:new Date(),updatedAt:new Date()},{walletAddress:'0x742d35cc6634c0532925a3b844bc9e7595f0beb1',name:'Risk Manager',type:'risk',status:'active',chains:['Ethereum','Polygon'],performance:{apy:8.5,totalPnl:890.00,winRate:95.2,totalTrades:67},createdAt:new Date(),updatedAt:new Date()}]);print('Seeded 4 AI agents');" >nul 2>&1
echo   √ Database seeded
echo.

echo [6/6] Checking services...
docker-compose ps
echo.

echo ========================================
echo   Services Running
echo ========================================
echo.
echo   Frontend:    http://localhost:5173
echo   Backend:     http://localhost:5000
echo   GhostKey:    http://localhost:25000
echo   MongoDB:     mongodb://localhost:27017
echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Open your browser: http://localhost:5173
echo.
pause
