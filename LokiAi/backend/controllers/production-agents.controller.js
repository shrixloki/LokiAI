/**
 * Production Agents Controller - Only 4 Production-Level AI Agents
 * 
 * Handles only the most powerful, production-ready agents:
 * 1. Arbitrage Bot (LSTM-based)
 * 2. Yield Optimizer (DQN-based)
 * 3. Risk Manager (Advanced blockchain analysis)
 * 4. Portfolio Rebalancer (Python-based)
 */

import { MongoClient } from 'mongodb';
import productionAgentOrchestrator from '../services/production-agent-orchestrator.js';

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
        console.log('✅ Connected to MongoDB (production agents controller)');
        return db;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        throw error;
    }
}

/**
 * Start the production agent orchestrator
 */
export async function startProductionAgents(req, res) {
    try {
        if (!productionAgentOrchestrator.isRunning) {
            await productionAgentOrchestrator.start();
            
            res.json({
                success: true,
                message: 'Production agents started successfully',
                agents: productionAgentOrchestrator.getAgentStatus().agents,
                timestamp: new Date()
            });
        } else {
            res.json({
                success: true,
                message: 'Production agents already running',
                agents: productionAgentOrchestrator.getAgentStatus().agents
            });
        }
    } catch (error) {
        console.error('❌ Failed to start production agents:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start production agents',
            message: error.message
        });
    }
}

/**
 * Stop the production agent orchestrator
 */
export async function stopProductionAgents(req, res) {
    try {
        await productionAgentOrchestrator.stop();
        
        res.json({
            success: true,
            message: 'Production agents stopped successfully',
            timestamp: new Date()
        });
    } catch (error) {
        console.error('❌ Failed to stop production agents:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to stop production agents',
            message: error.message
        });
    }
}

/**
 * Get production agent status and performance
 */
export async function getProductionAgentStatus(req, res) {
    const { wallet } = req.query;
    
    try {
        // Get orchestrator status
        const orchestratorStatus = productionAgentOrchestrator.getAgentStatus();
        
        // Get wallet-specific agent data from database
        let walletAgents = [];
        if (wallet) {
            const database = await connectMongoDB();
            const agentsCollection = database.collection('production_agents');
            
            walletAgents = await agentsCollection.find({ 
                walletAddress: wallet.toLowerCase() 
            }).toArray();
            
            // If no agents exist for this wallet, create them
            if (walletAgents.length === 0) {
                await createProductionAgentsForWallet(wallet.toLowerCase());
                walletAgents = await agentsCollection.find({ 
                    walletAddress: wallet.toLowerCase() 
                }).toArray();
            }
        }
        
        res.json({
            success: true,
            orchestrator: orchestratorStatus,
            walletAgents: formatAgentsForFrontend(walletAgents),
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('❌ Get production agent status failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch production agent status',
            message: error.message
        });
    }
}

/**
 * Execute a specific production agent
 */
export async function executeProductionAgent(req, res) {
    const { agentType } = req.params;
    const { walletAddress, config = {} } = req.body;
    
    console.log(`🚀 Executing production agent: ${agentType} for wallet: ${walletAddress}`);
    
    if (!walletAddress) {
        return res.status(400).json({
            success: false,
            error: 'Wallet address is required'
        });
    }
    
    // Validate agent type (only 4 production agents allowed)
    const validAgentTypes = ['arbitrage', 'yield', 'risk', 'rebalancer'];
    if (!validAgentTypes.includes(agentType)) {
        return res.status(400).json({
            success: false,
            error: `Invalid agent type. Only these production agents are available: ${validAgentTypes.join(', ')}`
        });
    }
    
    try {
        // Start orchestrator if not running
        if (!productionAgentOrchestrator.isRunning) {
            await productionAgentOrchestrator.start();
        }
        
        // Force execution of specific agent
        const result = await forceExecuteAgent(agentType, walletAddress, config);
        
        // Update database record
        await updateProductionAgentRecord(walletAddress, agentType, result);
        
        // Emit real-time update via Socket.IO
        if (req.io) {
            req.io.to(`wallet:${walletAddress}`).emit('productionAgent:update', {
                walletAddress,
                agentType,
                ...result,
                timestamp: new Date()
            });
        }
        
        res.json({
            success: true,
            agentType,
            walletAddress,
            ...result,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error(`❌ Production agent execution failed (${agentType}):`, error);
        res.status(500).json({
            success: false,
            error: 'Production agent execution failed',
            message: error.message,
            agentType
        });
    }
}

/**
 * Get production agent performance metrics
 */
export async function getProductionAgentMetrics(req, res) {
    const { agentType, wallet, timeframe = '24h' } = req.query;
    
    try {
        const database = await connectMongoDB();
        const metricsCollection = database.collection('agent_metrics');
        
        // Build query
        const query = {};
        if (agentType) query.agentType = agentType;
        if (wallet) query.walletAddress = wallet.toLowerCase();
        
        // Get time range
        const timeRanges = {
            '1h': 1 * 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000
        };
        
        const timeRange = timeRanges[timeframe] || timeRanges['24h'];
        const startTime = new Date(Date.now() - timeRange);
        
        query.timestamp = { $gte: startTime };
        
        // Fetch metrics
        const metrics = await metricsCollection.find(query)
            .sort({ timestamp: -1 })
            .limit(100)
            .toArray();
        
        // Calculate aggregated metrics
        const aggregatedMetrics = calculateAggregatedMetrics(metrics);
        
        res.json({
            success: true,
            timeframe,
            aggregatedMetrics,
            detailedMetrics: metrics,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('❌ Get production agent metrics failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch production agent metrics',
            message: error.message
        });
    }
}

/**
 * Configure production agent
 */
export async function configureProductionAgent(req, res) {
    const { walletAddress, agentType, config } = req.body;
    
    if (!walletAddress || !agentType) {
        return res.status(400).json({
            success: false,
            error: 'Wallet address and agent type are required'
        });
    }
    
    // Validate agent type
    const validAgentTypes = ['arbitrage', 'yield', 'risk', 'rebalancer'];
    if (!validAgentTypes.includes(agentType)) {
        return res.status(400).json({
            success: false,
            error: `Invalid agent type. Only these production agents are available: ${validAgentTypes.join(', ')}`
        });
    }
    
    try {
        const database = await connectMongoDB();
        const agentsCollection = database.collection('production_agents');
        
        const agentName = getProductionAgentName(agentType);
        
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
                }
            },
            { upsert: false } // Don't create if doesn't exist
        );
        
        res.json({
            success: true,
            message: `${agentName} configured successfully`,
            agentType,
            config
        });
        
    } catch (error) {
        console.error('❌ Configure production agent failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to configure production agent',
            message: error.message
        });
    }
}

