// PortfolioRebalancer Contract ABI
export const PORTFOLIO_REBALANCER_ABI = [
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
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "totalValue", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "rebalanceAmount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "gasCost", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "PortfolioRebalanced",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "reason", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "deviation", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "threshold", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "RebalanceTriggered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "strategyName", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "strategyId", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "StrategyCreated",
    "type": "event"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "user", "type": "address"}
    ],
    "name": "rebalancePortfolio",
    "outputs": [
      {"internalType": "bool", "name": "rebalanced", "type": "bool"},
      {"internalType": "uint256", "name": "totalValue", "type": "uint256"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "user", "type": "address"},
      {"internalType": "string", "name": "strategyName", "type": "string"},
      {
        "components": [
          {"internalType": "address", "name": "token", "type": "address"},
          {"internalType": "uint256", "name": "targetPercentage", "type": "uint256"},
          {"internalType": "uint256", "name": "currentPercentage", "type": "uint256"},
          {"internalType": "uint256", "name": "currentValue", "type": "uint256"},
          {"internalType": "uint256", "name": "deviation", "type": "uint256"}
        ],
        "internalType": "struct PortfolioRebalancer.Allocation[]",
        "name": "allocations",
        "type": "tuple[]"
      },
      {"internalType": "uint256", "name": "rebalanceThreshold", "type": "uint256"},
      {"internalType": "bool", "name": "autoRebalance", "type": "bool"}
    ],
    "name": "createStrategy",
    "outputs": [
      {"internalType": "uint256", "name": "strategyId", "type": "uint256"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "user", "type": "address"}
    ],
    "name": "getUserPortfolio",
    "outputs": [
      {
        "components": [
          {"internalType": "address", "name": "token", "type": "address"},
          {"internalType": "uint256", "name": "targetPercentage", "type": "uint256"},
          {"internalType": "uint256", "name": "currentPercentage", "type": "uint256"},
          {"internalType": "uint256", "name": "currentValue", "type": "uint256"},
          {"internalType": "uint256", "name": "deviation", "type": "uint256"}
        ],
        "internalType": "struct PortfolioRebalancer.Allocation[]",
        "name": "allocations",
        "type": "tuple[]"
      },
      {"internalType": "uint256", "name": "totalValue", "type": "uint256"},
      {"internalType": "uint256", "name": "strategyId", "type": "uint256"},
      {"internalType": "uint256", "name": "lastRebalance", "type": "uint256"},
      {"internalType": "uint256", "name": "rebalanceCount", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAvailableStrategies",
    "outputs": [
      {"internalType": "string[]", "name": "", "type": "string[]"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getStats",
    "outputs": [
      {"internalType": "uint256", "name": "_totalRebalances", "type": "uint256"},
      {"internalType": "uint256", "name": "_totalValueRebalanced", "type": "uint256"},
      {"internalType": "uint256", "name": "_activeStrategies", "type": "uint256"},
      {"internalType": "uint256", "name": "_totalUsers", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];