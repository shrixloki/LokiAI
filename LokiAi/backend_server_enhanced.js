#!/usr/bin/env node
/**
 * LokiAI Enhanced Backend Server
 * Integrates ML API, MetaMask, and multi-chain blockchain operations
 * 
 * Features:
 * - ML API integration (FastAPI on port 8000)
 * - MetaMask wallet integration with ethers.js
 * - Multi-chain support (Ethereum Mainnet, Polygon, Arbitrum, Optimism, Sepolia, Mumbai)
 * - Environment variable configuration for RPC URLs and contract addresses
 * - Trade execution pipeline with network-specific contracts
 * - Comprehensive logging and monitoring
 */

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { ethers } from 'ethers';
import fetch from 'node-fetch';
import winston from 'winston';

// Configure logging
const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'backend_server.log' }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

const app = express();
const PORT = 25001;

// Configuration with environment variables
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/i-rutA7je782gyS7TXnH3";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR_INFURA_KEY";
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || "https://polygon-mainnet.infura.io/v3/YOUR_INFURA_KEY";
const MUMBAI_RPC_URL = process.env.MUMBAI_RPC_URL || "https://polygon-mumbai.infura.io/v3/YOUR_INFURA_KEY";
const ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL || "https://arbitrum-mainnet.infura.io/v3/YOUR_INFURA_KEY";
const OPTIMISM_RPC_URL = process.env.OPTIMISM_RPC_URL || "https://optimism-mainnet.infura.io/v3/YOUR_INFURA_KEY";

