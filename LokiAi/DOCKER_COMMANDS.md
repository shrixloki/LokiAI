# 🐳 Docker Commands Reference - LokiAI

## 📋 Quick Reference

### ⚡ Most Common Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart all services
docker-compose restart

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

---

## 🚀 Starting Services

### Start All Services (Detached Mode)
```bash
docker-compose up -d
```

### Start All Services (With Logs)
```bash
docker-compose up
```

### Start and Rebuild All Services
```bash
docker-compose up -d --build
```

### Start Specific Service
```bash
docker-compose up -d backend
docker-compose up -d frontend
docker-compose up -d mongodb
docker-compose up -d ghostkey
```

### Start with Fresh Build (No Cache)
```bash
docker-compose build --no-cache
docker-compose up -d
```

---

## 🛑 Stopping Services

### Stop All Services
```bash
docker-compose down
```

### Stop All Services and Remove Volumes (⚠️ Deletes Data)
```bash
docker-compose down -v
```

### Stop All Services and Remove Images
```bash
docker-compose down --rmi all
```

### Stop Specific Service
```bash
docker-compose stop backend
docker-compose stop frontend
```

---

## 🔄 Restarting Services

### Restart All Services
```bash
docker-compose restart
```

### Restart Specific Service
```bash
docker-compose restart backend
docker-compose restart frontend
docker-compose restart mongodb
docker-compose restart ghostkey
```

### Restart with Rebuild
```bash
docker-compose down
docker-compose up -d --build
```

---

## 🔨 Rebuilding Services

### Rebuild All Services
```bash
docker-compose build
```

### Rebuild Specific Service
```bash
docker-compose build backend
docker-compose build frontend
docker-compose build ghostkey
```

### Rebuild Without Cache
```bash
docker-compose build --no-cache
```

### Rebuild and Start
```bash
docker-compose up -d --build
```

---

## 📊 Monitoring & Logs

### View All Logs (Follow Mode)
```bash
docker-compose logs -f
```

### View Specific Service Logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
docker-compose logs -f ghostkey
```

### View Last 100 Lines
```bash
docker-compose logs --tail=100
```

### View Logs Since Specific Time
```bash
docker-compose logs --since 10m
docker-compose logs --since 2024-10-17T12:00:00
```

### Check Service Status
```bash
docker-compose ps
```

### Check Resource Usage
```bash
docker stats
```

---

## 🔍 Inspecting Services

### List Running Containers
```bash
docker ps
```

### List All Containers (Including Stopped)
```bash
docker ps -a
```

### Inspect Container
```bash
docker inspect lokiai-backend
docker inspect lokiai-frontend
docker inspect lokiai-mongodb
docker inspect lokiai-ghostkey
```

### View Container Details
```bash
docker-compose ps
```

---

## 🖥️ Executing Commands in Containers

### Execute Command in Container
```bash
docker exec -it lokiai-backend sh
docker exec -it lokiai-mongodb mongosh
```

### Run MongoDB Commands
```bash
docker exec -it lokiai-mongodb mongosh -u admin -p lokiai2024 --authenticationDatabase admin
```

### Check Backend Health
```bash
docker exec lokiai-backend curl http://localhost:5000/health
```

### View Files in Container
```bash
docker exec lokiai-backend ls -la
```

---

## 🧹 Cleaning Up

### Remove Stopped Containers
```bash
docker container prune
```

### Remove Unused Images
```bash
docker image prune
```

### Remove Unused Volumes
```bash
docker volume prune
```

### Remove Everything Unused
```bash
docker system prune -a
```

### Complete Cleanup (⚠️ Nuclear Option)
```bash
docker-compose down -v --rmi all
docker system prune -a --volumes
```

---

## 🔧 Troubleshooting Commands

### Check Docker Version
```bash
docker --version
docker-compose --version
```

### Check Docker Status
```bash
docker info
```

### View Docker Networks
```bash
docker network ls
```

### View Docker Volumes
```bash
docker volume ls
```

### Inspect Network
```bash
docker network inspect lokiai_lokiai-network
```

### Check Port Usage
```bash
# Windows
netstat -ano | findstr :5000
netstat -ano | findstr :5173
netstat -ano | findstr :27017

# PowerShell
Get-NetTCPConnection -LocalPort 5000
```

---

## 🎯 Common Workflows

### Fresh Start (Clean Rebuild)
```bash
# Stop everything
docker-compose down -v

