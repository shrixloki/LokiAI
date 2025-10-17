# 🚀 LokiAI Production Deployment Guide

Complete guide for deploying the LokiAI decentralized AI agent platform with full Docker orchestration.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Service Details](#service-details)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## 🏗️ Architecture Overview

LokiAI consists of 6 microservices orchestrated with Docker Compose:

```
┌─────────────────────────────────────────────────────────────┐
│                         NGINX (Port 80)                      │
│                    Reverse Proxy & Load Balancer             │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────────┐   ┌──────────────┐
│   Frontend   │    │     Backend      │   │  Biometrics  │
│  React+Vite  │    │  Node.js+Express │   │   FastAPI    │
│  Port: 5175  │    │  Port: 5000/5050 │   │  Port: 25000 │
└──────────────┘    └──────────────────┘   └──────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │     MongoDB      │
                    │   Port: 27017    │
                    └──────────────────┘
```

### Service Responsibilities

| Service | Description | Port | Technology |
|---------|-------------|------|------------|
| **Frontend** | React UI with Vite | 5175 | React, TypeScript, Tailwind |
| **Backend** | REST API + Socket.IO | 5000, 5050 | Node.js, Express, Socket.IO |
| **Biometrics** | ML microservice for auth | 25000 | Python, FastAPI, scikit-learn |
| **MongoDB** | Database | 27017 | MongoDB 7 |
| **NGINX** | Reverse proxy | 80, 443 | NGINX |

## ✅ Prerequisites

### Required Software

- **Docker Desktop** 4.25+ ([Download](https://www.docker.com/products/docker-desktop))
- **Docker Compose** 2.20+ (included with Docker Desktop)
- **Git** (for cloning repository)

### System Requirements

- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 10GB free space
- **OS**: Windows 10/11, macOS 10.15+, or Linux

### API Keys (Optional but Recommended)

- **Alchemy API Key**: For blockchain RPC endpoints
- **CoinGecko API Key**: For price data

## 🚀 Quick Start

### 1. Clone and Navigate

```bash
cd LokiAi
```

### 2. Configure Environment

Copy the production environment template:

```bash
copy .env.production .env
```

Edit `.env` and add your API keys:

```env
ALCHEMY_API_KEY=your_alchemy_key_here
COINGECKO_API_KEY=your_coingecko_key_here
```

### 3. Start All Services

**Windows (PowerShell):**
```powershell
.\docker-start-production.ps1
```

**Windows (CMD):**
```cmd
docker-start-production.bat
```

**Manual Start:**
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### 4. Verify Deployment

Check service health:

```bash
docker-compose -f docker-compose.prod.yml ps
```

All services should show "Up" status.

### 5. Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost/api/health
- **Biometrics**: http://localhost/biometrics/health
- **API Docs**: http://localhost/biometrics/docs

## 🔧 Service Details

### Frontend Service

**Technology**: React 18 + Vite + TypeScript

**Features**:
- MetaMask wallet integration
- Biometric authentication UI
- Real-time dashboard with Socket.IO
- AI agent management
- Cross-chain activity tracking

**Build Process**:
1. Multi-stage Docker build
2. Production optimization with Vite
3. Served via NGINX

### Backend Service

**Technology**: Node.js + Express + Socket.IO

**API Endpoints**:

```
GET  /health                          - Health check
GET  /api/auth/message                - Get SIWE message
POST /api/auth/verify                 - Verify wallet signature
GET  /api/dashboard/summary           - Dashboard data
GET  /api/agents/status               - AI agent status
GET  /api/analytics/performance       - Performance metrics
GET  /api/crosschain/activity         - Cross-chain transactions
GET  /api/activity/history            - Activity log
```

**Socket.IO Events**:
- `updateAgent` - Real-time agent updates
- `updatePortfolio` - Portfolio value changes
- `updateActivity` - New activity notifications

### Biometrics Service

**Technology**: Python + FastAPI + scikit-learn

**ML Models**:
- **Keystroke Dynamics**: Autoencoder-based authentication
- **Voice Biometrics**: MFCC feature extraction + MLP classifier

**API Endpoints**:

```
GET  /health                              - Health check
GET  /api/biometrics/status               - Check setup status
POST /api/biometrics/keystroke/train     - Train keystroke model
POST /api/biometrics/keystroke/verify    - Verify keystroke
POST /api/biometrics/voice/train         - Train voice model
POST /api/biometrics/voice/verify        - Verify voice
```

### MongoDB Service

**Collections**:

- `users` - User accounts and settings
- `agents` - AI agent configurations
- `transactions` - Cross-chain transactions
- `biometrics` - Encrypted biometric models
- `activity_log` - User activity history
- `portfolio_history` - Portfolio value over time
- `analytics` - Performance analytics

**Indexes**: Optimized for wallet address and timestamp queries

## ⚙️ Configuration

### Environment Variables

**Backend (.env)**:

```env
# Node Environment
NODE_ENV=production
PORT=5000
SOCKET_PORT=5050

# Database
MONGODB_URI=mongodb://admin:lokiai2024@mongodb:27017/loki_agents?authSource=admin

# Services
BIOMETRICS_URL=http://biometrics-service:25000

# Security
ENCRYPTION_KEY=loki-biometric-key-2025
JWT_SECRET=your-jwt-secret

# Blockchain RPCs
ALCHEMY_ETH_RPC=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
ALCHEMY_POLYGON_RPC=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
ALCHEMY_BSC_RPC=https://bsc-dataseed.binance.org/
ALCHEMY_ARBITRUM_RPC=https://arb1.arbitrum.io/rpc

# CORS
CORS_ORIGIN=http://localhost:80,http://localhost:5175
```

### NGINX Configuration

The NGINX reverse proxy routes traffic:

- `/` → Frontend (React app)
- `/api/` → Backend API
- `/socket.io/` → WebSocket connections
- `/biometrics/` → Biometrics service

**Key Features**:
- CORS headers
- Gzip compression
- WebSocket support
- Health check endpoints
- SSL/TLS ready (commented out)

## 📦 Deployment

### Production Deployment Steps

1. **Build Images**:
```bash
docker-compose -f docker-compose.prod.yml build --no-cache
```

2. **Start Services**:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. **Initialize Database**:
```bash
docker exec -it lokiai-mongodb mongosh -u admin -p lokiai2024 --authenticationDatabase admin < mongodb-init.js
```

4. **Seed Sample Data** (optional):
```bash
docker exec -it lokiai-backend node seed-production-data.js
```

5. **Verify Health**:
```bash
curl http://localhost/api/health
curl http://localhost/biometrics/health
```

### Scaling Services

Scale backend for high load:

```bash
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### SSL/TLS Configuration

1. Generate SSL certificates:
```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem
```

2. Uncomment HTTPS server block in `nginx.conf`

3. Restart NGINX:
```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

## 📊 Monitoring

### View Logs

**All services**:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

**Specific service**:
```bash
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f biometrics-service
```

### Service Status

```bash
docker-compose -f docker-compose.prod.yml ps
```

### Resource Usage

```bash
docker stats
```

### Health Checks

All services include health checks:

```bash
# Backend
curl http://localhost/api/health

# Biometrics
curl http://localhost/biometrics/health

# MongoDB
docker exec lokiai-mongodb mongosh --eval "db.adminCommand('ping')"
```

## 🔍 Troubleshooting

### Common Issues

#### Services Won't Start

**Check logs**:
```bash
docker-compose -f docker-compose.prod.yml logs
```

**Restart services**:
```bash
docker-compose -f docker-compose.prod.yml restart
```

#### MongoDB Connection Failed

**Verify MongoDB is running**:
```bash
docker exec -it lokiai-mongodb mongosh -u admin -p lokiai2024
```

**Check connection string** in `.env`:
```env
MONGODB_URI=mongodb://admin:lokiai2024@mongodb:27017/loki_agents?authSource=admin
```

#### Port Already in Use

**Find process using port**:
```bash
# Windows
netstat -ano | findstr :80
netstat -ano | findstr :5000

# Kill process
taskkill /PID <PID> /F
```

**Change ports** in `docker-compose.prod.yml`:
```yaml
ports:
  - "8080:80"  # Use 8080 instead of 80
```

#### Biometrics Service Fails

**Check Python dependencies**:
```bash
docker-compose -f docker-compose.prod.yml logs biometrics-service
```

**Rebuild image**:
```bash
docker-compose -f docker-compose.prod.yml build --no-cache biometrics-service
```

#### Frontend Not Loading

**Check NGINX logs**:
```bash
docker-compose -f docker-compose.prod.yml logs nginx
```

**Verify build**:
```bash
docker exec -it lokiai-frontend ls -la /usr/share/nginx/html
```

### Clean Restart

Complete cleanup and restart:

```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Remove volumes (WARNING: deletes data)
docker-compose -f docker-compose.prod.yml down -v

# Remove images
docker-compose -f docker-compose.prod.yml down --rmi all

# Rebuild and start
docker-compose -f docker-compose.prod.yml up -d --build
```

## 🔐 Security Best Practices

1. **Change default passwords** in `.env`:
   - MongoDB password
   - JWT secret
   - Encryption key

2. **Use environment-specific configs**:
   - Development: `docker-compose.yml`
   - Production: `docker-compose.prod.yml`

3. **Enable SSL/TLS** for production

4. **Restrict CORS origins** to your domain

5. **Use secrets management** for API keys

6. **Regular backups** of MongoDB data:
```bash
docker exec lokiai-mongodb mongodump --out /backup
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [MongoDB Manual](https://docs.mongodb.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [NGINX Documentation](https://nginx.org/en/docs/)

## 🆘 Support

For issues and questions:

1. Check logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify health: `curl http://localhost/api/health`
3. Review this guide
4. Check Docker Desktop dashboard

---

**LokiAI** - Decentralized AI Agent Platform with Biometric Security
