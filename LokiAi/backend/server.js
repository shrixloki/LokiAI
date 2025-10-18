import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import multer from 'multer';
import { MongoClient } from 'mongodb';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { ethers } from 'ethers';

// Import routes
import agentsRouter from '../routes/agents.js';
import productionAgentsRouter from '../routes/production-agents.js';
import analyticsRouter from '../routes/analytics.js';
import crosschainRouter from '../routes/crosschain.js';
import activityRouter from '../routes/activity.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Socket.IO setup
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || [
            'http://localhost:5173',
            'http://localhost:5174', 
            'http://localhost:5175',
            'http://localhost:5176'
        ],
        credentials: true,
        methods: ['GET', 'POST']
    }
});

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:80'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lokiuser:%24hrishii%21okii25@loki-ai-cluster.b63sh3c.mongodb.net/?retryWrites=true&w=majority&appName=loki-ai-cluster';
const DB_NAME = 'loki_agents';
const BIOMETRICS_URL = process.env.BIOMETRICS_URL || 'http://biometrics-service:25000';

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

// Encryption utilities
function encryptData(data) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'loki-biometric-key-2025', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return { encrypted, iv: iv.toString('hex') };
}

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            backend: 'running',
            mongodb: db ? 'connected' : 'disconnected',
            biometrics: BIOMETRICS_URL
        }
    });
});

// MetaMask authentication
app.get('/api/auth/message', (req, res) => {
    const { address } = req.query;
    
    if (!address) {
        return res.status(400).json({ error: 'Wallet address required' });
    }
    
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomBytes(8).toString('hex');
    const message = `Welcome to LokiAI!\n\nSign this message to authenticate.\n\nAddress: ${address}\nTimestamp: ${timestamp}\nNonce: ${nonce}`;
    
    res.json({ message });
});

app.post('/api/auth/verify', async (req, res) => {
    const { address, signature, message } = req.body;
    
    if (!address || !signature || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    try {
        const recoveredAddress = ethers.verifyMessage(message, signature);
        
        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
            return res.status(401).json({ error: 'Invalid signature' });
        }
        
        // Store/update user in database
        const database = await connectMongoDB();
        const usersCollection = database.collection('users');
        
        await usersCollection.updateOne(
            { walletAddress: address.toLowerCase() },
            { 
                $set: { 
                    lastLogin: new Date(),
                    updatedAt: new Date()
                },
                $setOnInsert: {
                    walletAddress: address.toLowerCase(),
                    createdAt: new Date(),
                    biometricsVerified: false
                }
            },
            { upsert: true }
        );
        
        res.json({
            success: true,
            address: recoveredAddress
        });
    } catch (error) {
        console.error('❌ Signature verification failed:', error);
        res.status(401).json({ error: 'Invalid signature' });
    }
});

