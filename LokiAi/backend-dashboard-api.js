import express from 'express';
import { ethers } from 'ethers';
import fetch from 'node-fetch';

const router = express.Router();

// ============================================
// BLOCKCHAIN CONFIGURATION
// ============================================

// Sepolia Testnet RPC (Alchemy)
const ALCHEMY_SEPOLIA_URL = process.env.ALCHEMY_SEPOLIA_URL || 
    `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;

// ERC-20 Token Contracts on Sepolia
const TOKEN_CONTRACTS = {
    USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia USDC
    WBTC: '0x29f2D40B0605204364af54EC677bD022dA425d03', // Sepolia WBTC
    MATIC: '0x0000000000000000000000000000000000001010', // Placeholder
};

// ERC-20 ABI (minimal for balance checking)
const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)'
];

// ============================================
// COINGECKO PRICE API
// ============================================

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// Token ID mapping for CoinGecko
const COINGECKO_IDS = {
    ETH: 'ethereum',
    USDC: 'usd-coin',
    WBTC: 'wrapped-bitcoin',
    MATIC: 'matic-network'
};

/**
 * Fetch real-time token prices from CoinGecko
 */
async function getTokenPrices(tokenIds) {
    try {
        const ids = tokenIds.join(',');
        const url = `${COINGECKO_BASE_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
        
        const headers = COINGECKO_API_KEY ? {
            'x-cg-pro-api-key': COINGECKO_API_KEY
        } : {};
        
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('❌ Failed to fetch token prices:', error);
        // Return fallback prices
        return {
            ethereum: { usd: 2000, usd_24h_change: 0 },
            'usd-coin': { usd: 1, usd_24h_change: 0 },
            'wrapped-bitcoin': { usd: 40000, usd_24h_change: 0 },
            'matic-network': { usd: 0.8, usd_24h_change: 0 }
        };
    }
}

/**
 * Fetch blockchain balances for a wallet
 */
async function fetchBlockchainBalances(walletAddress) {
    try {
        const provider = new ethers.JsonRpcProvider(ALCHEMY_SEPOLIA_URL);
        
        // Fetch ETH balance
        const ethBalanceWei = await provider.getBalance(walletAddress);
        const ethBalance = Number(ethers.formatEther(ethBalanceWei));
        
        // Fetch ERC-20 token balances
        const tokenBalances = {};
        
        for (const [symbol, contractAddress] of Object.entries(TOKEN_CONTRACTS)) {
            try {
                const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);
                const balance = await contract.balanceOf(walletAddress);
                const decimals = await contract.decimals();
                tokenBalances[symbol] = Number(ethers.formatUnits(balance, decimals));
            } catch (err) {
                console.warn(`⚠️ Failed to fetch ${symbol} balance:`, err.message);
                tokenBalances[symbol] = 0;
            }
        }
        
        return {
            ETH: ethBalance,
            ...tokenBalances
        };
    } catch (error) {
        console.error('❌ Blockchain fetch failed:', error);
        throw error;
    }
}

/**
 * Calculate portfolio value in USD
 */
async function calculatePortfolioValue(balances, prices) {
    let totalValue = 0;
    const assets = [];
    
    // ETH
    if (balances.ETH > 0) {
        const ethPrice = prices[COINGECKO_IDS.ETH]?.usd || 0;
        const ethValue = balances.ETH * ethPrice;
        totalValue += ethValue;
        assets.push({
            symbol: 'ETH',
            balance: balances.ETH,
            price: ethPrice,
            value: ethValue,
            change24h: prices[COINGECKO_IDS.ETH]?.usd_24h_change || 0
        });
    }
    
    // USDC
    if (balances.USDC > 0) {
        const usdcPrice = prices[COINGECKO_IDS.USDC]?.usd || 1;
        const usdcValue = balances.USDC * usdcPrice;
        totalValue += usdcValue;
        assets.push({
            symbol: 'USDC',
            balance: balances.USDC,
            price: usdcPrice,
            value: usdcValue,
            change24h: prices[COINGECKO_IDS.USDC]?.usd_24h_change || 0
        });
    }
    
    // WBTC
    if (balances.WBTC > 0) {
        const wbtcPrice = prices[COINGECKO_IDS.WBTC]?.usd || 0;
        const wbtcValue = balances.WBTC * wbtcPrice;
        totalValue += wbtcValue;
        assets.push({
            symbol: 'WBTC',
            balance: balances.WBTC,
            price: wbtcPrice,
            value: wbtcValue,
            change24h: prices[COINGECKO_IDS.WBTC]?.usd_24h_change || 0
        });
    }
    
    // MATIC
    if (balances.MATIC > 0) {
        const maticPrice = prices[COINGECKO_IDS.MATIC]?.usd || 0;
        const maticValue = balances.MATIC * maticPrice;
        totalValue += maticValue;
        assets.push({
            symbol: 'MATIC',
            balance: balances.MATIC,
            price: maticPrice,
            value: maticValue,
            change24h: prices[COINGECKO_IDS.MATIC]?.usd_24h_change || 0
        });
    }
    
    return { totalValue, assets };
}

