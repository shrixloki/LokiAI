// ArbitrageBot Contract ABI
export const ARBITRAGE_BOT_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "_feeRecipient", "type": "address"}
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "executor", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "tokenA", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "tokenB", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amountIn", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "amountOut", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "profit", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "dexA", "type": "string"},
      {"indexed": false, "internalType": "string", "name": "dexB", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "ArbitrageExecuted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "tokenA", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "tokenB", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "priceA", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "priceB", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "profitPotential", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "dexA", "type": "string"},
      {"indexed": false, "internalType": "string", "name": "dexB", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "OpportunityDetected",
    "type": "event"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "tokenA", "type": "address"},
      {"internalType": "address", "name": "tokenB", "type": "address"}
    ],
    "name": "detectOpportunity",
    "outputs": [
      {"internalType": "bool", "name": "hasOpportunity", "type": "bool"},
      {"internalType": "uint256", "name": "profitPotential", "type": "uint256"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "tokenA", "type": "address"},
      {"internalType": "address", "name": "tokenB", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "string", "name": "dexA", "type": "string"},
      {"internalType": "string", "name": "dexB", "type": "string"}
    ],
    "name": "executeArbitrage",
    "outputs": [
      {"internalType": "uint256", "name": "profit", "type": "uint256"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAvailableDexes",
    "outputs": [
      {"internalType": "string[]", "name": "", "type": "string[]"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "count", "type": "uint256"}
    ],
    "name": "getRecentOpportunities",
    "outputs": [
      {
        "components": [
          {"internalType": "address", "name": "tokenA", "type": "address"},
          {"internalType": "address", "name": "tokenB", "type": "address"},
          {"internalType": "uint256", "name": "priceA", "type": "uint256"},
          {"internalType": "uint256", "name": "priceB", "type": "uint256"},
          {"internalType": "uint256", "name": "profitPotential", "type": "uint256"},
          {"internalType": "string", "name": "dexA", "type": "string"},
          {"internalType": "string", "name": "dexB", "type": "string"},
          {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
          {"internalType": "bool", "name": "executed", "type": "bool"}
        ],
        "internalType": "struct ArbitrageBot.ArbitrageOpportunity[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getStats",
    "outputs": [
      {"internalType": "uint256", "name": "_totalVolume", "type": "uint256"},
      {"internalType": "uint256", "name": "_totalProfit", "type": "uint256"},
      {"internalType": "uint256", "name": "_totalTrades", "type": "uint256"},
      {"internalType": "uint256", "name": "_activeDexes", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];