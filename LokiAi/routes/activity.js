/**
 * Activity History API Routes
 * User activity and transaction history
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
 * GET /api/activity/history
 * Fetch activity history for a wallet
 */
router.get('/history', async (req, res) => {
    const { wallet, limit = 50, type } = req.query;
    
    console.log('📜 Activity history request for wallet:', wallet);
    
    if (!wallet) {
        return res.status(400).json({
            success: false,
            message: 'Wallet address required'
        });
    }
    
    try {
        const database = await connectMongoDB();
        const activityCollection = database.collection('activity_log');
        const transactionsCollection = database.collection('transactions');
        
        // Build query
        const query = { walletAddress: wallet.toLowerCase() };
        if (type) {
            query.type = type;
        }
        
        // Fetch activity logs
        const activities = await activityCollection
            .find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .toArray();
        
        // If no activity logs, generate from transactions
        if (activities.length === 0) {
            const transactions = await transactionsCollection
                .find({ walletAddress: wallet.toLowerCase() })
                .sort({ timestamp: -1 })
                .limit(parseInt(limit))
                .toArray();
            
            const generatedActivities = transactions.map(tx => ({
                id: tx._id,
                type: 'transaction',
                action: `${tx.fromChain} → ${tx.toChain}`,
                description: `Transferred ${tx.amount} ${tx.token}`,
                status: tx.status,
                timestamp: tx.timestamp,
                metadata: {
                    hash: tx.hash,
                    amount: tx.amount,
                    token: tx.token,
                    fromChain: tx.fromChain,
                    toChain: tx.toChain
                }
            }));
            
            console.log(`✅ Generated ${generatedActivities.length} activities from transactions`);
            
            return res.json({
                success: true,
                activities: generatedActivities,
                total: generatedActivities.length
            });
        }
        
        console.log(`✅ Found ${activities.length} activity records`);
        
        res.json({
            success: true,
            activities: activities.map(activity => ({
                id: activity._id,
                type: activity.type,
                action: activity.action,
                description: activity.description,
                status: activity.status,
                timestamp: activity.timestamp,
                metadata: activity.metadata
            })),
            total: activities.length
        });
    } catch (error) {
        console.error('❌ Failed to fetch activity history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activity history',
            error: error.message
        });
    }
});

/**
 * GET /api/activity/stats
 * Get activity statistics
 */
router.get('/stats', async (req, res) => {
    const { wallet, period = '7d' } = req.query;
    
    if (!wallet) {
        return res.status(400).json({
            success: false,
            message: 'Wallet address required'
        });
    }
    
    try {
        const database = await connectMongoDB();
        const activityCollection = database.collection('activity_log');
        const transactionsCollection = database.collection('transactions');
        
        // Calculate date range
        const periodDays = parseInt(period) || 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - periodDays);
        
        // Count activities by type
        const activityCounts = await activityCollection.aggregate([
            {
                $match: {
                    walletAddress: wallet.toLowerCase(),
                    timestamp: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]).toArray();
        
        // Count transactions
        const txCount = await transactionsCollection.countDocuments({
            walletAddress: wallet.toLowerCase(),
            timestamp: { $gte: startDate }
        });
        
        const stats = {
            period: `${periodDays}d`,
            totalActivities: activityCounts.reduce((sum, item) => sum + item.count, 0) + txCount,
            transactions: txCount,
            byType: activityCounts.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {})
        };
        
        console.log(`✅ Activity stats calculated for ${periodDays} days`);
        
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('❌ Failed to fetch activity stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activity stats',
            error: error.message
        });
    }
});

export default router;
