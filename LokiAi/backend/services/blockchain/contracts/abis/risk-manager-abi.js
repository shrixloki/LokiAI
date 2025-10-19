// RiskManager Contract ABI
export const RISK_MANAGER_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "_emergencyManager", "type": "address"}
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "riskScore", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "riskLevel", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "portfolioValue", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "RiskAssessed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "alertType", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "currentRisk", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "threshold", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "recommendation", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "RiskAlert",
    "type": "event"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "user", "type": "address"}
    ],
    "name": "evaluateRisk",
    "outputs": [
      {"internalType": "uint256", "name": "riskScore", "type": "uint256"},
      {"internalType": "string", "name": "riskLevel", "type": "string"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "user", "type": "address"},
      {"internalType": "address", "name": "token", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "uint256", "name": "value", "type": "uint256"},
      {"internalType": "string", "name": "protocol", "type": "string"}
    ],
    "name": "addPosition",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "user", "type": "address"}
    ],
    "name": "getUserRiskAssessment",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "riskScore", "type": "uint256"},
          {"internalType": "string", "name": "riskLevel", "type": "string"},
          {"internalType": "uint256", "name": "portfolioValue", "type": "uint256"},
          {"internalType": "uint256", "name": "volatilityScore", "type": "uint256"},
          {"internalType": "uint256", "name": "concentrationRisk", "type": "uint256"},
          {"internalType": "uint256", "name": "liquidityRisk", "type": "uint256"},
          {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "internalType": "struct RiskManager.RiskAssessment",
        "name": "",
        "type": "tuple"
      }
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
          {"internalType": "uint256", "name": "value", "type": "uint256"},
          {"internalType": "string", "name": "protocol", "type": "string"},
          {"internalType": "uint256", "name": "entryTime", "type": "uint256"},
          {"internalType": "uint256", "name": "riskWeight", "type": "uint256"}
        ],
        "internalType": "struct RiskManager.Position[]",
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
      {"internalType": "uint256", "name": "_totalAssessments", "type": "uint256"},
      {"internalType": "uint256", "name": "_totalAlerts", "type": "uint256"},
      {"internalType": "uint256", "name": "_totalLiquidations", "type": "uint256"},
      {"internalType": "uint256", "name": "_activeAlerts", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];