# 🚀 LokiAI Blockchain System - Docker Setup Guide

## 🎯 One-Command Startup

Run the entire LokiAI blockchain-integrated system with a single command:

### Windows (Command Prompt)
```bash
start-blockchain-system.bat
```

### Windows (PowerShell)
```powershell
.\start-blockchain-system.ps1
```

### Linux/Mac
```bash
chmod +x start-blockchain-system.sh
./start-blockchain-system.sh
```

## 📋 What Gets Started

The Docker setup launches a complete production-ready system:

### 🗄️ **Database Layer**
- **MongoDB**: Primary database for agents, transactions, and user data
- **Redis**: Caching layer for improved performance

### 🔧 **Backend Services**
- **Blockchain-Integrated Backend**: Node.js server with full blockchain connectivity
- **Multi-chain Support**: Ethereum, Polygon, BSC, Arbitrum
- **AI Agents**: Yield Optimizer, Arbitrage Bot, Risk Manager, Portfolio Rebalancer
- **Real-time APIs**: REST endpoints and WebSocket connections

### 🌐 **Frontend**
- **React Dashboard**: Complete trading interface
- **Real-time Updates**: Live portfolio and trading data
- **Blockchain Integration**: MetaMask wallet connection

### 🔀 **Load Balancer**
- **Nginx**: Reverse proxy with SSL support
- **Rate Limiting**: API protection and security
- **Static Asset Caching**: Optimized performance

## 🔧 Configuration

### 1. Environment Setup

The system automatically creates a `.env` file from the template. Configure these key settings:

```bash
# Blockchain RPC URLs (REQUIRED)
ETHEREUM_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.alchemyapi.io/v2/YOUR_KEY
BSC_RPC_URL=https://your-quicknode-bsc-endpoint.com
ARBITRUM_RPC_URL=https://arb-mainnet.alchemyapi.io/v2/YOUR_KEY

# Server Wallet Private Keys (REQUIRED for automation)
ETHEREUM_PRIVATE_KEY=0x...
POLYGON_PRIVATE_KEY=0x...
BSC_PRIVATE_KEY=0x...
ARBITRUM_PRIVATE_KEY=0x...

# API Keys
ALCHEMY_API_KEY=your_alchemy_key
QUICKNODE_API_KEY=your_quicknode_key

# Security
WALLET_ENCRYPTION_KEY=your_32_character_encryption_key
```

### 2. Service Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend API | 5000 | http://localhost:5000 |
| MongoDB | 27017 | localhost:27017 |
| Redis | 6379 | localhost:6379 |
| Nginx | 80/443 | http://localhost |

### 3. Health Monitoring

Check system health at: http://localhost:5000/health

## 🛠️ Docker Commands

### Start System
```bash
docker-compose -f docker-compose.blockchain.yml up -d
```

### Stop System
```bash
docker-compose -f docker-compose.blockchain.yml down
```

### View Logs
```bash
docker-compose -f docker-compose.blockchain.yml logs -f
```

### Check Status
```bash
docker-compose -f docker-compose.blockchain.yml ps
```

### Restart Services
```bash
docker-compose -f docker-compose.blockchain.yml restart
```

### Rebuild and Start
```bash
docker-compose -f docker-compose.blockchain.yml up --build -d
```

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Nginx (Port 80/443)                     │
│                  Load Balancer & SSL                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼────────┐         ┌────────▼────────┐
│   Frontend     │         │    Backend      │
│  (Port 3000)   │         │   (Port 5000)   │
│                │         │                 │
│ • React App    │         │ • Express API   │
│ • Trading UI   │         │ • Socket.IO     │
│ • MetaMask     │         │ • Blockchain    │
│ • Real-time    │         │ • AI Agents     │
└────────────────┘         └─────────┬───────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
            ┌───────▼────────┐                ┌──────▼──────┐
            │   MongoDB      │                │    Redis    │
            │  (Port 27017)  │                │ (Port 6379) │
            │                │                │             │
            │ • User Data    │                │ • Caching   │
            │ • Transactions │                │ • Sessions  │
            │ • Agent Logs   │                │ • Real-time │
            └────────────────┘                └─────────────┘
