/**
 * Yield Optimizer Service
 * 
 * Analyzes DeFi protocols and optimizes yield farming strategies
 */

import fetch from 'node-fetch';
import { ethers } from 'ethers';

// DeFi Protocol APIs
const DEFI_APIS = {
    aave: 'https://aave-api-v2.aave.com/data/markets-data',
    compound: 'https://api.compound.finance/api/v2/ctoken',
    lido: 'https://stake.lido.fi/api/sma-steth-apr',
    yearn: 'https://api.yearn.finance/v1/chains/1/vaults/all',
    defillama: 'https://yields.llama.fi/pools'
};

// Supported protocols and their configurations
const PROTOCOLS = {
    aave: {
        name: 'Aave',
        chains: ['ethereum', 'polygon', 'arbitrum'],
        riskLevel: 'low',
        category: 'lending'
    },
    compound: {
        name: 'Compound',
        chains: ['ethereum'],
        riskLevel: 'low',
        category: 'lending'
    },
    lido: {
        name: 'Lido',
        chains: ['ethereum'],
        riskLevel: 'medium',
        category: 'staking'
    },
    yearn: {
        name: 'Yearn Finance',
        chains: ['ethereum'],
        riskLevel: 'medium',
        category: 'vault'
    },
    uniswap: {
        name: 'Uniswap V3',
        chains: ['ethereum', 'polygon', 'arbitrum'],
        riskLevel: 'high',
        category: 'liquidity'
    }
};

/**
 * Fetch current APYs from Aave
 */
async function getAaveAPY() {
    try {
        const response = await fetch(DEFI_APIS.aave);
        const data = await response.json();
        
        const pools = [];
        
        if (data && data.reserves) {
            data.reserves.forEach(reserve => {
                if (reserve.symbol && reserve.liquidityRate) {
                    pools.push({
                        protocol: 'aave',
                        asset: reserve.symbol,
                        apy: parseFloat(reserve.liquidityRate) / 1e25 * 100, // Convert from ray to percentage
                        tvl: parseFloat(reserve.totalLiquidity) || 0,
                        chain: 'ethereum',
                        riskScore: 2, // Low risk
                        category: 'lending'
                    });
                }
            });
        }
        
        console.log(`📊 Fetched ${pools.length} Aave pools`);
        return pools;
        
    } catch (error) {
        console.error('❌ Aave APY fetch failed:', error);
        return [];
    }
}

/**
 * Fetch Lido staking APY
 */
async function getLidoAPY() {
    try {
        const response = await fetch(DEFI_APIS.lido);
        const data = await response.json();
        
        const apy = data?.data?.smaApr || 4.2; // Default to 4.2% if API fails
        
        return [{
            protocol: 'lido',
            asset: 'ETH',
            apy: apy,
            tvl: 32000000000, // ~32B TVL
            chain: 'ethereum',
            riskScore: 3,
            category: 'staking'
        }];
        
    } catch (error) {
        console.error('❌ Lido APY fetch failed:', error);
        return [{
            protocol: 'lido',
            asset: 'ETH',
            apy: 4.2,
            tvl: 32000000000,
            chain: 'ethereum',
            riskScore: 3,
            category: 'staking'
        }];
    }
}

/**
 * Fetch Compound lending rates
 */
async function getCompoundAPY() {
    try {
        const response = await fetch(DEFI_APIS.compound);
        const data = await response.json();
        
        const pools = [];
        
        if (data && data.cToken) {
            data.cToken.forEach(token => {
                if (token.underlying_symbol && token.supply_rate) {
                    pools.push({
                        protocol: 'compound',
                        asset: token.underlying_symbol,
                        apy: parseFloat(token.supply_rate.value) * 100,
                        tvl: parseFloat(token.total_supply.value) * parseFloat(token.exchange_rate.value) || 0,
                        chain: 'ethereum',
                        riskScore: 2,
                        category: 'lending'
                    });
                }
            });
        }
        
        console.log(`📊 Fetched ${pools.length} Compound pools`);
        return pools;
        
    } catch (error) {
        console.error('❌ Compound APY fetch failed:', error);
        return [];
    }
}

/**
 * Fetch DeFiLlama yield data
 */
async function getDefiLlamaYields() {
    try {
        const response = await fetch(DEFI_APIS.defillama);
        const data = await response.json();
        
        const pools = [];
        
        if (data && data.data) {
            // Filter for top protocols and reasonable APYs
            const filteredPools = data.data
                .filter(pool => 
                    pool.apy > 0 && 
                    pool.apy < 100 && // Filter out unrealistic APYs
                    pool.tvlUsd > 1000000 && // Min $1M TVL
                    ['ethereum', 'polygon', 'arbitrum'].includes(pool.chain)
                )
                .slice(0, 50); // Top 50 pools
            
            filteredPools.forEach(pool => {
                pools.push({
                    protocol: pool.project,
                    asset: pool.symbol,
                    apy: pool.apy,
                    tvl: pool.tvlUsd,
                    chain: pool.chain,
                    riskScore: calculateRiskScore(pool),
                    category: pool.category || 'defi',
                    poolId: pool.pool
                });
            });
        }
        
        console.log(`📊 Fetched ${pools.length} DeFiLlama pools`);
        return pools;
        
    } catch (error) {
        console.error('❌ DeFiLlama fetch failed:', error);
        return [];
    }
}

/**
 * Calculate risk score for a pool
 */
