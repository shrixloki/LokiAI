# 🚀 Quick Start Fix - LokiAI Production Agents

## 🎯 **ISSUE RESOLVED**

The Docker Compose file paths have been fixed. Here's how to start the system:

---

## ✅ **SOLUTION 1: Use Root Directory Files**

I've created new files in the **ROOT DIRECTORY** (`S:\Projects\LokiAI\loki.ai\`) that work correctly:

### **From Root Directory** (`S:\Projects\LokiAI\loki.ai\`)

```powershell
# PowerShell (RECOMMENDED)
.\start-production-agents.ps1

# Or Windows Batch
.\start-production-agents.bat

# Or Manual Docker
docker-compose -f docker-compose.production-agents.yml up -d --build
```

---

## ✅ **SOLUTION 2: Navigate to Correct Directory**

```powershell
# Navigate to LokiAi subdirectory first
cd LokiAi

# Then run the startup script
.\start-production-agents.ps1
```

---

## 🔧 **WHAT I FIXED**

### **1. Docker Compose Paths**
- ✅ Fixed `portfolio_rebalancer` path: `../portfolio_rebalancer` → `./portfolio_rebalancer`
- ✅ Fixed `Rebalancer` path: `../Rebalancer` → `./Rebalancer`  
- ✅ Fixed `task_gateway` path: `../task_gateway` → `./task_gateway`

### **2. Created Root Directory Files**
- ✅ `docker-compose.production-agents.yml` (in root)
- ✅ `start-production-agents.bat` (in root)
- ✅ `start-production-agents.ps1` (in root)

### **3. Updated Directory Navigation**
- ✅ Scripts now navigate to correct directory automatically
- ✅ All paths are relative to the correct location

---

## 🚀 **RECOMMENDED APPROACH**

### **Step 1: Navigate to Root Directory**
```powershell
cd S:\Projects\LokiAI\loki.ai\
```

### **Step 2: Run Startup Script**
```powershell
.\start-production-agents.ps1
```

### **Step 3: Wait for Services**
- The script will automatically build and start all services
- Wait for "✅ Production Agents Started Successfully!" message

### **Step 4: Access Application**
- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000
- **Biometrics**: http://localhost:25000
- **Rebalancer API**: http://localhost:5001

---

## 📊 **WHAT WILL START**

1. ✅ **Frontend** (React + Vite) - Port 80
2. ✅ **Backend** (Node.js + Production Agents) - Port 5000, 5050
3. ✅ **Portfolio Rebalancer** (Python + Celery)
4. ✅ **Rebalancer API** (Flask + External APIs) - Port 5001
5. ✅ **Biometrics** (FastAPI + ML) - Port 25000
6. ✅ **MongoDB** (Database) - Port 27017
7. ✅ **Redis** (Task Queue) - Port 6379
8. ✅ **Task Gateway** (FastAPI) - Port 8000

---

## 🎯 **EXPECTED RESULT**

After running the startup script, you should see:

```
✅ Production Agents Started Successfully!
🌐 Frontend: http://localhost
🔧 Backend API: http://localhost:5000
🔬 Biometrics: http://localhost:25000
🔄 Rebalancer API: http://localhost:5001
```

Then open **http://localhost** in your browser to access the production agents!

---

## 🆘 **If Still Having Issues**

1. **Check Docker Desktop is running**
2. **Make sure you're in the correct directory**: `S:\Projects\LokiAI\loki.ai\`
3. **Use the root directory files** (not the ones in LokiAi subdirectory)
4. **Run as Administrator** if needed

---

## 🎉 **READY TO GO!**

The system is now properly configured and ready to start. Just run the startup script from the root directory and you'll have all 4 production agents running in Docker containers!