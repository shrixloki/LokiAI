// Core types for the Cross-Chain AI Agent Network

export interface User {
  id: string;
  address: string;
  walletType: 'metamask' | 'phantom' | 'coinbase' | 'walletconnect';
  connectedAt: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  notifications: boolean;
  autoExecute: boolean;
  riskTolerance: 'low' | 'medium' | 'high';
  preferredChains: string[];
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  chain: string;
  balance: number;
  usdValue: number;
  price: number;
  change24h: number;
  logo: string;
}

export interface AIAgent {
  id: string;
  name: string;
  type: 'yield-optimizer' | 'arbitrage' | 'portfolio-rebalancer' | 'risk-manager';
  status: 'active' | 'paused' | 'stopped' | 'error';
  createdAt: string;
  performance: {
    totalPnl: number;
    winRate: number;
    totalTrades: number;
    apy: number;
  };
  config: AgentConfig;
  chains: string[];
}

export interface AgentConfig {
  maxSlippage: number;
  minProfitThreshold: number;
  maxGasPrice: number;
  enabledStrategies: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface Transaction {
  id: string;
  type: 'transfer' | 'swap' | 'bridge' | 'agent-execution';
  status: 'pending' | 'confirmed' | 'failed';
  fromChain: string;
  toChain?: string;
  asset: string;
  amount: number;
  fee: number;
  timestamp: string;
  hash?: string;
  agentId?: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface Chain {
  id: string;
  name: string;
  symbol: string;
  logo: string;
  rpcUrl: string;
  explorerUrl: string;
  gasPrice: number;
  isActive: boolean;
}

export interface SecurityLog {
  id: string;
  type: 'login' | 'transaction' | 'agent-action' | 'security-alert';
  description: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}