/**
 * Toggle production agent status
 */
export async function toggleProductionAgent(req, res) {
    const { walletAddress, agentType, status } = req.body;
    
    if (!walletAddress || !agentType || !status) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields'
        });
    }
    
    // Validate agent type
    const validAgentTypes = ['arbitrage', 'yield', 'risk', 'rebalancer'];
    if (!validAgentTypes.includes(agentType)) {
        return res.status(400).json({
            success: false,
            error: `Invalid agent type. Only these production agents are available: ${validAgentTypes.join(', ')}`
        });
    }
    
    try {
        const database = await connectMongoDB();
        const agentsCollection = database.collection('production_agents');
        
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
        
        const agentName = getProductionAgentName(agentType);
        
        res.json({
            success: true,
            message: `${agentName} ${status} successfully`,
            agentType,
            status
        });
        
    } catch (error) {
        console.error('❌ Toggle production agent failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to toggle production agent',
            message: error.message
        });
    }
}

/**
 * Force execute a specific agent (bypassing orchestrator schedule)
 */
async function forceExecuteAgent(agentType, walletAddress, config) {
    const agent = productionAgentOrchestrator.agents.get(agentType);
    
    if (!agent) {
        throw new Error(`Production agent ${agentType} not found`);
    }
    
    // Force execution by setting next execution to now
    agent.nextExecution = Date.now();
    
    // Execute the agent
    await productionAgentOrchestrator.executeAgent(agentType);
    
    // Return the latest performance data
    return {
        success: true,
        agentType,
        performance: agent.performance,
        lastExecution: agent.lastExecution,
        status: agent.status
    };
}

/**
 * Update production agent record after execution
 */
async function updateProductionAgentRecord(walletAddress, agentType, executionResult) {
    try {
        const database = await connectMongoDB();
        const agentsCollection = database.collection('production_agents');
        const metricsCollection = database.collection('agent_metrics');
        
        const updateData = {
            lastRun: new Date(),
            updatedAt: new Date(),
            status: executionResult.success ? 'active' : 'error'
        };
        
        if (executionResult.success && executionResult.performance) {
            updateData['performance.totalPnl'] = executionResult.performance.totalProfit || 0;
            updateData['performance.totalTrades'] = executionResult.performance.totalTrades || 0;
            updateData['performance.successRate'] = executionResult.performance.successfulTrades / Math.max(1, executionResult.performance.totalTrades) * 100;
            updateData['performance.averageProfit'] = executionResult.performance.averageProfit || 0;
        }
        
        // Update agent record
        await agentsCollection.updateOne(
            { 
                walletAddress: walletAddress.toLowerCase(),
                type: agentType
            },
            { $set: updateData },
            { upsert: false }
        );
        
        // Save metrics for historical tracking
        await metricsCollection.insertOne({
            walletAddress: walletAddress.toLowerCase(),
            agentType,
            timestamp: new Date(),
            profit: executionResult.performance?.lastProfit || 0,
            success: executionResult.success,
            executionTime: executionResult.executionTime || 0,
            ...executionResult
        });
        
        console.log(`✅ Updated production agent record: ${agentType} for ${walletAddress}`);
        
    } catch (error) {
        console.error('❌ Failed to update production agent record:', error);
    }
}

/**
 * Create production agents for new wallet
 */
