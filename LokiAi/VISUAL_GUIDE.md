# AI Agents Live Integration - Visual Guide

## 🎨 What You'll See

### Before Integration (Mock Data)
```
┌─────────────────────────────────────────┐
│  AI Agents                              │
├─────────────────────────────────────────┤
│                                         │
│  ⚡ Arbitrage Bot                       │
│  APY: 0.00%  ← Hardcoded               │
│  P&L: $0.00  ← Static                  │
│  Win Rate: 0% ← Placeholder            │
│  Trades: 0    ← Mock                   │
│                                         │
└─────────────────────────────────────────┘
```

### After Integration (Real Data)
```
┌─────────────────────────────────────────┐
│  AI Agents  🔄 Refresh                  │
├─────────────────────────────────────────┤
│                                         │
│  ⚡ Cross-Chain Arbitrage Bot  🟢       │
│  APY: 14.7%  ← From MongoDB            │
│  P&L: +$12,488.55  ← Real calculation  │
│  Win Rate: 92%  ← Live metric          │
│  Trades: 47  ← Actual count            │
│  Chains: Ethereum, Polygon, Avalanche  │
│                                         │
│  ⚖️ Portfolio Rebalancer  🟢            │
│  APY: 9.3%  ← From MongoDB             │
│  P&L: +$12,359.67  ← Real calculation  │
│  Win Rate: 88%  ← Live metric          │
│  Trades: 39  ← Actual count            │
│  Chains: Ethereum, BSC                 │
│                                         │
│  💰 DeFi Yield Optimizer  🟡            │
│  APY: 22.4%  ← From MongoDB            │
│  P&L: +$8,456.78  ← Real calculation   │
│  Win Rate: 85.5%  ← Live metric        │
│  Trades: 123  ← Actual count           │
│  Chains: Ethereum, Polygon, Arbitrum   │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔄 Data Flow Visualization

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERACTION                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  1. User connects MetaMask wallet                           │
│     Wallet: 0x8bbfa86f2766fd05220f319a4d122c97fbc4b529     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Frontend detects wallet connection                      │
│     useEffect(() => { loadAgents() }, [walletAddress])     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Service layer makes API call                            │
│     fetchAgents(walletAddress)                              │
│     → GET /api/agents/status?wallet=0x...                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Backend receives request                                │
│     router.get('/status', async (req, res) => {...})       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Backend queries MongoDB                                 │
│     db.collection('agents').find({                          │
│       walletAddress: wallet.toLowerCase()                   │
│     })                                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  6. MongoDB returns agent documents                         │
│     [                                                        │
│       { name: "Cross-Chain Arbitrage Bot", ... },          │
│       { name: "Portfolio Rebalancer", ... },               │
│       { name: "DeFi Yield Optimizer", ... }                │
│     ]                                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  7. Backend formats and returns response                    │
│     res.json({                                              │
│       success: true,                                        │
│       agents: [...]                                         │
│     })                                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  8. Frontend receives data                                  │
│     setAgents(agentData)                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  9. React renders agent cards                               │
│     {agents.map(agent => <Card>...</Card>)}                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  10. User sees live agent data                              │
│      ✅ Real APY, P&L, Win Rate, Trades                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗂️ File Structure

```
LokiAi/
│
├── 📁 routes/
│   └── agents.js                    ← Backend API routes
│
├── 📁 src/
│   ├── 📁 services/
│   │   └── agents-service.ts        ← Frontend API service
│   │
│   └── 📁 pages/
│       └── AIAgents.tsx             ← Agent cards UI
│
├── 📁 Documentation/
│   ├── AI_AGENTS_LIVE_INTEGRATION.md
│   ├── AGENTS_QUICK_START.md
│   ├── AGENTS_INTEGRATION_SUMMARY.md
│   ├── README_AI_AGENTS.md
│   ├── VISUAL_GUIDE.md              ← This file
│   └── INTEGRATION_COMPLETE.txt
│
├── 📁 Testing/
│   ├── test-agents-api.js
│   └── verify-agents-integration.js
│
├── 📁 Setup/
│   ├── setup-agents-integration.ps1
│   └── setup-agents-integration.bat
│
├── backend-server.js                ← Main backend (updated)
└── seed-docker-mongodb.js           ← Seed script (updated)
```

---

## 🎯 Component Interaction

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐         ┌──────────────────┐         │
│  │  AIAgents.tsx   │────────→│ agents-service.ts│         │
│  │  (UI Component) │         │  (API Service)   │         │
│  └─────────────────┘         └──────────────────┘         │
│         │                              │                   │
│         │ useState                     │ fetch()           │
│         │ useEffect                    │                   │
│         ↓                              ↓                   │
│  ┌─────────────────┐         ┌──────────────────┐         │
│  │  Agent Cards    │         │  HTTP Request    │         │
│  │  Display        │         │  to Backend      │         │
│  └─────────────────┘         └──────────────────┘         │
│                                        │                   │
└────────────────────────────────────────┼───────────────────┘
                                         │
                                         │ HTTP
                                         │
┌────────────────────────────────────────┼───────────────────┐
│                      BACKEND LAYER     ↓                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐         ┌──────────────────┐         │
│  │ backend-server  │────────→│  routes/agents   │         │
│  │     .js         │         │      .js         │         │
│  └─────────────────┘         └──────────────────┘         │
│         │                              │                   │
│         │ Express                      │ MongoDB Driver    │
│         │ Routing                      │                   │
│         ↓                              ↓                   │
│  ┌─────────────────┐         ┌──────────────────┐         │
│  │  API Endpoints  │         │  Database Query  │         │
│  │  /api/agents/*  │         │  agents.find()   │         │
│  └─────────────────┘         └──────────────────┘         │
│                                        │                   │
└────────────────────────────────────────┼───────────────────┘
                                         │
                                         │ MongoDB Protocol
                                         │
┌────────────────────────────────────────┼───────────────────┐
│                     DATABASE LAYER     ↓                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  MongoDB (Docker Container)                         │  │
│  │                                                      │  │
│  │  Database: loki_agents                              │  │
│  │  Collection: agents                                 │  │
│  │                                                      │  │
│  │  Documents:                                         │  │
│  │  ┌────────────────────────────────────────────┐    │  │
│  │  │ { walletAddress, name, type, status,      │    │  │
│  │  │   performance: { apy, pnl, winRate, ... } │    │  │
│  │  │   chains: [...], config: {...} }          │    │  │
│  │  └────────────────────────────────────────────┘    │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema Visual

```
┌─────────────────────────────────────────────────────────────┐
│  Collection: agents                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Document 1:                                                │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ _id: ObjectId("...")                                  │ │
│  │ walletAddress: "0x8bbfa86f2766fd05220f319a4d122c97..." │ │
│  │ name: "Cross-Chain Arbitrage Bot"                     │ │
│  │ type: "arbitrage"                                     │ │
│  │ status: "active"                                      │ │
│  │ createdAt: ISODate("2025-10-12T14:15:00Z")           │ │
│  │ updatedAt: ISODate("2025-10-13T10:30:00Z")           │ │
│  │                                                        │ │
│  │ performance: {                                        │ │
│  │   apy: 14.7,                                          │ │
│  │   totalPnl: 12488.55,                                 │ │
│  │   winRate: 92,                                        │ │
│  │   totalTrades: 47                                     │ │
│  │ }                                                      │ │
│  │                                                        │ │
│  │ config: {                                             │ │
│  │   maxSlippage: 1.0,                                   │ │
│  │   minProfitThreshold: 1.5,                            │ │
│  │   maxGasPrice: 75,                                    │ │
│  │   enabledStrategies: ["dex-arbitrage", ...],         │ │
│  │   riskLevel: "high"                                   │ │
│  │ }                                                      │ │
│  │                                                        │ │
│  │ chains: ["Ethereum", "Polygon", "Avalanche"]         │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Document 2:                                                │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ _id: ObjectId("...")                                  │ │
│  │ walletAddress: "0x8bbfa86f2766fd05220f319a4d122c97..." │ │
│  │ name: "Portfolio Rebalancer"                          │ │
│  │ type: "portfolio-rebalancer"                          │ │
│  │ status: "active"                                      │ │
│  │ ...                                                    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Document 3:                                                │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ _id: ObjectId("...")                                  │ │
│  │ walletAddress: "0x8bbfa86f2766fd05220f319a4d122c97..." │ │
│  │ name: "DeFi Yield Optimizer"                          │ │
│  │ type: "yield-optimizer"                               │ │
│  │ status: "paused"                                      │ │
│  │ ...                                                    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Setup Flow Visual

