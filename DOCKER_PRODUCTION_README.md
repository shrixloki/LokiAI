# 🐳 LokiAI Production Blockchain System - Docker Deployment

## 🚀 One-Command Deployment

Run the entire LokiAI production blockchain system with a single command!

### Quick Start

```bash
# Windows
./docker-start-production-blockchain.bat

# PowerShell
./docker-start-production-blockchain.ps1

# Linux/Mac
docker-compose -f docker-compose.production-blockchain.yml up --build -d
```

## 📋 System Architecture

The Docker deployment includes:

### Core Services
- **MongoDB**: Database for storing agent data and transactions
- **Backend**: Production API server with blockchain integration
- **Frontend**: React-based user interface
- **Nginx**: Reverse proxy and load balancer
- **Redis**: Caching layer for performance
- **Blockchain Monitor**: Real-time blockchain event monitoring

### Production Features
- ✅ **Real Smart Contracts** on Sepolia testnet
- ✅ **Autonomous AI Agents** with blockchain execution
- ✅ **Real-time Notifications** (Telegram, Discord, Email)
- ✅ **Health Monitoring** and automatic recovery
- ✅ **Production Security** with encrypted keys
- ✅ **Scalable Architecture** ready for mainnet

## 🔧 Configuration

### Environment Variables

The system uses these key environment variables:

```env
# Blockchain
USE_TESTNET=true
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
SEPOLIA_PRIVATE_KEY=your_private_key

# Smart Contracts (Deployed on Sepolia)
YIELD_OPTIMIZER_ADDRESS=0x079f3a87f579eA15c0CBDc375455F6FB39C8de21
ARBITRAGE_BOT_ADDRESS=0x04a95ab21D2491b9314A1D50ab7aD234E6006dB1
RISK_MANAGER_ADDRESS=0x5c3aDdd97D227cD58f54B48Abd148E255426D860

# Notifications (Optional)
TELEGRAM_BOT_TOKEN=your_bot_token
DISCORD_WEBHOOK_URL=your_webhook_url
EMAIL_USER=your_email
```

### Customization

To customize the deployment:

1. **Edit Environment Variables**: Modify `docker-compose.production-blockchain.yml`
2. **Add Notification Tokens**: Set your Telegram/Discord credentials
3. **Configure Networks**: Change RPC URLs for different networks
4. **Adjust Resources**: Modify Docker resource limits

## 📡 Available Endpoints

Once deployed, these endpoints are available:

### Frontend
- **Main App**: http://localhost:3000
- **Dashboard**: http://localhost:3000/dashboard
- **Agents**: http://localhost:3000/agents

### Backend API
- **Health Check**: http://localhost:5000/health
- **System Status**: http://localhost:5000/api/production-blockchain/system/status
- **Start Agents**: POST http://localhost:5000/api/production-blockchain/system/start
- **Yield Optimization**: POST http://localhost:5000/api/production-blockchain/yield/optimize
- **Arbitrage**: POST http://localhost:5000/api/production-blockchain/arbitrage/execute
- **Risk Assessment**: POST http://localhost:5000/api/production-blockchain/risk/evaluate
- **Portfolio Rebalance**: POST http://localhost:5000/api/production-blockchain/portfolio/rebalance

### Database
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

## 🧪 Testing the Deployment

### Automated Testing
```bash
node test-docker-production.js
```

### Manual Testing
```bash
# Check service status
docker-compose -f docker-compose.production-blockchain.yml ps

# View logs
docker-compose -f docker-compose.production-blockchain.yml logs -f

# Test health endpoint
curl http://localhost:5000/health

# Test blockchain API
curl http://localhost:5000/api/production-blockchain/system/status
```

## 🔍 Monitoring and Logs

### View All Logs
```bash
docker-compose -f docker-compose.production-blockchain.yml logs -f
```

### View Specific Service Logs
```bash
# Backend logs
docker-compose -f docker-compose.production-blockchain.yml logs -f backend

# Frontend logs
docker-compose -f docker-compose.production-blockchain.yml logs -f frontend

# MongoDB logs
docker-compose -f docker-compose.production-blockchain.yml logs -f mongodb

# Blockchain monitor logs
docker-compose -f docker-compose.production-blockchain.yml logs -f blockchain-monitor
```

### Health Checks
```bash
# Check all service health
docker-compose -f docker-compose.production-blockchain.yml ps

# Individual health checks
curl http://localhost:5000/health
curl http://localhost:3000
curl http://localhost:5000/api/production-blockchain/system/health
```

