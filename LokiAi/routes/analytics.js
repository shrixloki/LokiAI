/**
 * Analytics API Routes
 * Performance metrics and portfolio analytics
 */

import express from 'express';
import { MongoClient } from 'mongodb';

const router = express.Router();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lokiuser:%24hrishii%21okii25@loki-ai-cluster.b63sh3c.mongodb.net/?retryWrites=true&w=majority&appName=loki-ai-cluster';
const DB_NAME = 'loki_agents';

let mongoClient = null;
let db = null;

async function connectMongoDB() {
    if (db) return db;
    
    try {
        mongoClient = new MongoClient(MONGODB_URI);
        await mongoClient.connect();
        db = mongoClient.db(DB_NAME);
        return db;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        throw error;
    }
}

/**
 * GET /api/analytics/performance
 * Get portfolio performance analytics
 */
router.get('/performance', async (req, res) => {
    const { wallet, period = '30d' } = req.query;
    
    console.log('📊 Analytics performance request for wallet:', wallet);
    
    if (!wallet) {
        return res.status(400).json({
            success: false,
            message: 'Wallet address required'
        });
    }
    
    try {
        const database = await connectMongoDB();
        const portfolioCollection = database.collection('portfolio_history');
        const agentsCollection = database.collection('agents');
        
        // Calculate date range
        const periodDays = parseInt(period) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - periodDays);
        
        // Fetch portfolio history
        const portfolioHistory = await portfolioCollection
            .find({ 
                walletAddress: wallet.toLowerCase(),
                timestamp: { $gte: startDate }
            })
            .sort({ timestamp: 1 })
            .toArray();
        
        // Fetch agent performance
        const agents = await agentsCollection
            .find({ walletAddress: wallet.toLowerCase() })
            .toArray();
        
        // Calculate performance metrics
        const currentValue = portfolioHistory.length > 0 
            ? portfolioHistory[portfolioHistory.length - 1].totalValue 
            : 0;
        const initialValue = portfolioHistory.length > 0 
            ? portfolioHistory[0].totalValue 
            : currentValue;
        
        const totalReturn = currentValue - initialValue;
        const returnPercentage = initialValue > 0 
            ? ((totalReturn / initialValue) * 100).toFixed(2) 
            : 0;
        
        // Calculate agent statistics
        const agentStats = agents.map(agent => ({
            name: agent.name,
            type: agent.type,
            pnl: agent.performance?.totalPnl || 0,
            apy: agent.performance?.apy || 0,
            winRate: agent.performance?.winRate || 0,
            trades: agent.performance?.totalTrades || 0
        }));
        
        const totalPnL = agentStats.reduce((sum, agent) => sum + agent.pnl, 0);
        const avgWinRate = agentStats.length > 0
            ? agentStats.reduce((sum, agent) => sum + agent.winRate, 0) / agentStats.length
            : 0;
        
        // Generate chart data
        const chartData = portfolioHistory.map(entry => ({
            timestamp: entry.timestamp,
            value: entry.totalValue,
            pnl: entry.totalValue - initialValue
        }));
        
        console.log(`✅ Analytics calculated for ${periodDays} days`);
        
        res.json({
            success: true,
            period: `${periodDays}d`,
            performance: {
                currentValue,
                initialValue,
                totalReturn,
                returnPercentage: parseFloat(returnPercentage),
                totalPnL,
                avgWinRate: avgWinRate.toFixed(2)
            },
            agents: agentStats,
            chartData,
            summary: {
                bestPerformer: agentStats.length > 0 
                    ? agentStats.reduce((best, agent) => agent.pnl > best.pnl ? agent : best)
                    : null,
                totalTrades: agentStats.reduce((sum, agent) => sum + agent.trades, 0),
                activeAgents: agents.filter(a => a.status === 'active').length
            }
        });
    } catch (error) {
        console.error('❌ Failed to fetch analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics',
            error: error.message
        });
    }
});

/**
 * GET /api/analytics/risk
 * Get risk metrics
 */
router.get('/risk', async (req, res) => {
    const { wallet } = req.query;
    
    if (!wallet) {
        return res.status(400).json({
            success: false,
            message: 'Wallet address required'
        });
    }
    
    try {
        const database = await connectMongoDB();
        const agentsCollection = database.collection('agents');
        
        const agents = await agentsCollection
            .find({ walletAddress: wallet.toLowerCase() })
            .toArray();
        
        // Calculate risk metrics
        const riskLevels = { low: 0, medium: 0, high: 0 };
        agents.forEach(agent => {
            const level = agent.config?.riskLevel || 'medium';
            riskLevels[level]++;
        });
        
        const totalExposure = agents.reduce((sum, agent) => 
            sum + (agent.performance?.totalPnl || 0), 0);
        
        res.json({
            success: true,
            riskMetrics: {
                riskScore: 45, // 0-100 scale
                riskLevel: 'Medium',
                diversification: agents.length > 3 ? 'Good' : 'Low',
                exposure: totalExposure,
                riskDistribution: riskLevels
            }
        });
    } catch (error) {
        console.error('❌ Failed to fetch risk metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch risk metrics',
            error: error.message
        });
    }
});

export default router;
