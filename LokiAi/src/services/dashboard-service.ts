/**
 * Dashboard Service - Real-time data fetching
 * Connects to backend API for live blockchain and MongoDB data
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface DashboardSummary {
    portfolioValue: number;
    activeAgents: number;
    totalAgents: number;
    totalPnL: number;
    crossChainActivity: number;
    assets: Asset[];
    timestamp: string;
}

export interface Asset {
    symbol: string;
    balance: number;
    price: number;
    value: number;
    change24h: number;
}

/**
 * Fetch real-time dashboard summary for a wallet
 */
export async function fetchDashboardSummary(walletAddress: string): Promise<DashboardSummary> {
    if (!walletAddress) {
        throw new Error('Wallet address is required');
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/dashboard/summary?wallet=${walletAddress}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch dashboard data');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('❌ Dashboard fetch error:', error);
        throw error;
    }
}

/**
 * Fetch agent details from MongoDB
 */
export async function fetchAgentDetails(walletAddress: string) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/agents?wallet=${walletAddress}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch agent details');
        }

        return await response.json();
    } catch (error) {
        console.error('❌ Agent fetch error:', error);
        return [];
    }
}

/**
 * Fetch recent transactions from MongoDB
 */
export async function fetchRecentTransactions(walletAddress: string, limit: number = 5) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/transactions?wallet=${walletAddress}&limit=${limit}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch transactions');
        }

        return await response.json();
    } catch (error) {
        console.error('❌ Transaction fetch error:', error);
        return [];
    }
}
