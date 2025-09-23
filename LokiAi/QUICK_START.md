# ⚡ LokiAI Quick Start Guide

## 🚀 **FASTEST WAY TO START**

### **Windows (PowerShell)**
```powershell
# Navigate to project
cd loki.ai/LokiAi

# Run startup script
.\start_system.ps1
```

### **Windows (Command Prompt)**
```cmd
# Navigate to project
cd loki.ai\LokiAi

# Run startup script
.\start_system.bat
```

### **Linux/Mac**
```bash
# Navigate to project
cd loki.ai/LokiAi

# Make script executable and run
chmod +x start_system.sh
./start_system.sh
```

---

## 🎯 **MANUAL STARTUP (4 Terminals)**

If automated scripts don't work, start each service manually:

### **Terminal 1: ML API**
```bash
cd loki.ai/LokiAi
pip install fastapi uvicorn numpy pandas scikit-learn aiohttp requests web3
python ml_api_service.py
```

### **Terminal 2: Backend**
```bash
cd loki.ai/LokiAi
npm install express cors ethers node-fetch winston dotenv web3
node backend_server_enhanced.js
```

### **Terminal 3: Deposit Service**
```bash
cd loki.ai/LokiAi
node backend_deposit_service.js
```

### **Terminal 4: Frontend**
```bash
cd loki.ai/LokiAi
npm run dev
```

---

## ✅ **VERIFICATION**

### **Check All Services Are Running**
```bash
# ML API
curl http://127.0.0.1:8000/health

# Backend
curl http://127.0.0.1:25001/health

# Deposit Service
curl http://127.0.0.1:25002/health

# Frontend (open in browser)
http://localhost:5173
```

### **Run Integration Tests**
```bash
cd loki.ai/LokiAi
node test_integration.js
node test_deposit_flow.js
```

---

## 🎮 **USING THE SYSTEM**

1. **Open Frontend**: `http://localhost:5173`
2. **Connect MetaMask**: Click "Connect Wallet"
3. **Complete Security Setup**: Keystroke + Voice biometrics
4. **Deploy Agent**: Choose agent type and configure
5. **Monitor Performance**: View real-time agent activity

---

## 🛑 **STOPPING THE SYSTEM**

### **Automated Stop (Linux/Mac)**
```bash
./stop_system.sh
```

### **Manual Stop**
- Close all terminal windows
- Or press `Ctrl+C` in each terminal

---

## 📊 **SERVICE PORTS**

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Backend | 25001 | http://127.0.0.1:25001 |
| Deposit Service | 25002 | http://127.0.0.1:25002 |
| ML API | 8000 | http://127.0.0.1:8000 |

---

## 🆘 **TROUBLESHOOTING**

### **PowerShell Execution Policy Error**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### **Port Already in Use**
```bash
# Kill process on port (Windows)
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Kill process on port (Linux/Mac)
lsof -ti:8000 | xargs kill -9
```

### **Python/Node Not Found**
- Install Python 3.8+ from python.org
- Install Node.js 18+ from nodejs.org
- Restart terminal after installation

---

**🎉 Your LokiAI system should now be running with all components integrated!**