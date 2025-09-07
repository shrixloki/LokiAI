import { Asset, AIAgent, Transaction, Notification, Chain, SecurityLog } from '@/types';

// Mock Assets Data
export const mockAssets: Asset[] = [
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    chain: 'ethereum',
    balance: 24.5673,
    usdValue: 45682.34,
    price: 1858.72,
    change24h: 2.47,
    logo: '⟠'
  },
  {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    chain: 'ethereum',
    balance: 15420.89,
    usdValue: 15420.89,
    price: 1.00,
    change24h: 0.01,
    logo: '💵'
  },
  {
    id: 'wbtc',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    chain: 'ethereum',
    balance: 1.2456,
    usdValue: 31876.45,
    price: 25589.33,
    change24h: -1.23,
    logo: '₿'
  },
  {
    id: 'matic',
    symbol: 'MATIC',
    name: 'Polygon',
    chain: 'polygon',
    balance: 8945.67,
    usdValue: 7156.54,
    price: 0.8,
    change24h: 4.67,
    logo: '⬢'
  },
  {
    id: 'arb',
    symbol: 'ARB',
    name: 'Arbitrum',
    chain: 'arbitrum',
    balance: 2456.78,
    usdValue: 2945.21,
    price: 1.199,
    change24h: -2.15,
    logo: '🔷'
  }
];

// Mock AI Agents Data
export const mockAgents: AIAgent[] = [
  {
    id: 'agent_1',
    name: 'DeFi Yield Optimizer',
    type: 'yield-optimizer',
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z',
    performance: {
      totalPnl: 12456.78,
      winRate: 87.5,
      totalTrades: 245,
      apy: 24.67
    },
    config: {
      maxSlippage: 0.5,
      minProfitThreshold: 2.5,
      maxGasPrice: 50,
      enabledStrategies: ['compound', 'aave', 'uniswap'],
      riskLevel: 'medium'
    },
    chains: ['ethereum', 'polygon', 'arbitrum']
  },
  {
    id: 'agent_2',
    name: 'Cross-Chain Arbitrage Bot',
    type: 'arbitrage',
    status: 'active',
    createdAt: '2024-02-01T14:20:00Z',
    performance: {
      totalPnl: 8934.22,
      winRate: 92.1,
      totalTrades: 189,
      apy: 31.45
    },
    config: {
      maxSlippage: 1.0,
      minProfitThreshold: 1.5,
      maxGasPrice: 75,
      enabledStrategies: ['dex-arbitrage', 'bridge-arbitrage'],
      riskLevel: 'high'
    },
    chains: ['ethereum', 'bsc', 'polygon']
  },
  {
    id: 'agent_3',
    name: 'Portfolio Rebalancer',
    type: 'portfolio-rebalancer',
    status: 'paused',
    createdAt: '2024-01-20T09:15:00Z',
    performance: {
      totalPnl: 3456.89,
      winRate: 76.3,
      totalTrades: 67,
      apy: 18.92
    },
    config: {
      maxSlippage: 0.3,
      minProfitThreshold: 3.0,
      maxGasPrice: 40,
      enabledStrategies: ['balanced-portfolio', 'risk-parity'],
      riskLevel: 'low'
    },
    chains: ['ethereum', 'arbitrum']
  }
];

// Mock Transactions Data
export const mockTransactions: Transaction[] = [
  {
    id: 'tx_1',
    type: 'agent-execution',
    status: 'confirmed',
    fromChain: 'ethereum',
    toChain: 'polygon',
    asset: 'USDC',
    amount: 5000,
    fee: 12.45,
    timestamp: '2024-03-01T15:30:00Z',
    hash: '0x742d35...5d9a',
    agentId: 'agent_1'
  },
  {
    id: 'tx_2',
    type: 'bridge',
    status: 'pending',
    fromChain: 'arbitrum',
    toChain: 'ethereum',
    asset: 'ETH',
    amount: 2.5,
    fee: 0.023,
    timestamp: '2024-03-01T14:45:00Z'
  },
  {
    id: 'tx_3',
    type: 'swap',
    status: 'confirmed',
    fromChain: 'ethereum',
    asset: 'WBTC',
    amount: 0.5,
    fee: 0.0045,
    timestamp: '2024-03-01T13:20:00Z',
    hash: '0x892a4d...8d9e'
  }
];

// Mock Notifications Data
export const mockNotifications: Notification[] = [
  {
    id: 'notif_1',
    type: 'success',
    title: 'Agent Execution Complete',
    message: 'DeFi Yield Optimizer successfully executed trade with +$234.56 profit',
    timestamp: '2024-03-01T15:30:00Z',
    read: false,
    actionUrl: '/agents/agent_1'
  },
  {
    id: 'notif_2',
    type: 'warning',
    title: 'High Gas Prices Detected',
    message: 'Current network gas prices exceed your threshold. Consider adjusting settings.',
    timestamp: '2024-03-01T14:15:00Z',
    read: false
  },
  {
    id: 'notif_3',
    type: 'info',
    title: 'New Cross-Chain Route Available',
    message: 'Arbitrum to Polygon bridge now supports lower fees via our new integration',
    timestamp: '2024-03-01T12:00:00Z',
    read: true
  }
];

// Mock Chains Data
export const mockChains: Chain[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    logo: '⟠',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    explorerUrl: 'https://etherscan.io',
    gasPrice: 35.2,
    isActive: true
  },
  {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    logo: '⬢',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    gasPrice: 30.5,
    isActive: true
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum One',
    symbol: 'ARB',
    logo: '🔷',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    gasPrice: 0.1,
    isActive: true
  },
  {
    id: 'bsc',
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    logo: '🟨',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    gasPrice: 5.2,
    isActive: false
  }
];

// Mock Security Logs Data
export const mockSecurityLogs: SecurityLog[] = [
  {
    id: 'sec_1',
    type: 'transaction',
    description: 'Large transaction initiated: 10 ETH cross-chain transfer',
    timestamp: '2024-03-01T15:30:00Z',
    severity: 'medium',
    resolved: true
  },
  {
    id: 'sec_2',
    type: 'security-alert',
    description: 'Unusual trading pattern detected in arbitrage bot',
    timestamp: '2024-03-01T14:20:00Z',
    severity: 'high',
    resolved: false
  },
  {
    id: 'sec_3',
    type: 'login',
    description: 'Wallet connection from new device detected',
    timestamp: '2024-03-01T12:00:00Z',
    severity: 'low',
    resolved: true
  }
];

// Portfolio stats calculation
export const getPortfolioStats = () => {
  const totalValue = mockAssets.reduce((sum, asset) => sum + asset.usdValue, 0);
  const totalChange24h = mockAssets.reduce((sum, asset) => {
    return sum + (asset.usdValue * asset.change24h / 100);
  }, 0);
  const changePercentage = (totalChange24h / (totalValue - totalChange24h)) * 100;

  return {
    totalValue,
    totalChange24h,
    changePercentage,
    assetsCount: mockAssets.length
  };
};

// Agent performance calculation
export const getAgentStats = () => {
  const activeAgents = mockAgents.filter(agent => agent.status === 'active').length;
  const totalPnl = mockAgents.reduce((sum, agent) => sum + agent.performance.totalPnl, 0);
  const avgWinRate = mockAgents.reduce((sum, agent) => sum + agent.performance.winRate, 0) / mockAgents.length;
  const totalTrades = mockAgents.reduce((sum, agent) => sum + agent.performance.totalTrades, 0);

  return {
    activeAgents,
    totalAgents: mockAgents.length,
    totalPnl,
    avgWinRate,
    totalTrades
  };
};