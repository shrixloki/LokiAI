# LokiAI Docker Setup - One Command Deployment

## 🚀 Quick Start

### **Single Command to Start Everything:**

#### Windows:
```cmd
start-docker.bat
```

#### Linux/macOS:
```bash
chmod +x start-docker.sh
./start-docker.sh
```

## 📋 Prerequisites

1. **Install Docker Desktop**
   - Windows: https://docs.docker.com/desktop/install/windows/
   - macOS: https://docs.docker.com/desktop/install/mac/
   - Linux: https://docs.docker.com/desktop/install/linux/

2. **Verify Installation**
   ```bash
   docker --version
   docker-compose --version
   ```

## 🔧 Setup Instructions

### 1. **First Time Setup**
```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd loki.ai/LokiAi

# Copy environment template
cp .env.docker .env

# Edit .env file with your configuration
# Update SEPOLIA_RPC and AGENT_WALLET at minimum
```

### 2. **Start the System**
```bash
# Windows
start-docker.bat

# Linux/macOS
./start-docker.sh
```

### 3. **Access the Application**
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:25001
- **ML API**: http://localhost:8000/docs
- **System Status**: http://localhost:8080

## 🏗️ Architecture

### **Services Included:**
- ✅ **Frontend** (React/Vite) - Port 5173
- ✅ **Backend API** (Node.js/Express) - Port 25001
- ✅ **ML API** (Python/FastAPI) - Port 8000
- ✅ **Deposit Service** (Node.js) - Port 25002
- ✅ **Capital Allocation** (Node.js) - Port 25003
- ✅ **MongoDB** (Database) - Port 27017
- ✅ **Redis** (Cache) - Port 6379
- ✅ **System Monitor** (Python)
- ✅ **Nginx** (Reverse Proxy) - Production only

### **Docker Containers:**
```
lokiai-frontend          # React frontend
lokiai-backend           # Main API server
lokiai-ml-api           # ML prediction service
lokiai-deposit-service  # Deposit/withdrawal handling
lokiai-capital-service  # Capital allocation
lokiai-mongodb          # Database
lokiai-redis            # Cache
lokiai-monitor          # System monitoring
lokiai-status           # Status dashboard
lokiai-nginx            # Reverse proxy (production)
```

## 🔧 Management Commands

### **View Logs**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f ml-api
```

### **Stop System**
```bash
# Windows
stop-docker.bat

# Linux/macOS
./stop-docker.sh
```

### **Restart Services**
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart frontend
docker-compose restart backend
```

### **Update System**
```bash
# Pull latest changes and restart
docker-compose pull
docker-compose up -d
```

### **Reset Data**
```bash
# Stop and remove volumes (resets database)
docker-compose down -v

# Clean rebuild
docker-compose build --no-cache
docker-compose up -d
```

## 🌍 Environment Configuration

### **Required Environment Variables:**
```bash
# Blockchain Configuration
SEPOLIA_RPC=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
AGENT_WALLET=0xYOUR_AGENT_WALLET_ADDRESS

# Optional Configuration
COINGECKO_API_KEY=your_api_key
MONGODB_URI=mongodb://lokiai:password@mongodb:27017/lokiai
REDIS_URL=redis://redis:6379
```

### **Development vs Production:**
```bash
# Development (default)
docker-compose up -d

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 🔍 Health Checks

### **Service Status:**
```bash
# Check all containers
docker-compose ps

# Check specific service health
curl http://localhost:25001/health  # Backend
curl http://localhost:8000/health   # ML API
curl http://localhost:25002/health  # Deposit Service
curl http://localhost:25003/health  # Capital Service
```

### **Database Status:**
```bash
# MongoDB
docker-compose exec mongodb mongo --eval "db.stats()"

# Redis
docker-compose exec redis redis-cli ping
```

## 🐛 Troubleshooting

### **Common Issues:**

#### **Port Already in Use**
```bash
# Find process using port
netstat -ano | findstr :5173
netstat -ano | findstr :25001

# Kill process or change port in docker-compose.yml
```

#### **Docker Not Running**
```bash
# Start Docker Desktop
# Or on Linux:
sudo systemctl start docker
```

#### **Permission Denied (Linux/macOS)**
```bash
# Make scripts executable
chmod +x start-docker.sh stop-docker.sh

# Fix Docker permissions
sudo usermod -aG docker $USER
# Logout and login again
```

#### **Out of Disk Space**
```bash
# Clean up Docker
docker system prune -a
docker volume prune
```

#### **Service Won't Start**
```bash
# Check logs
docker-compose logs service-name

# Rebuild service
docker-compose build --no-cache service-name
docker-compose up -d service-name
```

## 📊 Monitoring

### **Real-time Monitoring:**
- **Container Stats**: `docker stats`
- **Service Logs**: `docker-compose logs -f`
- **System Status**: http://localhost:8080
- **Database**: MongoDB Compass → mongodb://localhost:27017

### **Performance Metrics:**
```bash
# Container resource usage
docker stats

# Service-specific metrics
curl http://localhost:25001/metrics
curl http://localhost:8000/metrics
```

## 🔒 Security

### **Production Security:**
- SSL/TLS certificates in `/ssl` directory
- Environment variables in `.env` (never commit)
- Database authentication enabled
- Rate limiting via Nginx
- Security headers configured

### **Development Security:**
- Services isolated in Docker network
- No external database access
- Local-only binding

## 🚀 Deployment Options

### **Local Development:**
```bash
docker-compose up -d
```

### **Production:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### **Cloud Deployment:**
- AWS ECS/Fargate
- Google Cloud Run
- Azure Container Instances
- DigitalOcean App Platform

## 📈 Scaling

### **Horizontal Scaling:**
```yaml
# In docker-compose.prod.yml
backend:
  deploy:
    replicas: 3
```

### **Load Balancing:**
- Nginx upstream configuration
- Docker Swarm mode
- Kubernetes deployment

## 🎯 Next Steps

1. **Start the system**: `./start-docker.sh`
2. **Open frontend**: http://localhost:5173
3. **Connect MetaMask**: Use Sepolia testnet
4. **Deploy agents**: Use the Agents page
5. **Fund agents**: Use real ETH deposits
6. **Monitor**: Check logs and status dashboard

## 📞 Support

### **Logs Location:**
- Container logs: `docker-compose logs`
- Application logs: `./logs/` directory
- Database logs: MongoDB container logs

### **Debug Commands:**
```bash
# Enter container shell
docker-compose exec frontend sh
docker-compose exec backend sh
docker-compose exec ml-api bash

# Check container details
docker inspect lokiai-frontend
docker inspect lokiai-backend
```

---

**🎉 Your LokiAI system is now fully containerized and ready to run with a single command!**