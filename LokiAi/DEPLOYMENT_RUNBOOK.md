# 🚀 LokiAI ML-Driven DeFi Agent System - Deployment Runbook

## 📋 Overview

This runbook provides step-by-step instructions to deploy and verify the complete LokiAI system with end-to-end ML-driven DeFi agent functionality on Ethereum and Polygon testnets.

## 🏗️ System Architecture

```
Frontend (React/Vite) → Backend (Node.js) → ML API (FastAPI) → Testnet (MetaMask)
        ↓                    ↓                   ↓                    ↓
   Agent UI            Trade Logic        ML Predictions      Transaction Execution
```

## 🔧 Prerequisites

### Required Software
- **Node.js** (v18+)
- **Python** (v3.8+)
- **MetaMask** browser extension
- **Git**

### Required Accounts
- **Infura/Alchemy** account for RPC endpoints
- **Testnet ETH** from Sepolia faucet
- **Testnet MATIC** from Mumbai faucet

### Environment Setup
1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd loki.ai/LokiAi
   ```

2. **Install Dependencies**
   ```bash
   # Frontend dependencies
   npm install
   
   # Backend dependencies
   npm install express cors ethers node-fetch winston dotenv web3
   
   # Python ML API dependencies
   pip install -r requirements_ml.txt
   ```

## 🚀 Deployment Steps

### Step 1: Configure Environment

1. **Copy Environment Template**
   ```bash
   cp .env.testnet .env
   ```

2. **Update Configuration**
   Edit `.env` with your actual values:
   ```env
   # Replace with your Infura/Alchemy keys
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
   MUMBAI_RPC_URL=https://polygon-mumbai.infura.io/v3/YOUR_INFURA_PROJECT_ID
   
   # Optional: Explorer API keys for transaction monitoring
   ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
   POLYGONSCAN_API_KEY=YOUR_POLYGONSCAN_API_KEY
   ```

### Step 2: Start ML API Service

1. **Terminal 1: Start ML API**
   ```bash
   python ml_api_service.py
   ```
   
2. **Verify ML API**
   ```bash
   curl http://127.0.0.1:8000/health
   ```
   Expected response:
   ```json
   {
     "status": "healthy",
     "model_loaded": true,
     "version": "v1.0"
   }
   ```

### Step 3: Start Backend Server

1. **Terminal 2: Start Backend**
   ```bash
   node backend_server_enhanced.js
   ```
   
2. **Verify Backend**
   ```bash
   curl http://127.0.0.1:25001/health
   ```
   Expected response:
   ```json
   {
     "status": "healthy",
     "components": {
       "ml_api": "healthy",
       "blockchain_providers": "healthy"
     }
   }
   ```

### Step 4: Start Frontend

1. **Terminal 3: Start Frontend**
   ```bash
   npm run dev
   ```
   
2. **Access Application**
   Open browser: `http://localhost:5173`

### Step 5: Start Monitoring (Optional)

1. **Terminal 4: Start Monitor**
   ```bash
   python agent_monitor.py
   ```

## 🧪 Testing & Verification

### Automated Integration Tests

1. **Run Test Suite**
   ```bash
   node test_integration.js
   ```
   
2. **Expected Output**
   ```
   🚀 Starting LokiAI Integration Tests...
   
   ✅ PASS: ML API Health Check (150ms)
   ✅ PASS: Backend Health Check (200ms)
   ✅ PASS: ML Prediction Flow (300ms)
   ✅ PASS: Agent Deployment (250ms)
   ✅ PASS: Trade Execution Pipeline (400ms)
   ✅ PASS: Transaction Monitoring (100ms)
   
   🎉 All tests passed! The integration is working correctly.
   ```

### Manual Verification Steps

#### 1. MetaMask Setup
1. **Install MetaMask** browser extension
2. **Add Sepolia Network**
   - Network Name: `Sepolia`
   - RPC URL: `https://sepolia.infura.io/v3/YOUR_KEY`
   - Chain ID: `11155111`
   - Currency Symbol: `SEP`
   - Block Explorer: `https://sepolia.etherscan.io`

3. **Get Test ETH**
   - Visit: https://sepoliafaucet.com/
   - Request test ETH for your wallet

#### 2. Frontend Verification
1. **Connect Wallet**
   - Click "Connect Wallet" in the app
   - Approve MetaMask connection
   - Verify wallet address appears

2. **Complete Biometric Setup**
   - Navigate to Security page
   - Complete keystroke and voice registration
   - Verify "Enterprise Security Active" banner

3. **Deploy Test Agent**
   - Go to AI Agents page
   - Click "Deploy Agent"
   - Choose "Yield Optimizer"
   - Configure parameters:
     - Max Investment: $1000
     - Risk Tolerance: 30%
     - Network: Sepolia
   - Click "Deploy Agent"