```

## 🔐 Security Features

### Implemented Security
- **Encrypted Private Keys**: Wallet data encryption
- **Rate Limiting**: API protection via Nginx
- **CORS Configuration**: Secure cross-origin requests
- **Health Checks**: Service monitoring and auto-restart
- **Audit Logging**: Complete transaction trails

### Production Security Checklist
- [ ] Configure real RPC URLs (not demo endpoints)
- [ ] Use secure private keys with minimal funds for testing
- [ ] Enable SSL certificates for HTTPS
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerting
- [ ] Regular security updates

## 🚀 Performance Optimizations

### Built-in Optimizations
- **Connection Pooling**: Efficient blockchain connections
- **Redis Caching**: Fast data retrieval
- **Nginx Compression**: Reduced bandwidth usage
- **Static Asset Caching**: Improved load times
- **Health Checks**: Automatic service recovery

### Scaling Options
- **Horizontal Scaling**: Add more backend instances
- **Database Sharding**: MongoDB cluster setup
- **CDN Integration**: Global asset distribution
- **Load Balancing**: Multiple server deployment

## 📈 Monitoring & Logs

### Log Locations
```bash
# View all service logs
docker-compose -f docker-compose.blockchain.yml logs

# Specific service logs
docker-compose -f docker-compose.blockchain.yml logs backend
docker-compose -f docker-compose.blockchain.yml logs mongodb
docker-compose -f docker-compose.blockchain.yml logs redis
```

### Health Endpoints
- **System Health**: http://localhost:5000/health
- **Blockchain Status**: http://localhost:5000/api/blockchain/status
- **Agent Status**: http://localhost:5000/api/agents/status

## 🔧 Troubleshooting

### Common Issues

#### 1. Docker Not Running
```bash
# Windows
# Start Docker Desktop application

# Linux
sudo systemctl start docker
```

#### 2. Port Conflicts
```bash
# Check what's using ports
netstat -tulpn | grep :5000
netstat -tulpn | grep :3000

# Kill processes if needed
sudo kill -9 <PID>
```

#### 3. Environment Variables
```bash
# Verify .env file exists and has correct values
cat .env

# Check if variables are loaded in container
docker-compose -f docker-compose.blockchain.yml exec backend env | grep ETHEREUM
```

#### 4. Service Health
```bash
# Check individual service health
docker-compose -f docker-compose.blockchain.yml exec backend curl http://localhost:5000/health
docker-compose -f docker-compose.blockchain.yml exec mongodb mongosh --eval "db.adminCommand('ping')"
docker-compose -f docker-compose.blockchain.yml exec redis redis-cli ping
```

### Reset System
```bash
# Complete reset (removes all data)
docker-compose -f docker-compose.blockchain.yml down -v
docker system prune -f
docker-compose -f docker-compose.blockchain.yml up --build -d
```

## 🎯 Next Steps

### 1. Initial Setup
1. Run the startup script
2. Configure `.env` with your API keys
3. Access the dashboard at http://localhost:3000
4. Connect your MetaMask wallet

### 2. Testing
1. Use testnet configuration initially
2. Test with small amounts
3. Monitor logs for any issues
4. Verify blockchain connections

### 3. Production Deployment
1. Configure production RPC URLs
2. Set up SSL certificates
3. Configure monitoring and alerting
4. Implement backup strategies
5. Set up CI/CD pipeline

---

## 🎉 Success!

Your LokiAI blockchain-integrated trading system is now running with:

- ✅ **Real Blockchain Connectivity**: Live market data and transactions
- ✅ **AI Trading Agents**: Automated yield optimization and arbitrage
- ✅ **Production Infrastructure**: Scalable, secure, and monitored
- ✅ **One-Command Deployment**: Complete system startup
- ✅ **Enterprise Features**: Logging, monitoring, and health checks

The system is ready for live trading operations across multiple blockchain networks!