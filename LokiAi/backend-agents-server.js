/**
 * LokiAI Agents Backend Server
 * Complete server with all agent functionality
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { MongoClient } from 'mongodb';
import agentsRouter from './routes/agents.js';

const app = express();
const httpServer = createServer(app);
const PORT = 5001;

// Socket.IO setup with CORS
const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:5175', 'http://localhost:5174', 'http://localhost:5173'],
        credentials: true,
        methods: ['GET', 'POST']
    }
});

// CORS configuration
app.use(cors({
    origin: ['http://localhost:5175', 'http://localhost:5174', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lokiuser:%24hrishii%21okii25@loki-ai-cluster.b63sh3c.mongodb.net/?retryWrites=true&w=majority&appName=loki-ai-cluster';
const DB_NAME = 'loki_agents';

let mongoClient = null;
let db = null;

// Initialize MongoDB
async function connectMongoDB() {
    if (db) return db;
    
    try {
        mongoClient = new MongoClient(MONGODB_URI);
        await mongoClient.connect();
        db = mongoClient.db(DB_NAME);
        console.log('✅ Connected to MongoDB');
        return db;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        throw error;
    }
}

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            backend: 'running',
            mongodb: db ? 'connected' : 'disconnected',
            agents: 'active'
        }
    });
});

// Dashboard API
app.get('/api/dashboard/summary', async (req, res) => {
    const { wallet } = req.query;
    
    if (!wallet) {
        return res.status(400).json({ error: 'Wallet address required' });
    }
    
    try {
        const database = await connectMongoDB();
        const agentsCollection = database.collection('agents');
        
        const agents = await agentsCollection.find({ walletAddress: wallet.toLowerCase() }).toArray();
        
        const totalPnL = agents.reduce((sum, agent) => sum + (agent.performance?.totalPnl || 0), 0);
        const activeAgents = agents.filter(a => a.status === 'active').length;
        
        // Mock assets data (in production, fetch from blockchain)
        const mockAssets = [
            { symbol: 'ETH', balance: 2.5, price: 2000, value: 5000, change24h: 2.5 },
            { symbol: 'USDC', balance: 10000, price: 1, value: 10000, change24h: 0.1 },
            { symbol: 'WBTC', balance: 0.5, price: 40000, value: 20000, change24h: 1.8 },
            { symbol: 'MATIC', balance: 5000, price: 0.8, value: 4000, change24h: -1.2 }
        ];
        
        res.json({
            portfolioValue: 125000,
            activeAgents,
            totalAgents: agents.length,
            totalPnL,
            crossChainActivity: 0,
            assets: mockAssets,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Dashboard summary failed:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// Attach Socket.IO to app for use in routes
app.set('io', io);

// Mount agents routes
app.use('/api/agents', agentsRouter);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    
    socket.on('subscribe', (walletAddress) => {
        socket.join(`wallet:${walletAddress}`);
        console.log(`📡 Client subscribed to wallet: ${walletAddress}`);
    });
    
    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

// 404 handler
app.use((req, res) => {
    console.log('❌ 404 - Route not found:', req.method, req.path);
    res.status(404).json({ error: 'Route not found', path: req.path, method: req.method });
});

// Start server
httpServer.listen(PORT, '0.0.0.0', async () => {
    console.log('🚀 LokiAI Agents Backend Server');
    console.log(`📍 HTTP Server: http://localhost:${PORT}`);
    console.log(`📍 Socket.IO: ws://localhost:${PORT}`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
    console.log(`🤖 Agents API: http://localhost:${PORT}/api/agents/status`);
    
    try {
        await connectMongoDB();
        console.log('✅ All services connected and ready');
    } catch (error) {
        console.error('❌ Service initialization failed:', error);
    }
});

// Emit periodic updates for demo
setInterval(async () => {
    try {
        const database = await connectMongoDB();
        const agentsCollection = database.collection('agents');
        
        const agents = await agentsCollection.find({ status: 'active' }).toArray();
        
        agents.forEach(agent => {
            // Simulate small P&L changes
            const pnlChange = (Math.random() - 0.5) * 10; // -5 to +5
            const newPnl = (agent.performance?.totalPnl || 0) + pnlChange;
            
            io.to(`wallet:${agent.walletAddress}`).emit('agent:update', {
                agentType: agent.type,
                walletAddress: agent.walletAddress,
                pnl: newPnl,
                apy: agent.performance?.apy || 0,
                timestamp: new Date()
            });
        });
    } catch (error) {
        // Ignore errors in demo updates
    }
}, 30000); // Every 30 seconds