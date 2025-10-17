import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import agentsRouter from "../routes/agents.js";
import analyticsRouter from "../routes/analytics.js";
import crosschainRouter from "../routes/crosschain.js";
import activityRouter from "../routes/activity.js";

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Socket.IO setup with CORS
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5175'],
        credentials: true
    }
});

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || [
        'http://localhost:5175',
        'http://localhost:5174',
        'http://localhost:5173',
        'http://localhost:80'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// MongoDB connection with proper error handling
mongoose.connect(process.env.MONGO_URI!)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Error", err));

// Health check endpoint
app.get("/api/health", (req, res) => {
    const services = {
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        metamask: 'available',
        biometrics: 'active',
        agents: 'running'
    };
    
    res.json({ 
        status: "ok", 
        services,
        timestamp: new Date().toISOString(),
        version: "1.0.0"
    });
});

// Dashboard API
app.get('/api/dashboard/summary', async (req, res) => {
    const { wallet } = req.query;
    
    if (!wallet) {
        return res.status(400).json({ error: 'Wallet address required' });
    }
    
    try {
        // Mock data for now - in production, fetch from blockchain
        const mockAssets = [
            { symbol: 'ETH', balance: 2.5, price: 2000, value: 5000, change24h: 2.5 },
            { symbol: 'USDC', balance: 10000, price: 1, value: 10000, change24h: 0.1 },
            { symbol: 'WBTC', balance: 0.5, price: 40000, value: 20000, change24h: 1.8 },
            { symbol: 'MATIC', balance: 5000, price: 0.8, value: 4000, change24h: -1.2 }
        ];
        
        res.json({
            portfolioValue: 125000,
            activeAgents: 2,
            totalAgents: 3,
            totalPnL: 2847.32,
            crossChainActivity: 12,
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
app.use('/api/analytics', analyticsRouter);
app.use('/api/crosschain', crosschainRouter);
app.use('/api/activity', activityRouter);

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

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
httpServer.listen(PORT, () => {
    console.log(`🚀 Backend running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🤖 Agents API: http://localhost:${PORT}/api/agents`);
    console.log(`📊 Dashboard API: http://localhost:${PORT}/api/dashboard`);
});

export default app;