# Remove old images
docker-compose down --rmi all

# Rebuild from scratch
docker-compose build --no-cache

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Quick Restart
```bash
docker-compose restart
```

### Update Code and Restart
```bash
# Rebuild specific service
docker-compose build backend

# Restart it
docker-compose up -d backend

# Check logs
docker-compose logs -f backend
```

### Debug a Service
```bash
# Stop the service
docker-compose stop backend

# Start with logs visible
docker-compose up backend

# Or check logs
docker-compose logs -f backend
```

---

## 📦 Service-Specific Commands

### Backend
```bash
# Restart backend
docker-compose restart backend

# View backend logs
docker-compose logs -f backend

# Rebuild backend
docker-compose build backend
docker-compose up -d backend

# Execute command in backend
docker exec -it lokiai-backend sh
```

### Frontend
```bash
# Restart frontend
docker-compose restart frontend

# View frontend logs
docker-compose logs -f frontend

# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend
```

### MongoDB
```bash
# Restart MongoDB
docker-compose restart mongodb

# Access MongoDB shell
docker exec -it lokiai-mongodb mongosh -u admin -p lokiai2024

# View MongoDB logs
docker-compose logs -f mongodb

# Backup MongoDB
docker exec lokiai-mongodb mongodump --out /backup

# Restore MongoDB
docker exec lokiai-mongodb mongorestore /backup
```

### GhostKey (Biometrics)
```bash
# Restart GhostKey
docker-compose restart ghostkey

# View GhostKey logs
docker-compose logs -f ghostkey

# Rebuild GhostKey
docker-compose build ghostkey
docker-compose up -d ghostkey
```

---

## 🎮 One-Line Commands

```bash
# Complete restart
docker-compose down && docker-compose up -d

# Rebuild and restart
docker-compose down && docker-compose up -d --build

# Clean restart
docker-compose down -v && docker-compose up -d --build

# View all logs
docker-compose logs -f

# Check everything
docker-compose ps && docker stats --no-stream
```

---

## 🚨 Emergency Commands

### Service Won't Start
```bash
# Check logs
docker-compose logs backend

# Try rebuilding
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Port Already in Use
```bash
# Find process using port (Windows)
netstat -ano | findstr :5000

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or stop all containers
docker-compose down
```

### Out of Disk Space
```bash
# Clean up everything
docker system prune -a --volumes

# Remove specific volumes
docker volume rm lokiai_mongodb_data
```

### Container Keeps Restarting
```bash
# Check logs
docker-compose logs backend

# Stop and inspect
docker-compose stop backend
docker inspect lokiai-backend

# Try starting without detach to see errors
docker-compose up backend
```

---

## 📝 Useful Aliases (Optional)

Add these to your PowerShell profile:

```powershell
# Docker Compose shortcuts
function dcu { docker-compose up -d }
function dcd { docker-compose down }
function dcr { docker-compose restart }
function dcl { docker-compose logs -f }
function dcp { docker-compose ps }
function dcb { docker-compose up -d --build }

# Docker shortcuts
function dps { docker ps }
function dpa { docker ps -a }
function dst { docker stats }
```

---

## 🎯 Your Most Used Commands

```bash
# 1. Start everything
docker-compose up -d

# 2. Check status
docker-compose ps

# 3. View logs
docker-compose logs -f

# 4. Restart a service
docker-compose restart backend

# 5. Stop everything
docker-compose down

# 6. Rebuild and restart
docker-compose up -d --build

# 7. Clean restart
docker-compose down && docker-compose up -d --build
```

---

## 📍 Current Project Structure

```
LokiAi/
├── docker-compose.yml          # Main compose file
├── Dockerfile.backend          # Backend container
├── Dockerfile.frontend         # Frontend container  
├── Dockerfile.frontend.prod    # Production frontend
├── backend/                    # Backend source
├── src/                        # Frontend source
└── routes/                     # API routes
```

---

## ✅ Quick Health Check

```bash
# Check all services
docker-compose ps

# Test backend
curl http://localhost:5000/health

# Test frontend
curl http://localhost:5173

# Test MongoDB
docker exec lokiai-mongodb mongosh --eval "db.adminCommand('ping')"
```

---

**Pro Tip**: Keep this file open in a separate window for quick reference!
