/**
 * Cross-Chain Activity API Routes
 * Real-time cross-chain transaction tracking
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
 * GET /api/crosschain/activity
 * Fetch cross-chain activity for a wallet
 */
router.get('/activity', async (req, res) => {
    const { wallet } = req.query;
    
    console.log('🌉 Cross-chain activity request for wallet:', wallet);
    
    if (!wallet) {
        return res.status(400).json({
            success: false,
            message: 'Wallet address required'
        });
    }
    
    try {
        const database = await connectMongoDB();
        const transactionsCollection = database.collection('transactions');
        
        // Fetch recent cross-chain transactions
        const transactions = await transactionsCollection
            .find({ walletAddress: wallet.toLowerCase() })
            .sort({ timestamp: -1 })
            .limit(50)
            .toArray();
        
        // Calculate statistics
        const totalVolume = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        const uniqueChains = [...new Set(transactions.flatMap(tx => [tx.fromChain, tx.toChain]))];
        const successRate = transactions.length > 0 
            ? (transactions.filter(tx => tx.status === 'completed').length / transactions.length) * 100 
            : 0;
        
        // Group by chain
        const chainActivity = {};
        transactions.forEach(tx => {
            const chain = tx.fromChain || 'Unknown';
            if (!chainActivity[chain]) {
                chainActivity[chain] = { count: 0, volume: 0 };
            }
            chainActivity[chain].count++;
            chainActivity[chain].volume += tx.amount || 0;
        });
        
        console.log(`✅ Found ${transactions.length} cross-chain transactions`);
        
        res.json({
            success: true,
            transactions: transactions.map(tx => ({
                id: tx._id,
                hash: tx.hash,
                fromChain: tx.fromChain,
                toChain: tx.toChain,
                amount: tx.amount,
                token: tx.token,
                status: tx.status,
                timestamp: tx.timestamp,
                fee: tx.fee
            })),
            stats: {
                totalTransactions: transactions.length,
                totalVolume,
                uniqueChains: uniqueChains.length,
                successRate: successRate.toFixed(2),
                chainActivity
            }
        });
    } catch (error) {
        console.error('❌ Failed to fetch cross-chain activity:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch cross-chain activity',
            error: error.message
        });
    }
});

/**
 * GET /api/crosschain/bridges
 * Get available bridge protocols
 */
router.get('/bridges', async (req, res) => {
    const bridges = [
        {
            id: 'stargate',
            name: 'Stargate Finance',
            chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'BSC'],
            fee: '0.1%',
            speed: 'Fast',
            tvl: '$1.2B'
        },
        {
            id: 'hop',
            name: 'Hop Protocol',
            chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism'],
            fee: '0.04%',
            speed: 'Fast',
            tvl: '$450M'
        },
        {
            id: 'across',
            name: 'Across Protocol',
            chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism'],
            fee: '0.05%',
            speed: 'Very Fast',
            tvl: '$320M'
        }
    ];
    
    res.json({
        success: true,
        bridges
    });
});

export default router;
