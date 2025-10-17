/**
 * AI Agents Controller
 * 
 * Handles agent execution, status updates, and performance tracking
 */

import { MongoClient } from 'mongodb';
// import mongoose from 'mongoose';
// import AgentResult from '../models/AgentResult.js';
import { runArbitrageBot, getArbitrageBotMetrics } from '../services/arbitrage-execution.js';
import { runYieldOptimizer, getYieldOptimizerMetrics, executeYieldRebalance } from '../services/yield-optimizer.js';
import { runPortfolioRebalancer, getPortfolioRebalancerMetrics } from '../services/portfolio-rebalancer.js';
import { runRiskManager, getRiskManagerMetrics } from '../services/risk-manager.js';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lokiuser:%24hrishii%21okii25@loki-ai-cluster.b63sh3c.mongodb.net/?retryWrites=true&w=majority&appName=loki-ai-cluster';
const DB_NAME = 'loki_agents';

let mongoClient = null;
let db = null;

// Initialize MongoDB connection
async function connectMongoDB() {
    if (db) return db;
    
    try {
        mongoClient = new MongoClient(MONGODB_URI);
        await mongoClient.connect();
        db = mongoClient.db(DB_NAME);
        console.log('✅ Connected to MongoDB (agents controller)');
        return db;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        throw error;
    }
}

/**
 * Run a specific AI agent
 */
export async function runAgent(req, res) {
    const { agentType } = req.params;
    const { walletAddress, config = {} } = req.body;
    
    console.log(`🤖 Running agent: ${agentType} for wallet: ${walletAddress}`);
    
    if (!walletAddress) {
        return res.status(400).json({
            success: false,
            error: 'Wallet address is required'
        });
    }
    
    try {
        let result;
        
        // Execute the appropriate agent
        switch (agentType) {
            case 'arbitrage':
                result = await runArbitrageBot(walletAddress, config);
                break;
                
            case 'yield':
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
                return res.status(400).json({
                    success: false,
                    error: `Unknown agent type: ${agentType}`
                });
        }
        
        // Save execution result to database (temporarily disabled)
        // await AgentResult.saveExecution(walletAddress, agentType, result);
        
        // Update agent record in database
        await updateAgentRecord(walletAddress, agentType, result);
        
        // Emit real-time update via Socket.IO
        if (req.io) {
            req.io.to(`wallet:${walletAddress}`).emit('agent:update', {
                walletAddress,
                agentType,
                ...result
            });
        }
        
        res.json({
            success: true,
            agentType,
            walletAddress,
            ...result
        });
        
    } catch (error) {
        console.error(`❌ Agent execution failed (${agentType}):`, error);
        res.status(500).json({
            success: false,
            error: 'Agent execution failed',
            message: error.message
        });
    }
}

/**
 * Get agent status and performance
 */
export async function getAgentStatus(req, res) {
    const { wallet } = req.query;
    
    if (!wallet) {
        return res.status(400).json({
            success: false,
            error: 'Wallet address is required'
        });
    }
    
    try {
        const database = await connectMongoDB();
        const agentsCollection = database.collection('agents');
        
        // Fetch all agents for this wallet
        const agents = await agentsCollection.find({ 
            walletAddress: wallet.toLowerCase() 
        }).toArray();
        
        // If no agents exist, create default ones
        if (agents.length === 0) {
            await createDefaultAgents(wallet.toLowerCase());
            const newAgents = await agentsCollection.find({ 
                walletAddress: wallet.toLowerCase() 
            }).toArray();
            
            const formattedAgents = formatAgentsForFrontend(newAgents);
            return res.json({
                success: true,
                agents: formattedAgents
            });
        }
        
        const formattedAgents = formatAgentsForFrontend(agents);
        
        res.json({
            success: true,
            agents: formattedAgents
        });
        
    } catch (error) {
        console.error('❌ Get agent status failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch agent status',
            message: error.message
        });
    }
}

/**
 * Update agent performance
 */
export async function updateAgentPerformance(req, res) {
    const { wallet, agentName, performance } = req.body;
    
    if (!wallet || !agentName || !performance) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields'
        });
    }
    
    try {
        const database = await connectMongoDB();
        const agentsCollection = database.collection('agents');
        
        await agentsCollection.updateOne(
            { 
                walletAddress: wallet.toLowerCase(),
                name: agentName
            },
            {
                $set: {
                    'performance.totalPnl': performance.pnl,
                    'performance.apy': performance.apy,
                    'performance.winRate': performance.winRate,
                    'performance.totalTrades': performance.trades,
                    status: 'active',
                    lastRun: new Date(),
                    updatedAt: new Date()
                }
            }
        );
        
        res.json({
            success: true,
            message: 'Agent performance updated'
        });
        
    } catch (error) {
        console.error('❌ Update agent performance failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update agent performance',
            message: error.message
        });
    }
}

/**
 * Create or update agent configuration
 */
export async function configureAgent(req, res) {
    const { walletAddress, agentType, config } = req.body;
    
    if (!walletAddress || !agentType) {
        return res.status(400).json({
            success: false,
            error: 'Wallet address and agent type are required'
        });
    }
    
    try {
        const database = await connectMongoDB();
        const agentsCollection = database.collection('agents');
        
        const agentName = `${agentType.charAt(0).toUpperCase() + agentType.slice(1)} Bot`;
        
        await agentsCollection.updateOne(
            { 
                walletAddress: walletAddress.toLowerCase(),
                type: agentType
            },
            {
                $set: {
                    name: agentName,
                    config: config || {},
                    updatedAt: new Date()
                },
                $setOnInsert: {
                    walletAddress: walletAddress.toLowerCase(),
                    type: agentType,
                    status: 'active',
                    createdAt: new Date(),
                    performance: {
                        totalPnl: 0,
                        apy: 0,
                        winRate: 0,
                        totalTrades: 0
                    },
                    chains: getDefaultChains(agentType)
                }
            },
            { upsert: true }
        );
        
        res.json({
            success: true,
            message: 'Agent configured successfully'
        });
        
    } catch (error) {
        console.error('❌ Configure agent failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to configure agent',
            message: error.message
        });
    }
}