const CONFIG = {
    ML_API_URL: process.env.ML_API_URL || 'http://127.0.0.1:8000',
    NETWORKS: {
        // Mainnets
        mainnet: {
            chainId: 1,
            name: 'Ethereum Mainnet',
            rpcUrl: MAINNET_RPC_URL,
            explorerUrl: 'https://etherscan.io',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
        },
        polygon: {
            chainId: 137,
            name: 'Polygon Mainnet',
            rpcUrl: POLYGON_RPC_URL,
            explorerUrl: 'https://polygonscan.com',
            nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }
        },
        arbitrum: {
            chainId: 42161,
            name: 'Arbitrum One',
            rpcUrl: ARBITRUM_RPC_URL,
            explorerUrl: 'https://arbiscan.io',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
        },
        optimism: {
            chainId: 10,
            name: 'Optimism',
            rpcUrl: OPTIMISM_RPC_URL,
            explorerUrl: 'https://optimistic.etherscan.io',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
        },
        // Testnets
        sepolia: {
            chainId: 11155111,
            name: 'Sepolia',
            rpcUrl: SEPOLIA_RPC_URL,
            explorerUrl: 'https://sepolia.etherscan.io',
            nativeCurrency: { name: 'Sepolia ETH', symbol: 'SEP', decimals: 18 }
        },
        mumbai: {
            chainId: 80001,
            name: 'Mumbai',
            rpcUrl: MUMBAI_RPC_URL,
            explorerUrl: 'https://mumbai.polygonscan.com',
            nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }
        }
    },
    CONTRACTS: {
        // Contract addresses from environment variables with fallback
        mainnet: {
            YIELD_OPTIMIZER: process.env.MAINNET_YIELD_OPTIMIZER || '0x0000000000000000000000000000000000000000',
            ARBITRAGE_BOT: process.env.MAINNET_ARBITRAGE_BOT || '0x0000000000000000000000000000000000000000',
            PORTFOLIO_REBALANCER: process.env.MAINNET_PORTFOLIO_REBALANCER || '0x0000000000000000000000000000000000000000',
            RISK_MANAGER: process.env.MAINNET_RISK_MANAGER || '0x0000000000000000000000000000000000000000'
        },
        polygon: {
            YIELD_OPTIMIZER: process.env.POLYGON_YIELD_OPTIMIZER || '0x0000000000000000000000000000000000000000',
            ARBITRAGE_BOT: process.env.POLYGON_ARBITRAGE_BOT || '0x0000000000000000000000000000000000000000',
            PORTFOLIO_REBALANCER: process.env.POLYGON_PORTFOLIO_REBALANCER || '0x0000000000000000000000000000000000000000',
            RISK_MANAGER: process.env.POLYGON_RISK_MANAGER || '0x0000000000000000000000000000000000000000'
        },
        arbitrum: {
            YIELD_OPTIMIZER: process.env.ARBITRUM_YIELD_OPTIMIZER || '0x0000000000000000000000000000000000000000',
            ARBITRAGE_BOT: process.env.ARBITRUM_ARBITRAGE_BOT || '0x0000000000000000000000000000000000000000',
            PORTFOLIO_REBALANCER: process.env.ARBITRUM_PORTFOLIO_REBALANCER || '0x0000000000000000000000000000000000000000',
            RISK_MANAGER: process.env.ARBITRUM_RISK_MANAGER || '0x0000000000000000000000000000000000000000'
        },
        optimism: {
            YIELD_OPTIMIZER: process.env.OPTIMISM_YIELD_OPTIMIZER || '0x0000000000000000000000000000000000000000',
            ARBITRAGE_BOT: process.env.OPTIMISM_ARBITRAGE_BOT || '0x0000000000000000000000000000000000000000',
            PORTFOLIO_REBALANCER: process.env.OPTIMISM_PORTFOLIO_REBALANCER || '0x0000000000000000000000000000000000000000',
            RISK_MANAGER: process.env.OPTIMISM_RISK_MANAGER || '0x0000000000000000000000000000000000000000'
        },
        // Testnets
        sepolia: {
            YIELD_OPTIMIZER: process.env.SEPOLIA_YIELD_OPTIMIZER || '0x1234567890123456789012345678901234567890',
            ARBITRAGE_BOT: process.env.SEPOLIA_ARBITRAGE_BOT || '0x2345678901234567890123456789012345678901',
            PORTFOLIO_REBALANCER: process.env.SEPOLIA_PORTFOLIO_REBALANCER || '0x3456789012345678901234567890123456789012',
            RISK_MANAGER: process.env.SEPOLIA_RISK_MANAGER || '0x4567890123456789012345678901234567890123'
        },
        mumbai: {
            YIELD_OPTIMIZER: process.env.MUMBAI_YIELD_OPTIMIZER || '0x1234567890123456789012345678901234567890',
            ARBITRAGE_BOT: process.env.MUMBAI_ARBITRAGE_BOT || '0x2345678901234567890123456789012345678901',
            PORTFOLIO_REBALANCER: process.env.MUMBAI_PORTFOLIO_REBALANCER || '0x3456789012345678901234567890123456789012',
            RISK_MANAGER: process.env.MUMBAI_RISK_MANAGER || '0x4567890123456789012345678901234567890123'
        }
    }
};

// Global state
const appState = {
    providers: new Map(),
    mlApiHealthy: false,
    lastHealthCheck: null,
    activeAgents: new Map(),
    tradeHistory: []
};

// Initialize providers
function initializeProviders() {
    try {
        for (const [network, config] of Object.entries(CONFIG.NETWORKS)) {
            const provider = new ethers.JsonRpcProvider(config.rpcUrl);
            appState.providers.set(network, provider);
            logger.info(`✅ Initialized provider for ${config.name}`);
        }
    } catch (error) {
        logger.error('Failed to initialize providers:', error);
    }
}

// Check ML API health
async function checkMLApiHealth() {
    try {
        const response = await fetch(`${CONFIG.ML_API_URL}/health`, {
            timeout: 5000
        });
        
        if (response.ok) {
            const data = await response.json();
            appState.mlApiHealthy = data.status === 'healthy';
            appState.lastHealthCheck = new Date();
            logger.info('✅ ML API health check passed');
            return true;
        } else {
            appState.mlApiHealthy = false;
            logger.warn('⚠️ ML API health check failed');
            return false;
        }
    } catch (error) {
        appState.mlApiHealthy = false;
        logger.error('❌ ML API health check error:', error.message);
        return false;
    }
}

