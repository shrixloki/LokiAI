/**
 * AI Agents Service
 * 
 * Fetches real-time agent data from backend + MongoDB
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface AgentPerformance {
  apy: number;
  pnl: number;
  winRate: number;
  trades: number;
}

export interface AgentData {
  name: string;
  type: string;
  apy: number;
  pnl: number;
  winRate: number;
  trades: number;
  status: 'active' | 'paused' | 'stopped' | 'training';
  chains: string[];
  lastUpdated: string;
  config?: {
    maxSlippage?: number;
    minProfitThreshold?: number;
    maxGasPrice?: number;
    enabledStrategies?: string[];
    riskLevel?: 'low' | 'medium' | 'high';
  };
}

export interface AgentsResponse {
  success: boolean;
  agents: AgentData[];
}

/**
 * Fetch all agents for a wallet address
 */
export async function fetchAgents(walletAddress: string): Promise<AgentData[]> {
  try {
    console.log('🤖 Fetching agents for wallet:', walletAddress);
    
    const response = await fetch(
      `${API_BASE_URL}/api/agents/status?wallet=${walletAddress}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AgentsResponse = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to fetch agents');
    }

    console.log('✅ Agents fetched:', data.agents.length);
    return data.agents;
    
  } catch (error) {
    console.error('❌ Failed to fetch agents:', error);
    throw error;
  }
}

/**
 * Run a specific AI agent
 */
export async function runAgent(
  walletAddress: string,
  agentType: string,
  config?: any
): Promise<any> {
  try {
    console.log(`🚀 Running ${agentType} agent for wallet:`, walletAddress);
    
    const response = await fetch(`${API_BASE_URL}/api/agents/execute/${agentType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        config: config || {},
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to run agent');
    }

    console.log('✅ Agent execution completed:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Failed to run agent:', error);
    throw error;
  }
}

/**
 * Update agent performance (called by agent execution logic)
 */
export async function updateAgentPerformance(
  walletAddress: string,
  agentName: string,
  performance: AgentPerformance
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/agents/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wallet: walletAddress,
        agentName,
        performance,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to update agent');
    }

    console.log('✅ Agent performance updated:', agentName);
    
  } catch (error) {
    console.error('❌ Failed to update agent:', error);
    throw error;
  }
}

/**
 * Configure an AI agent
 */
export async function configureAgent(
  walletAddress: string,
  agentType: string,
  config: any
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/agents/configure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        agentType,
        config,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to configure agent');
    }

    console.log('✅ Agent configured:', agentType);
    
  } catch (error) {
    console.error('❌ Failed to configure agent:', error);
    throw error;
  }
}

/**
 * Toggle agent status (start/stop)
 */
export async function toggleAgentStatus(
  walletAddress: string,
  agentType: string,
  status: 'active' | 'paused' | 'stopped'
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/agents/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        agentType,
        status,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to toggle agent');
    }

    console.log('✅ Agent status updated:', agentType, status);
    
  } catch (error) {
    console.error('❌ Failed to toggle agent:', error);
    throw error;
  }
}