// Biometric endpoints - proxy to biometrics service
app.get('/api/biometrics/status', async (req, res) => {
    const { walletAddress } = req.query;
    
    if (!walletAddress) {
        return res.status(400).json({ error: 'Wallet address required' });
    }
    
    try {
        const response = await fetch(`${BIOMETRICS_URL}/api/biometrics/status?walletAddress=${walletAddress}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('❌ Biometrics status check failed:', error);
        res.status(500).json({ error: 'Failed to check biometric status' });
    }
});

app.post('/api/biometrics/keystroke/train', async (req, res) => {
    try {
        const response = await fetch(`${BIOMETRICS_URL}/api/biometrics/keystroke/train`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('❌ Keystroke training failed:', error);
        res.status(500).json({ error: 'Training failed' });
    }
});

app.post('/api/biometrics/keystroke/verify', async (req, res) => {
    try {
        const response = await fetch(`${BIOMETRICS_URL}/api/biometrics/keystroke/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('❌ Keystroke verification failed:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

app.post('/api/biometrics/voice/train', upload.any(), async (req, res) => {
    try {
        const formData = new FormData();
        formData.append('walletAddress', req.body.walletAddress);
        
        if (req.files) {
            req.files.forEach((file, index) => {
                formData.append(`sample_${index}`, new Blob([file.buffer]), file.originalname);
            });
        }
        
        const response = await fetch(`${BIOMETRICS_URL}/api/biometrics/voice/train`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('❌ Voice training failed:', error);
        res.status(500).json({ error: 'Training failed' });
    }
});

app.post('/api/biometrics/voice/verify', upload.any(), async (req, res) => {
    try {
        const formData = new FormData();
        formData.append('walletAddress', req.body.walletAddress);
        
        if (req.files && req.files.length > 0) {
            formData.append('voice_sample', new Blob([req.files[0].buffer]), req.files[0].originalname);
        }
        
        const response = await fetch(`${BIOMETRICS_URL}/api/biometrics/voice/verify`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('❌ Voice verification failed:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
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
        const transactionsCollection = database.collection('transactions');
        
        const agents = await agentsCollection.find({ walletAddress: wallet.toLowerCase() }).toArray();
        const recentTxs = await transactionsCollection
            .find({ walletAddress: wallet.toLowerCase() })
            .sort({ timestamp: -1 })
            .limit(10)
            .toArray();
        
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
            crossChainActivity: recentTxs.length,
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

// Mount route modules
app.use('/api/agents', agentsRouter);
app.use('/api/production-agents', productionAgentsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/crosschain', crosschainRouter);
app.use('/api/activity', activityRouter);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    
    // Handle wallet subscription
    socket.on('subscribe', (walletAddress) => {
        socket.join(`wallet:${walletAddress}`);
        console.log(`📡 Client subscribed to wallet: ${walletAddress}`);
    });
    
    // Handle join-wallet event (from frontend)
    socket.on('join-wallet', (walletAddress) => {
        socket.join(`wallet:${walletAddress}`);
        console.log(`📡 Client joined wallet room: ${walletAddress}`);
        
        // Send welcome message
        socket.emit('agent-update', {
            type: 'connection',
            message: 'Connected to AI Agents system',
            walletAddress,
            timestamp: new Date().toISOString()
        });
    });
    
    // Handle agent execution requests
    socket.on('run-agent', async (data) => {
        const { walletAddress, agentType, config } = data;
        console.log(`🤖 Socket request to run ${agentType} for ${walletAddress}`);
        
        try {
            // Emit start notification
            socket.emit('agent-update', {
                type: 'start',
                agentType,
                walletAddress,
                message: `Starting ${agentType}...`,
                timestamp: new Date().toISOString()
            });
            
            // Simulate agent execution (in real implementation, call actual agent)
            setTimeout(() => {
                socket.emit('agent-result', {
                    success: true,
                    agentType,
                    walletAddress,
                    result: {
                        pnl: Math.random() * 1000,
                        transactions: Math.floor(Math.random() * 5) + 1,
                        executionTime: Math.random() * 2000 + 500
                    },
                    timestamp: new Date().toISOString()
                });
            }, 2000);
            
        } catch (error) {
            socket.emit('agent-error', {
                agentType,
                walletAddress,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });
    
    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
});

// Emit updates periodically (simulated real-time updates)
setInterval(async () => {
    try {
        const database = await connectMongoDB();
        const agentsCollection = database.collection('agents');
        
        const agents = await agentsCollection.find({ status: 'active' }).toArray();
        
        agents.forEach(agent => {
            io.to(`wallet:${agent.walletAddress}`).emit('updateAgent', {
                name: agent.name,
                pnl: agent.performance?.totalPnl || 0,
                apy: agent.performance?.apy || 0,
                timestamp: new Date()
            });
        });
    } catch (error) {
        console.error('❌ Socket update failed:', error);
    }
}, 10000); // Every 10 seconds

// Start server
httpServer.listen(PORT, '0.0.0.0', async () => {
    console.log('🚀 LokiAI Production Backend Server');
    console.log(`📍 HTTP Server: http://0.0.0.0:${PORT}`);
    console.log(`📍 Socket.IO: ws://0.0.0.0:${PORT}`);
    console.log(`🔐 Biometrics Service: ${BIOMETRICS_URL}`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
    
    try {
        await connectMongoDB();
        console.log('✅ All services connected and ready');
    } catch (error) {
        console.error('❌ Service initialization failed');
    }
});
