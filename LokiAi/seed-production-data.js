import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:lokiai2024@localhost:27017/loki_agents?authSource=admin';
const DB_NAME = 'loki_agents';

async function seedDatabase() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db(DB_NAME);
        
        // Sample wallet address
        const sampleWallet = '0x742d35cc6634c0532925a3b844bc9e7595f0beb1';
        
        // Seed AI Agents
        const agentsCollection = db.collection('agents');
        await agentsCollection.deleteMany({ walletAddress: sampleWallet });
        
        const agents = [
            {
                walletAddress: sampleWallet,
                name: 'DeFi Yield Optimizer',
                type: 'yield',
                status: 'active',
                chains: ['Ethereum', 'Polygon', 'Arbitrum'],
                performance: {
                    apy: 18.5,
                    totalPnl: 2450.75,
                    winRate: 87.3,
                    totalTrades: 156
                },
                config: {
                    riskLevel: 'medium',
                    autoCompound: true,
                    minAPY: 10
                },
                createdAt: new Date('2024-01-15'),
                updatedAt: new Date()
            },
            {
                walletAddress: sampleWallet,
                name: 'Cross-Chain Arbitrage Bot',
                type: 'arbitrage',
                status: 'active',
                chains: ['Ethereum', 'BSC', 'Polygon'],
                performance: {
                    apy: 24.2,
                    totalPnl: 3890.50,
                    winRate: 92.1,
                    totalTrades: 243
                },
                config: {
                    riskLevel: 'high',
                    minSpread: 0.5,
                    maxSlippage: 1.0
                },
                createdAt: new Date('2024-02-01'),
                updatedAt: new Date()
            },
            {
                walletAddress: sampleWallet,
                name: 'Portfolio Rebalancer',
                type: 'rebalancer',
                status: 'active',
                chains: ['Ethereum', 'Polygon'],
                performance: {
                    apy: 12.8,
                    totalPnl: 1567.25,
                    winRate: 78.5,
                    totalTrades: 89
                },
                config: {
                    riskLevel: 'low',
                    rebalanceInterval: '7d',
                    targetAllocation: { BTC: 40, ETH: 40, USDC: 20 }
                },
                createdAt: new Date('2024-01-20'),
                updatedAt: new Date()
            },
            {
                walletAddress: sampleWallet,
                name: 'Risk Manager',
                type: 'risk',
                status: 'active',
                chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism'],
                performance: {
                    apy: 8.5,
                    totalPnl: 890.00,
                    winRate: 95.2,
                    totalTrades: 67
                },
                config: {
                    riskLevel: 'low',
                    stopLoss: 5,
                    takeProfit: 15
                },
                createdAt: new Date('2024-02-10'),
                updatedAt: new Date()
            }
        ];
        
        await agentsCollection.insertMany(agents);
        console.log(`✅ Seeded ${agents.length} AI agents`);
        
        // Seed Transactions
        const transactionsCollection = db.collection('transactions');
        await transactionsCollection.deleteMany({ walletAddress: sampleWallet });
        
        const transactions = [];
        const chains = ['Ethereum', 'Polygon', 'Arbitrum', 'BSC', 'Optimism'];
        const tokens = ['ETH', 'USDC', 'USDT', 'DAI', 'WBTC'];
        const statuses = ['completed', 'completed', 'completed', 'pending', 'failed'];
        
        for (let i = 0; i < 50; i++) {
            const fromChain = chains[Math.floor(Math.random() * chains.length)];
            let toChain = chains[Math.floor(Math.random() * chains.length)];
            while (toChain === fromChain) {
                toChain = chains[Math.floor(Math.random() * chains.length)];
            }
            
            transactions.push({
                walletAddress: sampleWallet,
                hash: '0x' + Math.random().toString(16).substr(2, 64),
                fromChain,
                toChain,
                token: tokens[Math.floor(Math.random() * tokens.length)],
                amount: parseFloat((Math.random() * 1000 + 100).toFixed(2)),
                fee: parseFloat((Math.random() * 10 + 1).toFixed(4)),
                status: statuses[Math.floor(Math.random() * statuses.length)],
                timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
            });
        }
        
        await transactionsCollection.insertMany(transactions);
        console.log(`✅ Seeded ${transactions.length} transactions`);
        
        // Seed Portfolio History
        const portfolioCollection = db.collection('portfolio_history');
        await portfolioCollection.deleteMany({ walletAddress: sampleWallet });
        
        const portfolioHistory = [];
        let baseValue = 100000;
        
        for (let i = 30; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            const dailyChange = (Math.random() - 0.45) * 2000;
            baseValue += dailyChange;
            
            portfolioHistory.push({
                walletAddress: sampleWallet,
                totalValue: parseFloat(baseValue.toFixed(2)),
                timestamp: date
            });
        }
        
        await portfolioCollection.insertMany(portfolioHistory);
        console.log(`✅ Seeded ${portfolioHistory.length} portfolio history entries`);
        
        // Seed Activity Log
        const activityCollection = db.collection('activity_log');
        await activityCollection.deleteMany({ walletAddress: sampleWallet });
        
        const activities = [
            {
                walletAddress: sampleWallet,
                type: 'agent_deployed',
                action: 'Agent Deployed',
                description: 'DeFi Yield Optimizer deployed on Ethereum',
                status: 'success',
                timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
                metadata: { agentName: 'DeFi Yield Optimizer', chain: 'Ethereum' }
            },
            {
                walletAddress: sampleWallet,
                type: 'trade_executed',
                action: 'Trade Executed',
                description: 'Arbitrage opportunity executed: ETH/USDC',
                status: 'success',
                timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
                metadata: { pair: 'ETH/USDC', profit: 45.50 }
            },
            {
                walletAddress: sampleWallet,
                type: 'rebalance',
                action: 'Portfolio Rebalanced',
                description: 'Portfolio rebalanced according to target allocation',
                status: 'success',
                timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                metadata: { changes: { BTC: '+2%', ETH: '-1%', USDC: '-1%' } }
            }
        ];
        
        await activityCollection.insertMany(activities);
        console.log(`✅ Seeded ${activities.length} activity log entries`);
        
        console.log('\n✅ Database seeding completed successfully!');
        console.log(`📊 Sample wallet: ${sampleWallet}`);
        
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await client.close();
    }
}

seedDatabase();