async function createProductionAgentsForWallet(walletAddress) {
    try {
        const database = await connectMongoDB();
        const agentsCollection = database.collection('production_agents');
        
        const productionAgents = [
            {
                walletAddress,
                name: 'Arbitrage Bot',
                type: 'arbitrage',
                description: 'LSTM-based cross-exchange arbitrage detection',
                status: 'active',
                performance: {
                    totalPnl: 0,
                    apy: 0,
                    successRate: 0,
                    totalTrades: 0,
                    averageProfit: 0
                },
                chains: ['ethereum', 'polygon', 'bsc', 'arbitrum'],
                config: {
                    minProfitThreshold: 0.5,
                    maxSlippage: 2.0,
                    maxGasPrice: 100,
                    riskLevel: 'medium',
                    autoExecute: true
                },
                features: [
                    'LSTM Neural Networks',
                    '7-Exchange Monitoring',
                    'Real-time Opportunity Detection',
                    'Gas Optimization'
                ],
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                walletAddress,
                name: 'Yield Optimizer',
                type: 'yield',
                description: 'DQN-based multi-protocol yield optimization',
                status: 'active',
                performance: {
                    totalPnl: 0,
                    apy: 0,
                    successRate: 0,
                    totalTrades: 0,
                    averageProfit: 0
                },
                chains: ['ethereum', 'polygon'],
                config: {
                    minAPY: 3.0,
                    maxRiskLevel: 0.4,
                    riskTolerance: 'medium',
                    autoCompound: true
                },
                features: [
                    'Deep Q-Network (DQN)',
                    'Multi-protocol Analysis',
                    'Risk-adjusted Returns',
                    'Auto-compounding'
                ],
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                walletAddress,
                name: 'Risk Manager',
                type: 'risk',
                description: 'Advanced blockchain-based risk analysis',
                status: 'active',
                performance: {
                    totalPnl: 0,
                    apy: 0,
                    successRate: 0,
                    totalTrades: 0,
                    averageProfit: 0
                },
                chains: ['ethereum', 'polygon', 'arbitrum', 'bsc'],
                config: {
                    maxRiskScore: 70,
                    alertThreshold: 80,
                    autoStopLoss: true,
                    riskLevel: 'medium'
                },
                features: [
                    'Real-time Risk Monitoring',
                    'Blockchain Analysis',
                    'Liquidation Prevention',
                    'Portfolio Risk Scoring'
                ],
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                walletAddress,
                name: 'Portfolio Rebalancer',
                type: 'rebalancer',
                description: 'Advanced multi-chain portfolio rebalancing',
                status: 'active',
                performance: {
                    totalPnl: 0,
                    apy: 0,
                    successRate: 0,
                    totalTrades: 0,
                    averageProfit: 0
                },
                chains: ['ethereum', 'polygon'],
                config: {
                    rebalanceThreshold: 5.0,
                    maxPositionSize: 25.0,
                    gasOptimization: true,
                    riskLevel: 'medium'
                },
                features: [
                    'Advanced Portfolio Analysis',
                    'Multi-chain Rebalancing',
                    'Gas Optimization',
                    'Celery Task Processing'
                ],
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        
        await agentsCollection.insertMany(productionAgents);
        console.log(`✅ Created production agents for wallet: ${walletAddress}`);
        
    } catch (error) {
        console.error('❌ Failed to create production agents:', error);
    }
}

/**
 * Format agents for frontend
 */
function formatAgentsForFrontend(agents) {
    return agents.map(agent => ({
        name: agent.name,
        type: agent.type,
        description: agent.description,
        apy: agent.performance?.apy || 0,
        pnl: agent.performance?.totalPnl || 0,
        successRate: agent.performance?.successRate || 0,
        trades: agent.performance?.totalTrades || 0,
        averageProfit: agent.performance?.averageProfit || 0,
        status: agent.status || 'active',
        chains: agent.chains || [],
        features: agent.features || [],
        lastUpdated: agent.updatedAt || agent.createdAt,
        config: agent.config || {}
    }));
}

/**
 * Get production agent name
 */
function getProductionAgentName(agentType) {
    const names = {
        arbitrage: 'Arbitrage Bot',
        yield: 'Yield Optimizer',
        risk: 'Risk Manager',
        rebalancer: 'Portfolio Rebalancer'
    };
    return names[agentType] || 'Unknown Agent';
}

/**
 * Calculate aggregated metrics
 */
function calculateAggregatedMetrics(metrics) {
    if (metrics.length === 0) {
        return {
            totalProfit: 0,
            totalTrades: 0,
            successRate: 0,
            averageProfit: 0,
            bestTrade: 0,
            worstTrade: 0
        };
    }
    
    const totalProfit = metrics.reduce((sum, m) => sum + (m.profit || 0), 0);
    const totalTrades = metrics.length;
    const successfulTrades = metrics.filter(m => m.success).length;
    const successRate = (successfulTrades / totalTrades) * 100;
    const averageProfit = totalProfit / totalTrades;
    const profits = metrics.map(m => m.profit || 0);
    const bestTrade = Math.max(...profits);
    const worstTrade = Math.min(...profits);
    
    return {
        totalProfit,
        totalTrades,
        successRate,
        averageProfit,
        bestTrade,
        worstTrade
    };
}