function calculateRiskScore(pool) {
    let score = 1; // Start with low risk
    
    // TVL factor
    if (pool.tvlUsd < 10000000) score += 1; // <$10M TVL = higher risk
    if (pool.tvlUsd < 1000000) score += 1;  // <$1M TVL = very high risk
    
    // APY factor
    if (pool.apy > 20) score += 1; // >20% APY = higher risk
    if (pool.apy > 50) score += 2; // >50% APY = very high risk
    
    // Protocol factor
    const trustedProtocols = ['aave', 'compound', 'lido', 'uniswap', 'curve'];
    if (!trustedProtocols.includes(pool.project?.toLowerCase())) {
        score += 1;
    }
    
    return Math.min(score, 5); // Cap at 5 (highest risk)
}

/**
 * Analyze and optimize yield strategies
 */
function optimizeYieldStrategy(pools, userPreferences = {}) {
    const {
        riskTolerance = 'medium', // low, medium, high
        minAPY = 2.0,
        maxRiskScore = 3,
        preferredAssets = ['ETH', 'USDC', 'USDT', 'DAI'],
        targetAllocation = 100000 // $100k portfolio
    } = userPreferences;
    
    // Filter pools based on preferences
    let filteredPools = pools.filter(pool => 
        pool.apy >= minAPY &&
        pool.riskScore <= maxRiskScore &&
        (preferredAssets.length === 0 || preferredAssets.includes(pool.asset))
    );
    
    // Sort by risk-adjusted return (APY / risk score)
    filteredPools = filteredPools
        .map(pool => ({
            ...pool,
            riskAdjustedReturn: pool.apy / pool.riskScore
        }))
        .sort((a, b) => b.riskAdjustedReturn - a.riskAdjustedReturn);
    
    // Create optimized allocation
    const allocation = [];
    let remainingAmount = targetAllocation;
    const maxPositions = 5; // Diversify across max 5 positions
    
    for (let i = 0; i < Math.min(filteredPools.length, maxPositions) && remainingAmount > 0; i++) {
        const pool = filteredPools[i];
        const weight = i === 0 ? 0.4 : 0.6 / (maxPositions - 1); // 40% in best, rest distributed
        const amount = Math.min(remainingAmount, targetAllocation * weight);
        
        allocation.push({
            ...pool,
            allocatedAmount: amount,
            weight: weight,
            expectedReturn: (amount * pool.apy) / 100
        });
        
        remainingAmount -= amount;
    }
    
    const totalExpectedReturn = allocation.reduce((sum, pos) => sum + pos.expectedReturn, 0);
    const weightedAPY = (totalExpectedReturn / targetAllocation) * 100;
    const avgRiskScore = allocation.reduce((sum, pos) => sum + pos.riskScore * pos.weight, 0);
    
    return {
        allocation,
        totalExpectedReturn,
        weightedAPY,
        avgRiskScore,
        diversification: allocation.length,
        rebalanceNeeded: false
    };
}

/**
 * Run yield optimization for a wallet
 */
export async function runYieldOptimizer(walletAddress, config = {}) {
    console.log(`💰 Running yield optimizer for wallet: ${walletAddress}`);
    
    const startTime = Date.now();
    const results = {
        success: true,
        agentType: 'yield',
        walletAddress,
        bestAPY: 0,
        totalPools: 0,
        recommendedPools: 0,
        pnl: 0,
        optimization: null,
        executionTime: 0,
        timestamp: new Date()
    };
    
    try {
        // 1. Fetch yield data from multiple protocols
        console.log('📊 Fetching yield data from DeFi protocols...');
        
        const [aavePools, lidoPools, compoundPools, llamaPools] = await Promise.all([
            getAaveAPY(),
            getLidoAPY(),
            getCompoundAPY(),
            getDefiLlamaYields()
        ]);
        
        const allPools = [...aavePools, ...lidoPools, ...compoundPools, ...llamaPools];
        results.totalPools = allPools.length;
        
        if (allPools.length === 0) {
            throw new Error('No yield pools available');
        }
        
        // 2. Optimize yield strategy
        const optimization = optimizeYieldStrategy(allPools, config);
        results.optimization = optimization;
        results.recommendedPools = optimization.allocation.length;
        results.bestAPY = optimization.weightedAPY;
        
        // 3. Calculate potential P&L (simulate 30-day returns)
        const monthlyReturn = (optimization.totalExpectedReturn / 12); // Annual to monthly
        results.pnl = monthlyReturn;
        
        results.executionTime = Date.now() - startTime;
        
        console.log(`✅ Yield optimizer completed: ${results.bestAPY.toFixed(2)}% APY, $${results.pnl.toFixed(2)} monthly return`);
        return results;
        
    } catch (error) {
        console.error('❌ Yield optimizer execution failed:', error);
        results.success = false;
        results.error = error.message;
        results.executionTime = Date.now() - startTime;
        return results;
    }
}

/**
 * Get yield optimizer performance metrics
 */
export async function getYieldOptimizerMetrics(walletAddress, timeframe = '30d') {
    // In production, fetch from database
    return {
        currentAPY: 8.45,
        totalDeposited: 125000,
        totalEarned: 3247.89,
        activePositions: 4,
        bestPosition: {
            protocol: 'Lido',
            apy: 4.8,
            amount: 50000
        },
        rebalancesSuggested: 2,
        timeframe
    };
}

/**
 * Execute yield rebalancing
 */
export async function executeYieldRebalance(walletAddress, newAllocation) {
    console.log(`🔄 Executing yield rebalance for wallet: ${walletAddress}`);
    
    // In production, this would:
    // 1. Withdraw from current positions
    // 2. Swap tokens if needed
    // 3. Deposit into new positions
    // 4. Update database records
    
    return {
        success: true,
        transactionHashes: ['0x123...', '0x456...'],
        newPositions: newAllocation.allocation.length,
        estimatedGasCost: 0.025, // ETH
        expectedAPYImprovement: 1.2 // %
    };
}