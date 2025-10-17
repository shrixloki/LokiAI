/**
 * Seed Sample Data to Docker MongoDB
 * 
 * This seeds data to the local Docker MongoDB container
 * 
 * Usage: node seed-docker-mongodb.js <wallet_address>
 */

import { MongoClient } from 'mongodb';

// Docker MongoDB connection
const MONGODB_URI = 'mongodb://admin:lokiai2024@localhost:27017/loki_agents?authSource=admin';
const DB_NAME = 'loki_agents';

const WALLET_ADDRESS = process.argv[2] || '0x8bbfa86f2766fd05220f319a4d122c97fbc4b529';

console.log('🐳 Seeding Docker MongoDB with sample data');
console.log(`📍 Wallet: ${WALLET_ADDRESS}`);
console.log('');

async function seedData() {
    let client;
    
    try {
        console.log('📡 Connecting to Docker MongoDB...');
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db(DB_NAME);
        console.log('✅ Connected to Docker MongoDB');
        console.log('');

        // Sample Agents
        const agentsCollection = db.collection('agents');
        
        console.log('🤖 Creating sample AI agents...');
        
        const sampleAgents = [
            {
                walletAddress: WALLET_ADDRESS.toLowerCase(),
                name: 'Cross-Chain Arbitrage Bot',
                type: 'arbitrage',
                status: 'active',
                createdAt: new Date('2025-10-12T14:15:00Z'),
                updatedAt: new Date('2025-10-13T10:30:00Z'),
                performance: {
                    totalPnl: 12488.55,
                    winRate: 92,
                    totalTrades: 47,
                    apy: 14.7
                },
                config: {
                    maxSlippage: 1.0,
                    minProfitThreshold: 1.5,
                    maxGasPrice: 75,
                    enabledStrategies: ['dex-arbitrage', 'bridge-arbitrage'],
                    riskLevel: 'high'
                },
                chains: ['Ethereum', 'Polygon', 'Avalanche']
            },
            {
                walletAddress: WALLET_ADDRESS.toLowerCase(),
                name: 'Portfolio Rebalancer',
                type: 'portfolio-rebalancer',
                status: 'active',
                createdAt: new Date('2025-10-10T09:15:00Z'),
                updatedAt: new Date('2025-10-13T10:30:00Z'),
                performance: {
                    totalPnl: 12359.67,
                    winRate: 88,
                    totalTrades: 39,
                    apy: 9.3
                },
                config: {
                    maxSlippage: 0.3,
                    minProfitThreshold: 3.0,
                    maxGasPrice: 40,
                    enabledStrategies: ['balanced-portfolio', 'risk-parity'],
                    riskLevel: 'medium'
                },
                chains: ['Ethereum', 'BSC']
            },
            {
                walletAddress: WALLET_ADDRESS.toLowerCase(),
                name: 'DeFi Yield Optimizer',
                type: 'yield-optimizer',
                status: 'paused',
                createdAt: new Date('2025-09-15T10:30:00Z'),
                updatedAt: new Date('2025-10-13T10:30:00Z'),
                performance: {
                    totalPnl: 8456.78,
                    winRate: 85.5,
                    totalTrades: 123,
                    apy: 22.4
                },
                config: {
                    maxSlippage: 0.5,
                    minProfitThreshold: 2.5,
                    maxGasPrice: 50,
                    enabledStrategies: ['compound', 'aave', 'uniswap'],
                    riskLevel: 'medium'
                },
                chains: ['Ethereum', 'Polygon', 'Arbitrum']
            }
        ];

        for (const agent of sampleAgents) {
            await agentsCollection.updateOne(
                { walletAddress: agent.walletAddress, name: agent.name },
                { $set: agent },
                { upsert: true }
            );
            console.log(`  ✅ ${agent.name} (${agent.status})`);
        }
        
        console.log('');

        // Sample Transactions
        const transactionsCollection = db.collection('transactions');
        
        console.log('🌉 Creating sample transactions...');
        
        const now = new Date();
        
        const sampleTransactions = [
            {
                walletAddress: WALLET_ADDRESS.toLowerCase(),
                type: 'agent-execution',
                status: 'confirmed',
                fromChain: 'ethereum',
                toChain: 'polygon',
                asset: 'USDC',
                amount: 5000,
                fee: 12.45,
                timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
                hash: '0x742d35cc6cd3b7a8917fe5b3b8b3c9f5d5e5d9a1',
                agentId: 'agent_1'
            },
            {
                walletAddress: WALLET_ADDRESS.toLowerCase(),
                type: 'bridge',
                status: 'confirmed',
                fromChain: 'arbitrum',
                toChain: 'ethereum',
                asset: 'ETH',
                amount: 2.5,
                fee: 0.023,
                timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
                hash: '0x892a4d3b2c1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a'
            },
            {
                walletAddress: WALLET_ADDRESS.toLowerCase(),
                type: 'swap',
                status: 'confirmed',
                fromChain: 'ethereum',
                asset: 'WBTC',
                amount: 0.5,
                fee: 0.0045,
                timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
                hash: '0x123a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a'
            },
            {
                walletAddress: WALLET_ADDRESS.toLowerCase(),
                type: 'agent-execution',
                status: 'confirmed',
                fromChain: 'polygon',
                toChain: 'arbitrum',
                asset: 'USDT',
                amount: 3000,
                fee: 8.50,
                timestamp: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
                hash: '0x456b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
                agentId: 'agent_2'
            },
            {
                walletAddress: WALLET_ADDRESS.toLowerCase(),
                type: 'bridge',
                status: 'confirmed',
                fromChain: 'ethereum',
                toChain: 'bsc',
                asset: 'DAI',
                amount: 10000,
                fee: 15.75,
                timestamp: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
                hash: '0x789c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c'
            }
        ];

        for (const tx of sampleTransactions) {
            await transactionsCollection.updateOne(
                { walletAddress: tx.walletAddress, hash: tx.hash },
                { $set: tx },
                { upsert: true }
            );
            console.log(`  ✅ ${tx.type} (${tx.asset})`);
        }
        
        console.log('');

        // Verify
        const agentCount = await agentsCollection.countDocuments({ walletAddress: WALLET_ADDRESS.toLowerCase() });
        const activeCount = await agentsCollection.countDocuments({ walletAddress: WALLET_ADDRESS.toLowerCase(), status: 'active' });
        const txCount = await transactionsCollection.countDocuments({ walletAddress: WALLET_ADDRESS.toLowerCase() });
        
        const agents = await agentsCollection.find({ walletAddress: WALLET_ADDRESS.toLowerCase() }).toArray();
        const totalPnL = agents.reduce((sum, agent) => sum + (agent.performance?.totalPnl || 0), 0);
        
        console.log('✅ Data seeded to Docker MongoDB!');
        console.log('');
        console.log('📈 Summary:');
        console.log(`  Total Agents: ${agentCount}`);
        console.log(`  Active Agents: ${activeCount}`);
        console.log(`  Total P&L: $${totalPnL.toFixed(2)}`);
        console.log(`  Transactions: ${txCount}`);
        console.log('');
        console.log('🎉 Dashboard should now show:');
        console.log(`  Active Agents: ${activeCount}/${agentCount}`);
        console.log(`  Total P&L: +$${totalPnL.toFixed(2)}`);
        console.log(`  Cross-Chain Activity: ${txCount}`);
        console.log('');
        console.log('🔄 Refresh your dashboard!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

seedData();
