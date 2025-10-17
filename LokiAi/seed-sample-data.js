/**
 * Seed Sample Data for Dashboard Testing
 * 
 * This script adds sample agents and transactions to MongoDB
 * so the dashboard can display non-zero values for testing.
 * 
 * Usage: node seed-sample-data.js <wallet_address>
 * Example: node seed-sample-data.js 0x8bbfa86f2766fd05220f319a4d122c97fbc4b529
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lokiuser:%24hrishii%21okii25@loki-ai-cluster.b63sh3c.mongodb.net/?retryWrites=true&w=majority&appName=loki-ai-cluster';
const DB_NAME = 'loki_agents';

const WALLET_ADDRESS = process.argv[2] || '0x8bbfa86f2766fd05220f319a4d122c97fbc4b529';

console.log('🌱 Seeding sample data for wallet:', WALLET_ADDRESS);
console.log('');

async function seedData() {
    let client;
    
    try {
        // Connect to MongoDB
        console.log('📡 Connecting to MongoDB...');
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db(DB_NAME);
        console.log('✅ Connected to MongoDB');
        console.log('');

        // Sample Agents
        const agentsCollection = db.collection('agents');
        
        console.log('🤖 Creating sample AI agents...');
        
        const sampleAgents = [
            {
                walletAddress: WALLET_ADDRESS.toLowerCase(),
                name: 'DeFi Yield Optimizer',
                type: 'yield-optimizer',
                status: 'active',
                createdAt: new Date('2024-01-15T10:30:00Z'),
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
                walletAddress: WALLET_ADDRESS.toLowerCase(),
                name: 'Cross-Chain Arbitrage Bot',
                type: 'arbitrage',
                status: 'active',
                createdAt: new Date('2024-02-01T14:20:00Z'),
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
                walletAddress: WALLET_ADDRESS.toLowerCase(),
                name: 'Portfolio Rebalancer',
                type: 'portfolio-rebalancer',
                status: 'paused',
                createdAt: new Date('2024-01-20T09:15:00Z'),
                performance: {
                    totalPnl: 3457.22,
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

        // Insert agents
        for (const agent of sampleAgents) {
            await agentsCollection.updateOne(
                { walletAddress: agent.walletAddress, name: agent.name },
                { $set: agent },
                { upsert: true }
            );
            console.log(`  ✅ Created agent: ${agent.name} (${agent.status})`);
        }
        
        console.log('');

        // Sample Transactions
        const transactionsCollection = db.collection('transactions');
        
        console.log('🌉 Creating sample cross-chain transactions...');
        
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
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
                timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
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
                timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
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
                timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
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
                timestamp: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
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
                timestamp: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
                hash: '0x789c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c'
            }
        ];

        // Insert transactions
        for (const tx of sampleTransactions) {
            await transactionsCollection.updateOne(
                { walletAddress: tx.walletAddress, hash: tx.hash },
                { $set: tx },
                { upsert: true }
            );
            console.log(`  ✅ Created transaction: ${tx.type} (${tx.asset})`);
        }
        
        console.log('');

        // Verify data
        console.log('📊 Verifying seeded data...');
        const agentCount = await agentsCollection.countDocuments({ walletAddress: WALLET_ADDRESS.toLowerCase() });
        const activeAgentCount = await agentsCollection.countDocuments({ 
            walletAddress: WALLET_ADDRESS.toLowerCase(), 
            status: 'active' 
        });
        const txCount = await transactionsCollection.countDocuments({ 
            walletAddress: WALLET_ADDRESS.toLowerCase(),
            timestamp: { $gte: thirtyDaysAgo }
        });
        
        // Calculate total P&L
        const agents = await agentsCollection.find({ 
            walletAddress: WALLET_ADDRESS.toLowerCase() 
        }).toArray();
        const totalPnL = agents.reduce((sum, agent) => sum + (agent.performance?.totalPnl || 0), 0);
        
        console.log('');
        console.log('✅ Data seeded successfully!');
        console.log('');
        console.log('📈 Summary:');
        console.log(`  Total Agents: ${agentCount}`);
        console.log(`  Active Agents: ${activeAgentCount}`);
        console.log(`  Total P&L: $${totalPnL.toFixed(2)}`);
        console.log(`  Transactions (30d): ${txCount}`);
        console.log('');
        console.log('🎉 Your dashboard should now show:');
        console.log(`  Active Agents: ${activeAgentCount}/${agentCount}`);
        console.log(`  Total P&L: +$${totalPnL.toFixed(2)}`);
        console.log(`  Cross-Chain Activity: ${txCount}`);
        console.log('');
        console.log('🔄 Refresh your dashboard to see the updated values!');
        
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
            console.log('');
            console.log('👋 Disconnected from MongoDB');
        }
    }
}

// Run seeding
seedData();
