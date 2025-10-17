// Quick seed script that works with Docker MongoDB
import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb://admin:lokiai2024@localhost:27017/loki_agents?authSource=admin';
const sampleWallet = '0x742d35cc6634c0532925a3b844bc9e7595f0beb1';

async function seedData() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db('loki_agents');
        const agentsCollection = db.collection('agents');
        
        // Clear existing data
        await agentsCollection.deleteMany({ walletAddress: sampleWallet });
        
        // Seed 4 AI agents
        const agents = [
            {
                walletAddress: sampleWallet,
                name: 'DeFi Yield Optimizer',
                type: 'yield',
                status: 'active',
                chains: ['Ethereum', 'Polygon', 'Arbitrum'],
                performance: { apy: 18.5, totalPnl: 2450.75, winRate: 87.3, totalTrades: 156 },
                config: { riskLevel: 'medium', autoCompound: true, minAPY: 10 },
                createdAt: new Date('2024-01-15'),
                updatedAt: new Date()
            },
            {
                walletAddress: sampleWallet,
                name: 'Cross-Chain Arbitrage Bot',
                type: 'arbitrage',
                status: 'active',
                chains: ['Ethereum', 'BSC', 'Polygon'],
                performance: { apy: 24.2, totalPnl: 3890.50, winRate: 92.1, totalTrades: 243 },
                config: { riskLevel: 'high', minSpread: 0.5, maxSlippage: 1.0 },
                createdAt: new Date('2024-02-01'),
                updatedAt: new Date()
            },
            {
                walletAddress: sampleWallet,
                name: 'Portfolio Rebalancer',
                type: 'rebalancer',
                status: 'active',
                chains: ['Ethereum', 'Polygon'],
                performance: { apy: 12.8, totalPnl: 1567.25, winRate: 78.5, totalTrades: 89 },
                config: { riskLevel: 'low', rebalanceInterval: '7d' },
                createdAt: new Date('2024-01-20'),
                updatedAt: new Date()
            },
            {
                walletAddress: sampleWallet,
                name: 'Risk Manager',
                type: 'risk',
                status: 'active',
                chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism'],
                performance: { apy: 8.5, totalPnl: 890.00, winRate: 95.2, totalTrades: 67 },
                config: { riskLevel: 'low', stopLoss: 5, takeProfit: 15 },
                createdAt: new Date('2024-02-10'),
                updatedAt: new Date()
            }
        ];
        
        await agentsCollection.insertMany(agents);
        console.log(`✅ Seeded ${agents.length} AI agents`);
        console.log(`📊 Sample wallet: ${sampleWallet}`);
        
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await client.close();
    }
}

seedData();