```
Step 1: Seed MongoDB
┌─────────────────────────────────────┐
│ $ node seed-docker-mongodb.js       │
│                                     │
│ Creating agents...                  │
│ ✅ Cross-Chain Arbitrage Bot        │
│ ✅ Portfolio Rebalancer             │
│ ✅ DeFi Yield Optimizer             │
│                                     │
│ Summary:                            │
│ Total Agents: 3                     │
│ Active Agents: 2                    │
│ Total P&L: $33,304.00               │
└─────────────────────────────────────┘
              ↓
Step 2: Test API
┌─────────────────────────────────────┐
│ $ node test-agents-api.js           │
│                                     │
│ Testing GET /api/agents/status...   │
│ ✅ Response received                │
│                                     │
│ Agent Summary:                      │
│ 1. Cross-Chain Arbitrage Bot        │
│    APY: 14.7%                       │
│    P&L: $12,488.55                  │
│                                     │
│ 2. Portfolio Rebalancer             │
│    APY: 9.3%                        │
│    P&L: $12,359.67                  │
│                                     │
│ ✅ All tests passed!                │
└─────────────────────────────────────┘
              ↓
Step 3: Start Backend
┌─────────────────────────────────────┐
│ $ node backend-server.js            │
│                                     │
│ 🚀 LokiAI Backend Server            │
│ 🔗 Server: http://localhost:5000    │
│ ✅ MongoDB connected                │
│ 📊 Dashboard API ready              │
│ 🤖 Agents API ready                 │
└─────────────────────────────────────┘
              ↓
Step 4: Start Frontend
┌─────────────────────────────────────┐
│ $ npm run dev                       │
│                                     │
│ VITE v5.0.0 ready                   │
│ ➜ Local: http://localhost:5173     │
│ ➜ Network: http://192.168.x.x:5173 │
└─────────────────────────────────────┘
              ↓
Step 5: Connect & View
┌─────────────────────────────────────┐
│ 1. Open http://localhost:5173       │
│ 2. Connect MetaMask                 │
│ 3. Navigate to AI Agents            │
│ 4. See live agent data! 🎉          │
└─────────────────────────────────────┘
```

---

## ✅ Success Indicators

### In Browser Console
```
🤖 Fetching agents for: 0x8bbfa86f2766fd05220f319a4d122c97fbc4b529
✅ Agents loaded: 3
```

### In Network Tab
```
Request URL: http://localhost:5000/api/agents/status?wallet=0x...
Status: 200 OK
Response: { "success": true, "agents": [...] }
```

### On Screen
```
✅ Agent cards visible
✅ Real APY values (not 0.00%)
✅ Real P&L values (not $0.00)
✅ Real Win Rate (not 0%)
✅ Real Trade Count (not 0)
✅ Chain badges showing
✅ Status indicators (🟢 🟡)
✅ Refresh button working
```

---

**Visual Guide Complete!** 🎨

For detailed instructions, see:
- `AGENTS_QUICK_START.md` - Quick reference
- `AI_AGENTS_LIVE_INTEGRATION.md` - Complete guide