## 🛠️ Management Commands

### Start System
```bash
docker-compose -f docker-compose.production-blockchain.yml up -d
```

### Stop System
```bash
docker-compose -f docker-compose.production-blockchain.yml down
```

### Restart System
```bash
docker-compose -f docker-compose.production-blockchain.yml restart
```

### Rebuild and Start
```bash
docker-compose -f docker-compose.production-blockchain.yml up --build -d
```

### Scale Services
```bash
# Scale backend to 3 instances
docker-compose -f docker-compose.production-blockchain.yml up -d --scale backend=3
```

### Update System
```bash
# Pull latest images and restart
docker-compose -f docker-compose.production-blockchain.yml pull
docker-compose -f docker-compose.production-blockchain.yml up -d
```

## 🔧 Troubleshooting

### Common Issues

#### Services Not Starting
```bash
# Check Docker daemon
docker --version
docker-compose --version

# Check system resources
docker system df
docker system prune -f
```

#### Port Conflicts
```bash
# Check what's using ports
netstat -tulpn | grep :5000
netstat -tulpn | grep :3000

# Kill processes using ports
sudo kill -9 $(lsof -t -i:5000)
```

#### Database Connection Issues
```bash
# Check MongoDB logs
docker-compose -f docker-compose.production-blockchain.yml logs mongodb

# Connect to MongoDB directly
docker exec -it lokiai-mongodb mongosh
```

#### Blockchain Connection Issues
```bash
# Check backend logs for RPC errors
docker-compose -f docker-compose.production-blockchain.yml logs backend | grep -i "rpc\|blockchain"

# Verify environment variables
docker-compose -f docker-compose.production-blockchain.yml exec backend env | grep -i "sepolia\|rpc"
```

### Performance Optimization

#### Resource Limits
Add resource limits to `docker-compose.production-blockchain.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

#### Caching
Enable Redis caching by setting:
```env
REDIS_URL=redis://redis:6379
ENABLE_CACHING=true
```

## 🚀 Production Deployment

### Prerequisites for Production
1. **Domain Name**: Configure DNS for your domain
2. **SSL Certificate**: Add SSL certificates to `./LokiAi/ssl/`
3. **Environment Secrets**: Use Docker secrets for sensitive data
4. **Monitoring**: Set up external monitoring (Prometheus, Grafana)
5. **Backups**: Configure automated database backups

### Production Configuration
```yaml
# Add to docker-compose.production-blockchain.yml
secrets:
  private_key:
    file: ./secrets/private_key.txt
  telegram_token:
    file: ./secrets/telegram_token.txt

services:
  backend:
    secrets:
      - private_key
      - telegram_token
```

### Mainnet Deployment
To deploy on Ethereum mainnet:

1. Update environment variables:
```env
USE_TESTNET=false
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
ETHEREUM_PRIVATE_KEY=your_mainnet_private_key
```

2. Deploy contracts to mainnet
3. Update contract addresses
4. Ensure sufficient ETH for gas fees

## 📊 System Metrics

The system provides comprehensive metrics:

### Blockchain Metrics
- Total transactions executed
- Gas costs and optimization
- Success/failure rates
- Agent performance statistics

### System Metrics
- API response times
- Database performance
- Memory and CPU usage
- Network throughput

### Business Metrics
- Total value locked (TVL)
- Profit generated
- Risk assessments performed
- Portfolio rebalances executed

## 🎯 Next Steps

After successful deployment:

1. **Configure Notifications**: Set up Telegram/Discord alerts
2. **Add Users**: Enable user registration and wallet connection
3. **Monitor Performance**: Set up external monitoring
4. **Scale Services**: Add more backend instances as needed
5. **Deploy to Mainnet**: Move to production Ethereum network

## 🆘 Support

For issues or questions:

1. **Check Logs**: Always start with Docker logs
2. **Health Checks**: Verify all services are healthy
3. **Test Endpoints**: Use the test script to verify functionality
4. **Resource Usage**: Monitor system resources

---

## 🎉 Success!

If all services are running and tests pass, you have successfully deployed the complete LokiAI Production Blockchain System!

**Your system includes:**
- ✅ Real blockchain integration with deployed smart contracts
- ✅ Autonomous AI agents executing real transactions
- ✅ Production-grade monitoring and alerting
- ✅ Scalable Docker architecture
- ✅ Complete API and frontend interface

**Ready for production use with real DeFi operations!** 🚀