// Call ML API for predictions
async function callMLApi(agentType, tokenSymbol, marketData) {
    try {
        logger.info(`🤖 Calling ML API: ${agentType} for ${tokenSymbol}`);
        
        const response = await fetch(`${CONFIG.ML_API_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token_symbol: tokenSymbol,
                agent_type: agentType,
                market_data: marketData
            }),
            timeout: 10000
        });
        
        if (!response.ok) {
            throw new Error(`ML API error: ${response.status} ${response.statusText}`);
        }
        
        const prediction = await response.json();
        logger.info(`✅ ML prediction received: ${prediction.prediction_id}`);
        logger.debug(`🔍 PREDICTION DETAILS: ${JSON.stringify(prediction, null, 2)}`);
        
        return prediction;
    } catch (error) {
        logger.error('❌ ML API call failed:', error);
        throw error;
    }
}

// Convert ML prediction to trade instruction
function predictionToTradeInstruction(prediction, agentConfig) {
    try {
        const { agent_type, predictions, confidence, token_symbol } = prediction;
        
        let tradeInstruction = {
            id: `trade_${Date.now()}`,
            agentId: agentConfig.id,
            agentType: agent_type,
            tokenSymbol: token_symbol,
            confidence: confidence,
            timestamp: new Date(),
            status: 'pending',
            network: agentConfig.network || 'sepolia'
        };
        
        // Get network-specific contract addresses
        const networkContracts = CONFIG.CONTRACTS[tradeInstruction.network] || CONFIG.CONTRACTS.sepolia;
        
        // Convert predictions to trade actions based on agent type
        switch (agent_type) {
            case 'yield':
                tradeInstruction.action = {
                    type: 'yield_optimization',
                    expectedReturn: predictions.expected_return,
                    riskScore: predictions.risk_score,
                    allocation: predictions.optimal_allocation,
                    contractAddress: networkContracts.YIELD_OPTIMIZER
                };
                break;
                
            case 'arbitrage':
                tradeInstruction.action = {
                    type: 'arbitrage_execution',
                    profitProbability: predictions.profit_probability,
                    expectedProfit: predictions.expected_profit,
                    executionTime: predictions.execution_time,
                    contractAddress: networkContracts.ARBITRAGE_BOT
                };
                break;
                
            case 'portfolio':
                tradeInstruction.action = {
                    type: 'portfolio_rebalance',
                    rebalanceSignal: predictions.rebalance_signal,
                    targetAllocation: predictions.target_allocation,
                    riskAdjustment: predictions.risk_adjustment,
                    contractAddress: networkContracts.PORTFOLIO_REBALANCER
                };
                break;
                
            case 'risk':
                tradeInstruction.action = {
                    type: 'risk_management',
                    riskLevel: predictions.risk_level,
                    stopLossTrigger: predictions.stop_loss_trigger,
                    positionSize: predictions.position_size,
                    contractAddress: networkContracts.RISK_MANAGER
                };
                break;
                
            default:
                throw new Error(`Unknown agent type: ${agent_type}`);
        }
        
        logger.info(`📋 Trade instruction created: ${tradeInstruction.id}`);
        logger.debug(`🚀 TRADE INSTRUCTION DETAILS: ${JSON.stringify(tradeInstruction, null, 2)}`);
        return tradeInstruction;
        
    } catch (error) {
        logger.error('❌ Failed to create trade instruction:', error);
        throw error;
    }
}

// Execute trade instruction via MetaMask
async function executeTradeInstruction(tradeInstruction, walletAddress) {
    try {
        logger.info(`⚡ Executing trade: ${tradeInstruction.id}`);
        
        const network = tradeInstruction.network;
        const provider = appState.providers.get(network);
        
        if (!provider) {
            throw new Error(`Provider not found for network: ${network}`);
        }
        
        // Create transaction data based on action type
        const txData = createTransactionData(tradeInstruction);
        
        // Estimate gas
        const gasEstimate = await provider.estimateGas({
            to: txData.to,
            data: txData.data,
            value: txData.value || '0x0'
        });
        
        // Get current gas price
        const feeData = await provider.getFeeData();
        
        // Create transaction object for MetaMask
        const transaction = {
            to: txData.to,
            data: txData.data,
            value: txData.value || '0x0',
            gasLimit: gasEstimate.toString(),
            gasPrice: feeData.gasPrice?.toString(),
            chainId: CONFIG.NETWORKS[network].chainId
        };
        
        // Store transaction for MetaMask to sign
        tradeInstruction.transaction = transaction;
        tradeInstruction.status = 'ready_for_signing';
        tradeInstruction.gasEstimate = ethers.formatEther(gasEstimate * feeData.gasPrice);
        
        // Add to trade history
        appState.tradeHistory.push(tradeInstruction);
        
        logger.info(`✅ Trade instruction prepared for MetaMask: ${tradeInstruction.id}`);
        
        return {
            success: true,
            tradeId: tradeInstruction.id,
            transaction: transaction,
            gasEstimate: tradeInstruction.gasEstimate,
            networkInfo: CONFIG.NETWORKS[network]
        };
        
    } catch (error) {
        logger.error(`❌ Trade execution failed: ${error.message}`);
        tradeInstruction.status = 'failed';
        tradeInstruction.error = error.message;
        
        return {
            success: false,
            error: error.message,
            tradeId: tradeInstruction.id
        };
    }
}

// Create transaction data for smart contract interaction
function createTransactionData(tradeInstruction) {
    const { action } = tradeInstruction;
    
    // Mock contract interaction data
    // In production, use actual contract ABIs and ethers.js Contract interface
    const iface = new ethers.Interface([
        "function executeYieldStrategy(uint256 amount, address token)",
        "function executeArbitrage(address tokenA, address tokenB, uint256 amount)",
        "function rebalancePortfolio(address[] tokens, uint256[] allocations)",
        "function setRiskParameters(uint256 riskLevel, uint256 stopLoss)"
    ]);
    
    let data, value = '0x0';
    
    switch (action.type) {
        case 'yield_optimization':
            data = iface.encodeFunctionData("executeYieldStrategy", [
                ethers.parseEther((action.allocation * 1000).toString()),
                ethers.ZeroAddress // Mock token address
            ]);
            break;
            
        case 'arbitrage_execution':
            data = iface.encodeFunctionData("executeArbitrage", [
                ethers.ZeroAddress, // Token A
                ethers.ZeroAddress, // Token B
                ethers.parseEther("1.0") // Amount
            ]);
            break;
            
        case 'portfolio_rebalance':
            data = iface.encodeFunctionData("rebalancePortfolio", [
                [ethers.ZeroAddress], // Tokens
                [ethers.parseEther(action.targetAllocation.toString())] // Allocations
            ]);
            break;
            
        case 'risk_management':
            data = iface.encodeFunctionData("setRiskParameters", [
                Math.floor(action.riskLevel * 100),
                Math.floor(action.stopLossTrigger * 100)
            ]);
            break;
            
        default:
            throw new Error(`Unknown action type: ${action.type}`);
    }
    
    return {
        to: action.contractAddress,
        data: data,
        value: value
    };
}

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
    credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, { 
        ip: req.ip, 
        userAgent: req.get('User-Agent') 
    });
    next();
});

// Routes

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const mlHealthy = await checkMLApiHealth();
        const providersHealthy = appState.providers.size > 0;
        
        const health = {
            status: (mlHealthy && providersHealthy) ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            components: {
                ml_api: mlHealthy ? 'healthy' : 'unhealthy',
                blockchain_providers: providersHealthy ? 'healthy' : 'unhealthy',
                active_agents: appState.activeAgents.size
            },
            uptime: process.uptime(),
            version: '1.0.0'
        };
        
        res.json(health);
    } catch (error) {
        logger.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Deploy agent endpoint
app.post('/agents/deploy', async (req, res) => {
    try {
        const { agentConfig, walletAddress } = req.body;
        
        if (!agentConfig || !walletAddress) {
            return res.status(400).json({
                error: 'Agent configuration and wallet address required'
            });
        }
        
        // Validate wallet address
        if (!ethers.isAddress(walletAddress)) {
            return res.status(400).json({
                error: 'Invalid wallet address'
            });
        }
        
        // Create agent instance
        const agentId = `agent_${Date.now()}`;
        const agent = {
            id: agentId,
            ...agentConfig,
            walletAddress: walletAddress,
            status: 'deployed',
            deployedAt: new Date(),
            network: agentConfig.network || 'sepolia'
        };
        
        appState.activeAgents.set(agentId, agent);
        
        logger.info(`🚀 Agent deployed: ${agentId} (${agentConfig.type})`);
        
        res.json({
            success: true,
            agentId: agentId,
            agent: agent,
            message: 'Agent deployed successfully'
        });
        
    } catch (error) {
        logger.error('Agent deployment failed:', error);
        res.status(500).json({
            error: 'Agent deployment failed',
            message: error.message
        });
    }
});

// Execute agent prediction and trade
app.post('/agents/:agentId/execute', async (req, res) => {
    try {
        const { agentId } = req.params;
        const { marketData, walletAddress } = req.body;
        
        const agent = appState.activeAgents.get(agentId);
        if (!agent) {
            return res.status(404).json({
                error: 'Agent not found'
            });
        }
        
        // Check ML API health
        if (!appState.mlApiHealthy) {
            await checkMLApiHealth();
            if (!appState.mlApiHealthy) {
                return res.status(503).json({
                    error: 'ML API unavailable'
                });
            }
        }
        
        // Call ML API for prediction
        const prediction = await callMLApi(
            agent.type,
            agent.tokenSymbol || 'ETH',
            marketData
        );
        
        // Convert prediction to trade instruction
        const tradeInstruction = predictionToTradeInstruction(prediction, agent);
        
        // Execute trade instruction
        const executionResult = await executeTradeInstruction(tradeInstruction, walletAddress);
        
        res.json({
            success: executionResult.success,
            prediction: prediction,
            tradeInstruction: tradeInstruction,
            execution: executionResult
        });
        
    } catch (error) {
        logger.error(`Agent execution failed for ${agentId}:`, error);
        res.status(500).json({
            error: 'Agent execution failed',
            message: error.message
        });
    }
});

// Get agent status
app.get('/agents/:agentId', (req, res) => {
    try {
        const { agentId } = req.params;
        const agent = appState.activeAgents.get(agentId);
        
        if (!agent) {
            return res.status(404).json({
                error: 'Agent not found'
            });
        }
        
        res.json({
            agent: agent,
            trades: appState.tradeHistory.filter(t => t.agentId === agentId).slice(-10)
        });
        
    } catch (error) {
        logger.error('Failed to get agent status:', error);
        res.status(500).json({
            error: 'Failed to get agent status',
            message: error.message
        });
    }
});

// Get all agents
app.get('/agents', (req, res) => {
    try {
        const agents = Array.from(appState.activeAgents.values());
        res.json({
            agents: agents,
            total: agents.length,
            active: agents.filter(a => a.status === 'active').length
        });
    } catch (error) {
        logger.error('Failed to get agents:', error);
        res.status(500).json({
            error: 'Failed to get agents',
            message: error.message
        });
    }
});

// Get trade history
app.get('/trades', (req, res) => {
    try {
        const { limit = 50, agentId } = req.query;
        
        let trades = appState.tradeHistory;
        
        if (agentId) {
            trades = trades.filter(t => t.agentId === agentId);
        }
        
        trades = trades
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, parseInt(limit));
        
        res.json({
            trades: trades,
            total: appState.tradeHistory.length
        });
        
    } catch (error) {
        logger.error('Failed to get trade history:', error);
        res.status(500).json({
            error: 'Failed to get trade history',
            message: error.message
        });
    }
});

// Confirm transaction (called after MetaMask signing)
app.post('/trades/:tradeId/confirm', async (req, res) => {
    try {
        const { tradeId } = req.params;
        const { txHash, status } = req.body;
        
        const trade = appState.tradeHistory.find(t => t.id === tradeId);
        if (!trade) {
            return res.status(404).json({
                error: 'Trade not found'
            });
        }
        
        trade.txHash = txHash;
        trade.status = status || 'confirmed';
        trade.confirmedAt = new Date();
        
        logger.info(`✅ Trade confirmed: ${tradeId} - ${txHash}`);
        
        res.json({
            success: true,
            trade: trade
        });
        
    } catch (error) {
        logger.error('Trade confirmation failed:', error);
        res.status(500).json({
            error: 'Trade confirmation failed',
            message: error.message
        });
    }
});

// Network information
app.get('/networks', (req, res) => {
    res.json({
        networks: CONFIG.NETWORKS,
        contracts: CONFIG.CONTRACTS,
        validation: validateNetworkConfigurations()
    });
});

// Validate network configurations
function validateNetworkConfigurations() {
    const validation = {
        networks: {},
        summary: {
            total: 0,
            configured: 0,
            mainnetReady: 0,
            testnetReady: 0
        }
    };
    
    for (const [networkName, networkConfig] of Object.entries(CONFIG.NETWORKS)) {
        const isMainnet = ['mainnet', 'polygon', 'arbitrum', 'optimism'].includes(networkName);
        const isTestnet = ['sepolia', 'mumbai'].includes(networkName);
        
        const hasValidRpc = !networkConfig.rpcUrl.includes('YOUR_INFURA_KEY') && 
                           !networkConfig.rpcUrl.includes('YOUR_ALCHEMY_API_KEY');
        
        const networkContracts = CONFIG.CONTRACTS[networkName];
        const hasValidContracts = networkContracts && 
                                 !Object.values(networkContracts).every(addr => 
                                     addr === '0x0000000000000000000000000000000000000000'
                                 );
        
        validation.networks[networkName] = {
            type: isMainnet ? 'mainnet' : 'testnet',
            rpcConfigured: hasValidRpc,
            contractsConfigured: hasValidContracts,
            ready: hasValidRpc && hasValidContracts,
            rpcUrl: hasValidRpc ? 'configured' : 'needs configuration',
            chainId: networkConfig.chainId
        };
        
        validation.summary.total++;
        if (validation.networks[networkName].ready) {
            validation.summary.configured++;
            if (isMainnet) validation.summary.mainnetReady++;
            if (isTestnet) validation.summary.testnetReady++;
        }
    }
    
    return validation;
}

// Error handling middleware
app.use((error, req, res, next) => {
    logger.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
});

// Initialize and start server
async function startServer() {
    try {
        logger.info('🚀 Starting LokiAI Enhanced Backend Server...');
        
        // Initialize blockchain providers
        initializeProviders();
        
        // Check ML API health
        await checkMLApiHealth();
        
        // Start periodic health checks
        setInterval(checkMLApiHealth, 30000); // Every 30 seconds
        
        app.listen(PORT, '127.0.0.1', () => {
            logger.info(`✅ Server running on http://127.0.0.1:${PORT}`);
            logger.info(`📊 ML API: ${CONFIG.ML_API_URL}`);
            
            // Log network configuration status
            const validation = validateNetworkConfigurations();
            logger.info(`⛓️ Networks: ${Object.keys(CONFIG.NETWORKS).join(', ')}`);
            logger.info(`📊 Network Status: ${validation.summary.configured}/${validation.summary.total} configured (${validation.summary.mainnetReady} mainnet, ${validation.summary.testnetReady} testnet)`);
            
            // Log which networks are ready
            const readyNetworks = Object.entries(validation.networks)
                .filter(([_, config]) => config.ready)
                .map(([name, _]) => name);
            
            if (readyNetworks.length > 0) {
                logger.info(`✅ Ready networks: ${readyNetworks.join(', ')}`);
            } else {
                logger.warn(`⚠️ No networks fully configured. Update .env file with RPC URLs and contract addresses.`);
            }
            
            logger.info(`🔧 Health check: http://127.0.0.1:${PORT}/health`);
            logger.info(`🌐 Network info: http://127.0.0.1:${PORT}/networks`);
        });
        
    } catch (error) {
        logger.error('❌ Server startup failed:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('🛑 Shutting down server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('🛑 Shutting down server...');
    process.exit(0);
});

// Start the server
startServer();