#### 3. End-to-End Trade Execution
1. **Execute Agent Trade**
   - Select deployed agent
   - Click "Execute Trade" (if available)
   - Or use backend API directly:
   ```bash
   curl -X POST http://127.0.0.1:25001/agents/AGENT_ID/execute \
     -H "Content-Type: application/json" \
     -d '{
       "marketData": {
         "price": 1500.25,
         "volume_24h": 1250000.0,
         "volatility": 0.045,
         "rsi": 65.2,
         "liquidity_usd": 15000000.0
       },
       "walletAddress": "YOUR_WALLET_ADDRESS"
     }'
   ```

2. **Verify ML Prediction**
   - Check backend logs for ML API call
   - Verify prediction received with confidence score

3. **Verify Trade Instruction**
   - Check backend logs for trade instruction creation
   - Verify transaction data prepared for MetaMask

4. **Execute Transaction**
   - MetaMask should prompt for transaction approval
   - Approve transaction
   - Wait for confirmation

5. **Verify Transaction**
   - Check Sepolia Etherscan for transaction
   - Verify transaction matches trade instruction
   - Check backend logs for confirmation

## 📊 Monitoring & Debugging

### Health Check Endpoints

| Service | Endpoint | Expected Status |
|---------|----------|----------------|
| ML API | `http://127.0.0.1:8000/health` | `healthy` |
| Backend | `http://127.0.0.1:25001/health` | `healthy` |
| Frontend | `http://localhost:5173` | Page loads |

### Log Files

| Component | Log File | Purpose |
|-----------|----------|---------|
| ML API | `ml_api_service.log` | ML predictions and model info |
| Backend | `backend_server.log` | Trade instructions and blockchain |
| Monitor | `agent_monitor.log` | System monitoring and alerts |

### Common Issues & Solutions

#### 1. ML API Not Starting
**Problem**: `ModuleNotFoundError` or dependency issues
**Solution**:
```bash
pip install -r requirements_ml.txt
python -m pip install --upgrade pip
```

#### 2. Backend Cannot Connect to ML API
**Problem**: `ML API unavailable` error
**Solution**:
- Verify ML API is running on port 8000
- Check firewall settings
- Verify `ML_API_URL` in backend configuration

#### 3. MetaMask Transaction Fails
**Problem**: Transaction rejected or fails
**Solution**:
- Ensure sufficient test ETH balance
- Check gas price and limit
- Verify network is Sepolia
- Check contract addresses are valid

#### 4. RPC Connection Issues
**Problem**: `Provider not found` or connection errors
**Solution**:
- Verify Infura/Alchemy API keys
- Check RPC URLs in `.env`
- Try alternative RPC endpoints

## 🔄 Switching to Mainnet

⚠️ **WARNING**: Only switch to mainnet after thorough testing on testnets!

### Configuration Changes

1. **Update RPC URLs**
   ```env
   ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
   POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_KEY
   ```

2. **Update Contract Addresses**
   - Deploy actual smart contracts to mainnet
   - Update contract addresses in configuration

3. **Security Hardening**
   - Enable signature verification
   - Implement proper access controls
   - Add rate limiting
   - Enable monitoring and alerting

4. **Risk Management**
   - Start with small amounts
   - Implement circuit breakers
   - Add manual override capabilities
   - Monitor all transactions closely

## 📈 Performance Monitoring

### Key Metrics to Monitor

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| ML API Response Time | <500ms | >1000ms |
| Backend Response Time | <200ms | >500ms |
| Transaction Success Rate | >95% | <90% |
| System Uptime | >99% | <95% |

### Monitoring Commands

```bash
# Check system health
curl http://127.0.0.1:25001/health

# Monitor ML predictions
tail -f ml_api_service.log | grep "prediction"

# Monitor transactions
tail -f backend_server.log | grep "transaction"

# Run continuous monitoring
python agent_monitor.py
```

## 🆘 Emergency Procedures

### Emergency Stop
1. **Stop All Services**
   ```bash
   # Stop frontend (Ctrl+C in terminal)
   # Stop backend (Ctrl+C in terminal)
   # Stop ML API (Ctrl+C in terminal)
   ```

2. **Disable Agents**
   ```bash
   curl -X POST http://127.0.0.1:25001/agents/emergency-stop
   ```

### Recovery Procedures
1. **Check system health**
2. **Review logs for errors**
3. **Restart services in order**: ML API → Backend → Frontend
4. **Verify all connections**
5. **Run integration tests**

## ✅ Success Criteria

The system is successfully deployed when:

- [ ] All health checks return `healthy`
- [ ] Integration tests pass 100%
- [ ] MetaMask connects successfully
- [ ] Agents can be deployed via UI
- [ ] ML predictions are generated
- [ ] Trade instructions are created
- [ ] Transactions execute on testnet
- [ ] Monitoring shows system activity

## 📞 Support

For issues or questions:
1. Check logs for error messages
2. Run integration tests for diagnosis
3. Verify all prerequisites are met
4. Check network connectivity and API keys

---

**🎉 Congratulations! You now have a fully functional ML-driven DeFi agent system running on testnets!**