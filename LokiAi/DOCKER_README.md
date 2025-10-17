# 🐳 LokiAI Docker Production Setup

Complete Docker orchestration for the LokiAI decentralized AI agent platform.

## 🏗️ Architecture

```
                    ┌─────────────────────┐
                    │   NGINX (Port 80)   │
                    │   Reverse Proxy     │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐    ┌──────────────────┐   ┌──────────────┐
│   Frontend    │    │     Backend      │   │  Biometrics  │
│ React + Vite  │    │ Node.js + Socket │   │   FastAPI    │
│  Port: 5175   │    │  Port: 5000/5050 │   │ Port: 25000  │
└───────────────┘    └─────────┬────────┘   └──────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │     MongoDB      │
                    │   Port: 27017    │
                    └──────────────────┘
```

## 🚀 Quick Start

### 1. Verify Prerequisites

```powershell
.\verify-setup.ps1
```

### 2. Deploy All Services

```powershell
.\docker-start-production.ps1
```

### 3. Test Deployment

```powershell
node test-production-deployment.js
```

### 4. Access Application

- Frontend: http://localhost
- Backend: http://localhost/api/health
- Biometrics: http://localhost/biometrics/health

## 📦 Services

### Frontend (React + Vite)
- **Port**: 5175 (internal), 80 (via NGINX)
- **Technology**: React 18, TypeScript, Tailwind CSS
- **Features**: MetaMask integration, real-time dashboard, biometric UI

### Backend (Node.js + Express)
- **Ports**: 5000 (HTTP), 5050 (Socket.IO)
- **Technology**: Express, Socket.IO, Ethers.js
- **Features**: REST API, WebSocket, wallet auth, blockchain integration

### Biometrics (Python + FastAPI)
- **Port**: 25000
- **Technology**: FastAPI, scikit-learn, librosa
- **Features**: Keystroke dynamics, voice biometrics, ML models

### MongoDB
- **Port**: 27017
- **Version**: MongoDB 7
- **Features**: Authenticated, indexed, persistent storage

### NGINX
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **Features**: Reverse proxy, load balancing, SSL/TLS ready

## 🔧 Configuration

### Environment Variables

Create `.env` from template:

```bash
copy .env.production .env
```

Key variables:

```env
# Database
MONGODB_URI=mongodb://admin:lokiai2024@mongodb:27017/loki_agents?authSource=admin

# Services
PORT=5000
SOCKET_PORT=5050
BIOMETRICS_URL=http://biometrics-service:25000

# Blockchain
ALCHEMY_API_KEY=your_key_here
ALCHEMY_ETH_RPC=https://eth-sepolia.g.alchemy.com/v2/your_key
ALCHEMY_POLYGON_RPC=https://polygon-mainnet.g.alchemy.com/v2/your_key

# Security
ENCRYPTION_KEY=loki-biometric-key-2025
JWT_SECRET=your-jwt-secret

# CORS
CORS_ORIGIN=http://localhost:80,http://localhost:5175
```

## 📋 Docker Compose Files

### Development
```bash
docker-compose.yml
```
- Uses existing GhostKey service
- Development mode
- Hot reload enabled

### Production
```bash
docker-compose.prod.yml
```
- Optimized builds
- Health checks
- Production settings
- Volume management

## 🛠️ Management Commands

### Start Services
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Stop Services
```bash
docker-compose -f docker-compose.prod.yml down
```

### View Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f [service]
```

### Restart Service
```bash
docker-compose -f docker-compose.prod.yml restart [service]
```

### Check Status
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Rebuild
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

## 🔍 Monitoring

### Real-Time Monitor
```powershell
.\monitor-services.ps1
```

Shows:
- Service status
- Health checks
- Resource usage
- Access points

### Health Checks
```bash
# Backend
curl http://localhost/api/health

# Biometrics
curl http://localhost/biometrics/health

