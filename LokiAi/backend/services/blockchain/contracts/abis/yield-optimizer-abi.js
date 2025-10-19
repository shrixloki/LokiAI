// YieldOptimizer Contract ABI
export const YIELD_OPTIMIZER_ABI = [
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
      {"indexed": true, "internalType": "address", "name": "token", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "apy", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "protocol", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "YieldOptimized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "strategy", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "inputAmount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "outputAmount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "StrategyExecuted",
    "type": "event"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "user", "type": "address"},
      {"internalType": "address", "name": "token", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "executeOptimization",
    "outputs": [
      {"internalType": "uint256", "name": "apy", "type": "uint256"},
      {"internalType": "string", "name": "protocol", "type": "string"}
    ],
    "stateMutability": "nonpayable",
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
    "inputs": [
      {"internalType": "address", "name": "user", "type": "address"}
    ],
    "name": "getUserPositions",
    "outputs": [
      {
        "components": [
          {"internalType": "address", "name": "token", "type": "address"},
          {"internalType": "uint256", "name": "amount", "type": "uint256"},
          {"internalType": "string", "name": "protocol", "type": "string"},
          {"internalType": "uint256", "name": "entryTime", "type": "uint256"},
          {"internalType": "uint256", "name": "expectedApy", "type": "uint256"}
        ],
        "internalType": "struct YieldOptimizer.UserPosition[]",
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
      {"internalType": "uint256", "name": "_totalValueLocked", "type": "uint256"},
      {"internalType": "uint256", "name": "_totalUsersServed", "type": "uint256"},
      {"internalType": "uint256", "name": "_activeStrategies", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];