/**
 * Toggle agent status (start/stop)
 */
export async function toggleAgent(req, res) {
    const { walletAddress, agentType, status } = req.body;
    
    if (!walletAddress || !agentType || !status) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields'
        });
    }
    
    try {
        const database = await connectMongoDB();
        const agentsCollection = database.collection('agents');
        
        await agentsCollection.updateOne(
            { 
                walletAddress: walletAddress.toLowerCase(),
                type: agentType
            },
            {
                $set: {
                    status: status,
                    updatedAt: new Date()
                }
            }
        );
        
        res.json({
            success: true,
            message: `Agent ${status} successfully`
        });
        
    } catch (error) {
        console.error('❌ Toggle agent failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to toggle agent',
            message: error.message
        });
    }
}

/**
 * Helper: Update agent record after execution
 */
async function updateAgentRecord(walletAddress, agentType, executionResult) {
    try {
        const database = await connectMongoDB();
        const agentsCollection = database.collection('agents');
        
        const updateData = {
            lastRun: new Date(),
            updatedAt: new Date(),
            status: executionResult.success ? 'active' : 'error'
        };
        
        if (executionResult.success) {
            updateData['performance.totalPnl'] = executionResult.pnl || 0;
            updateData['performance.totalTrades'] = executionResult.transactions || 0;
            
            if (agentType === 'yield' || agentType === 'yield-optimizer') {
                updateData['performance.apy'] = executionResult.bestAPY || 0;
            }
            
            if (agentType === 'arbitrage') {
                updateData['performance.opportunities'] = executionResult.opportunities || 0;
            }
        }
        
        await agentsCollection.updateOne(
            { 
                walletAddress: walletAddress.toLowerCase(),
                type: agentType
            },
            { $set: updateData },
            { upsert: true }
        );
        
        console.log(`✅ Updated agent record: ${agentType} for ${walletAddress}`);
        
    } catch (error) {
        console.error('❌ Failed to update agent record:', error);
    }
}

/**
 * Helper: Create default agents for new wallet
 */
async function createDefaultAgents(walletAddress) {
    try {
        const database = await connectMongoDB();
        const agentsCollection = database.collection('agents');
        
        const defaultAgents = [
            {
                walletAddress,
                name: 'Arbitrage Bot',
                type: 'arbitrage',
                status: 'active',
                performance: {
                    totalPnl: 0,
                    apy: 0,
                    winRate: 0,
                    totalTrades: 0
                },
                chains: ['ethereum', 'polygon', 'bsc'],
                config: {
                    maxSlippage: 0.5,
                    minProfitThreshold: 0.5,
                    maxGasPrice: 100,
                    riskLevel: 'medium'
                },
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                walletAddress,
                name: 'Yield Optimizer',
                type: 'yield-optimizer',
                status: 'active',
                performance: {
                    totalPnl: 0,
                    apy: 0,
                    winRate: 0,
                    totalTrades: 0
                },
                chains: ['ethereum', 'polygon'],
                config: {
                    riskTolerance: 'medium',
                    minAPY: 2.0,
                    maxRiskScore: 3,
                    riskLevel: 'medium'
                },
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                walletAddress,
                name: 'Portfolio Rebalancer',
                type: 'portfolio-rebalancer',
                status: 'active',
                performance: {
                    totalPnl: 0,
                    apy: 0,
                    winRate: 0,
                    totalTrades: 0
                },
                chains: ['ethereum'],
                config: {
                    rebalanceThreshold: 5.0,
                    maxPositionSize: 25.0,
                    riskLevel: 'medium'
                },
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                walletAddress,
                name: 'Risk Manager',
                type: 'risk-manager',
                status: 'active',
                performance: {
                    totalPnl: 0,
                    apy: 0,
                    winRate: 0,
                    totalTrades: 0
                },
                chains: ['ethereum', 'polygon', 'arbitrum'],
                config: {
                    maxVolatility: 30.0,
                    stopLossThreshold: 15.0,
                    riskLevel: 'medium'
                },
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        
        await agentsCollection.insertMany(defaultAgents);
        console.log(`✅ Created default agents for wallet: ${walletAddress}`);
        
    } catch (error) {
        console.error('❌ Failed to create default agents:', error);
    }
}

/**
 * Helper: Format agents for frontend
 */
function formatAgentsForFrontend(agents) {
    return agents.map(agent => ({
        name: agent.name,
        type: agent.type,
        apy: agent.performance?.apy || 0,
        pnl: agent.performance?.totalPnl || 0,
        winRate: agent.performance?.winRate || 0,
        trades: agent.performance?.totalTrades || 0,
        status: agent.status || 'active',
        chains: agent.chains || [],
        lastUpdated: agent.updatedAt || agent.createdAt,
        config: agent.config || {}
    }));
}

/**
 * Helper: Get default chains for agent type
 */
function getDefaultChains(agentType) {
    switch (agentType) {
        case 'arbitrage':
            return ['ethereum', 'polygon', 'bsc'];
        case 'yield-optimizer':
            return ['ethereum', 'polygon'];
        case 'portfolio-rebalancer':
            return ['ethereum'];
        case 'risk-manager':
            return ['ethereum', 'polygon', 'arbitrum'];
        default:
            return ['ethereum'];
    }
}