# MongoDB
docker exec lokiai-mongodb mongosh --eval "db.adminCommand('ping')"
```

## 🧪 Testing

### Automated Test Suite
```bash
node test-production-deployment.js
```

Tests:
- ✅ Backend health
- ✅ Biometrics health
- ✅ Authentication endpoints
- ✅ Dashboard API
- ✅ Agents API
- ✅ Analytics API
- ✅ Cross-chain API
- ✅ Activity API
- ✅ Biometrics API

## 📊 Database Management

### Initialize Database
```bash
docker exec -it lokiai-mongodb mongosh -u admin -p lokiai2024 --authenticationDatabase admin < mongodb-init.js
```

### Seed Sample Data
```bash
docker exec -it lokiai-backend node seed-production-data.js
```

### Backup Database
```bash
docker exec lokiai-mongodb mongodump --out /backup
```

### Restore Database
```bash
docker exec lokiai-mongodb mongorestore /backup
```

## 🔐 Security

### Change Default Passwords

Edit `.env`:
```env
MONGODB_URI=mongodb://admin:NEW_PASSWORD@mongodb:27017/...
JWT_SECRET=your-new-secret
ENCRYPTION_KEY=your-new-key
```

### Enable SSL/TLS

1. Generate certificates:
```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem
```

2. Uncomment HTTPS block in `nginx.conf`

3. Restart NGINX:
```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

## 🐛 Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check Docker
docker ps -a

# Restart Docker Desktop
```

### Port Conflicts

```bash
# Windows - Find process
netstat -ano | findstr :80

# Kill process
taskkill /PID <PID> /F
```

### MongoDB Connection Issues

```bash
# Test connection
docker exec -it lokiai-mongodb mongosh -u admin -p lokiai2024

# Check logs
docker-compose -f docker-compose.prod.yml logs mongodb
```

### Clean Restart

```bash
# Stop and remove everything
docker-compose -f docker-compose.prod.yml down -v

# Remove images
docker-compose -f docker-compose.prod.yml down --rmi all

# Rebuild
docker-compose -f docker-compose.prod.yml up -d --build
```

## 📁 File Structure

```
LokiAi/
├── backend/
│   ├── server.js              # Main backend server
│   └── package.json           # Backend dependencies
├── biometrics/
│   ├── app.py                 # FastAPI ML service
│   └── requirements.txt       # Python dependencies
├── routes/
│   ├── agents.js              # AI agents API
│   ├── analytics.js           # Analytics API
│   ├── crosschain.js          # Cross-chain API
│   └── activity.js            # Activity API
├── docker-compose.prod.yml    # Production orchestration
├── Dockerfile.backend         # Backend container
├── Dockerfile.biometrics      # Biometrics container
├── Dockerfile.frontend.prod   # Frontend container
├── nginx.conf                 # NGINX configuration
├── nginx-frontend.conf        # Frontend NGINX config
├── mongodb-init.js            # Database initialization
├── seed-production-data.js    # Sample data seeder
├── test-production-deployment.js  # Test suite
├── verify-setup.ps1           # Setup verification
├── monitor-services.ps1       # Service monitor
├── docker-start-production.ps1    # Deployment script
└── .env.production            # Environment template
```

## 📚 Documentation

- **QUICKSTART.md** - 5-minute quick start
- **PRODUCTION_DEPLOYMENT.md** - Complete deployment guide
- **DEPLOYMENT_CHECKLIST.md** - Go-live checklist
- **INTEGRATION_SUMMARY.md** - Technical summary
- **DOCKER_README.md** - This file

## 🎯 Production Checklist

- [ ] Docker Desktop installed
- [ ] Environment configured
- [ ] Passwords changed
- [ ] API keys added
- [ ] Services started
- [ ] Health checks passing
- [ ] Tests passing
- [ ] SSL/TLS configured (optional)
- [ ] Monitoring enabled
- [ ] Backups configured

## 🔗 Useful Links

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [MongoDB Docker](https://hub.docker.com/_/mongo)
- [NGINX Docker](https://hub.docker.com/_/nginx)

## 🆘 Support

### Check Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Verify Setup
```powershell
.\verify-setup.ps1
```

### Run Tests
```bash
node test-production-deployment.js
```

### Monitor Services
```powershell
.\monitor-services.ps1
```

---

**LokiAI** - Production-Ready Docker Orchestration

**Status**: ✅ Ready to Deploy

**Version**: 1.0.0
