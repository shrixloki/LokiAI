# LokiAI Mainnet Configuration Guide

## 🌐 Multi-Chain Support

LokiAI backend now supports multiple blockchain networks through environment variable configuration:

### Supported Networks

#### **Mainnets** 🔴
- **Ethereum Mainnet** (Chain ID: 1)
- **Polygon Mainnet** (Chain ID: 137) 
- **Arbitrum One** (Chain ID: 42161)
- **Optimism Mainnet** (Chain ID: 10)

#### **Testnets** 🟡
- **Sepolia** (Chain ID: 11155111)
- **Mumbai** (Polygon Testnet, Chain ID: 80001)

---

## 🔧 Configuration

### 1. Environment Variables Setup

Copy the template file and configure your endpoints:

```bash
cp .env.example .env
```

### 2. RPC Endpoints Configuration

Update your `.env` file with your RPC provider URLs:

```env
# Mainnet RPC URLs
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_INFURA_KEY
ARBITRUM_RPC_URL=https://arbitrum-mainnet.infura.io/v3/YOUR_INFURA_KEY
OPTIMISM_RPC_URL=https://optimism-mainnet.infura.io/v3/YOUR_INFURA_KEY

# Testnet RPC URLs
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
MUMBAI_RPC_URL=https://polygon-mumbai.infura.io/v3/YOUR_INFURA_KEY
```

### 3. Smart Contract Addresses

Configure your deployed contract addresses for each network:

```env
# Ethereum Mainnet Contracts
MAINNET_YIELD_OPTIMIZER=0xYourYieldOptimizerContract
MAINNET_ARBITRAGE_BOT=0xYourArbitrageBotContract
MAINNET_PORTFOLIO_REBALANCER=0xYourPortfolioRebalancerContract
MAINNET_RISK_MANAGER=0xYourRiskManagerContract

# Polygon Mainnet Contracts  
POLYGON_YIELD_OPTIMIZER=0xYourPolygonYieldContract
POLYGON_ARBITRAGE_BOT=0xYourPolygonArbitrageContract
# ... and so on for each network
```

---

## 🚀 Usage Examples

### Deploy Agent on Mainnet

```javascript
const agentConfig = {
    type: 'yield',
    tokenSymbol: 'ETH', 
    network: 'mainnet', // 🔴 Use mainnet
    name: 'Production Yield Agent',
    description: 'Live mainnet yield optimization'
};

const response = await fetch('http://127.0.0.1:25001/agents/deploy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        agentConfig,
        walletAddress: '0xYourWalletAddress'
    })
});
```

### Deploy Agent on Polygon

```javascript
const agentConfig = {
    type: 'arbitrage',
    tokenSymbol: 'MATIC',
    network: 'polygon', // 🟣 Use Polygon
    name: 'Polygon Arbitrage Agent',
    description: 'Cross-DEX arbitrage on Polygon'
};
```

### Deploy Agent on Layer 2s

```javascript
// Arbitrum
const arbitrumConfig = {
    network: 'arbitrum', // ⚡ Low fees, fast transactions
    // ... other config
};

// Optimism  
const optimismConfig = {
    network: 'optimism', // 🔴 Optimistic rollups
    // ... other config
};
```

---

## 🔍 Network Validation

### Check Configuration Status

```bash
# Get network configuration status
curl http://127.0.0.1:25001/networks
```

This returns:
- Network configurations
- Contract addresses
- Validation status for each network
- Ready/not ready indicators

### Run Configuration Tests

```bash
# Test mainnet configuration
node test_mainnet_config.js
```

This will:
- ✅ Verify RPC endpoint configuration
- ✅ Check contract address setup  
- ✅ Test agent deployment on all networks
- ✅ Provide configuration recommendations

---

## 📊 Backend Features

### Environment-Based Configuration

```javascript
// Automatic fallbacks with environment variables
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || 
    "https://eth-mainnet.g.alchemy.com/v2/i-rutA7je782gyS7TXnH3";
```

### Network-Specific Contract Resolution

```javascript  
// Contracts are resolved per network automatically
const networkContracts = CONFIG.CONTRACTS[tradeInstruction.network] || 
                         CONFIG.CONTRACTS.sepolia;

const contractAddress = networkContracts.YIELD_OPTIMIZER;
```

### Multi-Chain Provider Initialization

```javascript
// All configured networks get providers
for (const [network, config] of Object.entries(CONFIG.NETWORKS)) {
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    appState.providers.set(network, provider);
}
```

---

## ⚡ Quick Start

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Add your RPC URLs:**
   ```env
   MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
   ```

3. **Add contract addresses:**
   ```env
   MAINNET_YIELD_OPTIMIZER=0xYourContractAddress
   ```

4. **Start the backend:**
   ```bash
   node backend_server_enhanced.js
   ```

5. **Test configuration:**
   ```bash
   node test_mainnet_config.js
   ```

---

## 🛡️ Security Considerations

### Mainnet Safety
- ⚠️ **NEVER** use test private keys on mainnet
- ⚠️ **ALWAYS** verify contract addresses before deployment
- ⚠️ **START** with small amounts for testing
- ⚠️ **USE** hardware wallets for production

### Environment Variables
- 🔒 Keep `.env` files private (never commit to git)
- 🔒 Use different keys for mainnet vs testnet
- 🔒 Rotate API keys regularly
- 🔒 Monitor your RPC provider usage and limits

### Network-Specific Risks
- **Ethereum Mainnet:** High gas fees, slower finality
- **Polygon:** Bridge risks, validator centralization
- **Arbitrum/Optimism:** Rollup exit delays, sequencer dependencies

---

## 🐛 Troubleshooting

### Common Issues

1. **"Invalid project id" errors:**
   - Check your RPC URL configuration
   - Verify API keys are active and have sufficient quota

2. **Contract interaction failures:**
   - Ensure contract addresses are correct for the network
   - Verify contracts are deployed and verified

3. **Network validation warnings:**
   - Run `node test_mainnet_config.js` to see what's missing
   - Check the `/networks` endpoint for detailed status

### Debug Mode

Set environment variable for detailed logging:
```bash
NODE_ENV=development node backend_server_enhanced.js
```

---

## 📞 Support

For issues or questions:
1. Check the logs: `backend_server.log`
2. Run network validation: `node test_mainnet_config.js`
3. Verify endpoints: `curl http://127.0.0.1:25001/networks`

Your LokiAI backend now supports production-ready mainnet deployments! 🚀