/**
 * AI Agents Socket Service
 * 
 * Real-time WebSocket server for AI agent updates
 */

import { Server } from "socket.io";
import http from "http";
import express from "express";
import cors from "cors";
import { runArbitrageBot } from './backend/services/arbitrage-execution.js';
import { runYieldOptimizer } from './backend/services/yield-optimizer.js';
import { runPortfolioRebalancer } from './backend/services/portfolio-rebalancer.js';
import { runRiskManager } from './backend/services/risk-manager.js';

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5175", "http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'ai-agents-socket',
        timestamp: new Date().toISOString()
    });
});

// Agent execution endpoint
app.post('/run-agent', async (req, res) => {
    const { walletAddress, agentType, config = {} } = req.body;
    
    if (!walletAddress || !agentType) {
        return res.status(400).json({
            success: false,
            error: 'Missing walletAddress or agentType'
        });
    }
    
    try {
        console.log(`🤖 Running ${agentType} agent for wallet: ${walletAddress}`);
        
        let result;
        
        switch (agentType) {
            case 'arbitrage':
                result = await runArbitrageBot(walletAddress, config);
                break;
            case 'yield-optimizer':
                result = await runYieldOptimizer(walletAddress, config);
                break;
            case 'portfolio-rebalancer':
                result = await runPortfolioRebalancer(walletAddress, config);
                break;
            case 'risk-manager':
                result = await runRiskManager(walletAddress, config);
                break;
            default:
                throw new Error(`Unknown agent type: ${agentType}`);
        }
        
        // Emit real-time update to all connected clients
        io.emit('agent-update', {
            walletAddress,
            agentType,
            ...result,
            timestamp: new Date().toISOString()
        });
        
        res.json({
            success: true,
            agentType,
            walletAddress,
            ...result
        });
        
    } catch (error) {
        console.error(`❌ Agent execution failed (${agentType}):`, error);
        
        // Emit error update
        io.emit('agent-error', {
            walletAddress,
            agentType,
            error: error.message,
            timestamp: new Date().toISOString()
        });
        
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
    console.log("⚡ Client connected to AI Agent socket:", socket.id);
    
    // Join wallet-specific room
    socket.on("join-wallet", (walletAddress) => {
        socket.join(`wallet:${walletAddress}`);
        console.log(`👛 Socket ${socket.id} joined wallet room: ${walletAddress}`);
    });
    
    // Handle agent execution requests via socket
    socket.on("run-agent", async (payload) => {
        const { walletAddress, agentType, config = {} } = payload;
        
        try {
            console.log(`🚀 Socket request: Running ${agentType} for ${walletAddress}`);
            
            let result;
            
            switch (agentType) {
                case 'arbitrage':
                    result = await runArbitrageBot(walletAddress, config);
                    break;
                case 'yield-optimizer':
                    result = await runYieldOptimizer(walletAddress, config);
                    break;
                case 'portfolio-rebalancer':
                    result = await runPortfolioRebalancer(walletAddress, config);
                    break;
                case 'risk-manager':
                    result = await runRiskManager(walletAddress, config);
                    break;
                default:
                    throw new Error(`Unknown agent type: ${agentType}`);
            }
            
            // Emit to wallet-specific room
            io.to(`wallet:${walletAddress}`).emit("agent-update", {
                walletAddress,
                agentType,
                ...result,
                timestamp: new Date().toISOString()
            });
            
            // Also emit to the requesting socket
            socket.emit("agent-result", {
                success: true,
                agentType,
                walletAddress,
                ...result
            });
            
        } catch (error) {
            console.error(`❌ Socket agent execution failed:`, error);
            
            socket.emit("agent-error", {
                success: false,
                agentType,
                walletAddress,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });
    
    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("🔌 Client disconnected:", socket.id);
    });
});

// Start the server
const PORT = process.env.SOCKET_PORT || 5050;

server.listen(PORT, () => {
    console.log(`🤖 AI Agent Socket Server running on port ${PORT}`);
    console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
    console.log(`🌐 HTTP endpoint: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Shutting down AI Agent Socket Server...');
    server.close(() => {
        console.log('✅ AI Agent Socket Server closed');
        process.exit(0);
    });
});

export default app;