// ============================================
// MAIN DASHBOARD API ENDPOINT
// ============================================

/**
 * GET /api/dashboard/summary?wallet=0x...
 * 
 * Returns real-time dashboard data:
 * - Portfolio value from blockchain + CoinGecko
 * - Active agents from MongoDB
 * - Total P&L from trades
 * - Cross-chain activity count
 */
router.get('/summary', async (req, res) => {
    const { wallet } = req.query;
    
    console.log('📊 Dashboard summary request for wallet:', wallet);
    
    if (!wallet) {
        return res.status(400).json({
            success: false,
            error: 'Wallet address required'
        });
    }
    
    // Validate wallet address format
    if (!ethers.isAddress(wallet)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid wallet address format'
        });
    }
    
    try {
        // ============================================
        // 1. FETCH BLOCKCHAIN BALANCES
        // ============================================
        console.log('🔗 Fetching blockchain balances...');
        const balances = await fetchBlockchainBalances(wallet);
        console.log('✅ Balances:', balances);
        
        // ============================================
        // 2. FETCH TOKEN PRICES
        // ============================================
        console.log('💰 Fetching token prices from CoinGecko...');
        const tokenIds = Object.values(COINGECKO_IDS);
        const prices = await getTokenPrices(tokenIds);
        console.log('✅ Prices fetched');
        
        // ============================================
        // 3. CALCULATE PORTFOLIO VALUE
        // ============================================
        console.log('📈 Calculating portfolio value...');
        const { totalValue, assets } = await calculatePortfolioValue(balances, prices);
        console.log('✅ Portfolio value:', totalValue);
        
        // ============================================
        // 4. FETCH AGENT DATA FROM MONGODB
        // ============================================
        console.log('🤖 Fetching agent data from MongoDB...');
        const db = req.app.locals.db; // MongoDB instance from app
        
        let activeAgents = 0;
        let totalAgents = 0;
        let totalPnL = 0;
        
        if (db) {
            try {
                const agentsCollection = db.collection('agents');
                
                // Count total agents for this wallet
                totalAgents = await agentsCollection.countDocuments({
                    walletAddress: wallet.toLowerCase()
                });
                
                // Count active agents
                activeAgents = await agentsCollection.countDocuments({
                    walletAddress: wallet.toLowerCase(),
                    status: 'active'
                });
                
                // Calculate total P&L (last 30 days)
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                
                const agents = await agentsCollection.find({
                    walletAddress: wallet.toLowerCase()
                }).toArray();
                
                totalPnL = agents.reduce((sum, agent) => {
                    return sum + (agent.performance?.totalPnl || 0);
                }, 0);
                
                console.log('✅ Agent stats:', { activeAgents, totalAgents, totalPnL });
            } catch (dbError) {
                console.warn('⚠️ MongoDB agent query failed:', dbError.message);
            }
        }
        
        // ============================================
        // 5. FETCH CROSS-CHAIN ACTIVITY
        // ============================================
        console.log('🌉 Fetching cross-chain activity...');
        let crossChainActivity = 0;
        
        if (db) {
            try {
                const transactionsCollection = db.collection('transactions');
                
                // Count recent transactions (last 30 days)
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                
                crossChainActivity = await transactionsCollection.countDocuments({
                    walletAddress: wallet.toLowerCase(),
                    timestamp: { $gte: thirtyDaysAgo }
                });
                
                console.log('✅ Cross-chain activity:', crossChainActivity);
            } catch (dbError) {
                console.warn('⚠️ MongoDB transaction query failed:', dbError.message);
            }
        }
        
        // ============================================
        // 6. STORE/UPDATE PORTFOLIO IN MONGODB
        // ============================================
        if (db) {
            try {
                const portfolioCollection = db.collection('portfolio');
                
                await portfolioCollection.updateOne(
                    { wallet: wallet.toLowerCase() },
                    {
                        $set: {
                            wallet: wallet.toLowerCase(),
                            portfolioValue: totalValue,
                            assets: assets,
                            lastUpdated: new Date()
                        }
                    },
                    { upsert: true }
                );
                
                console.log('✅ Portfolio data stored in MongoDB');
            } catch (dbError) {
                console.warn('⚠️ Failed to store portfolio:', dbError.message);
            }
        }
        
        // ============================================
        // 7. RETURN DASHBOARD SUMMARY
        // ============================================
        const summary = {
            portfolioValue: Number(totalValue.toFixed(2)),
            activeAgents,
            totalAgents,
            totalPnL: Number(totalPnL.toFixed(2)),
            crossChainActivity,
            assets,
            timestamp: new Date().toISOString()
        };
        
        console.log('✅ Dashboard summary complete:', summary);
        
        res.json(summary);
        
    } catch (error) {
        console.error('❌ Dashboard summary failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard data',
            message: error.message
        });
    }
});

export default router;
