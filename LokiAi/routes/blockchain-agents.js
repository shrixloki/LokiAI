import express from 'express';
import productionBlockchainController from '../backend/controllers/production-blockchain.controller.js';

const router = express.Router();

/**
 * Blockchain Agents Routes - Real Smart Contract Integration
 * 
 * These routes handle actual blockchain transactions and smart contract interactions
 */

// Agent Status and Management
router.get('/agents/status', productionBlockchainController.getAllAgentsStatus);
router.post('/orchestrator/start', productionBlockchainController.startOrchestrator);
router.get('/orchestrator/status', productionBlockchainController.getOrchestratorStatus);

// Individual Agent Execution (Real Blockchain Transactions)
router.post('/agents/execute/yield', productionBlockchainController.executeYieldOptimization);
router.post('/agents/execute/arbitrage', productionBlockchainController.executeArbitrage);
router.post('/agents/execute/risk', productionBlockchainController.evaluateRisk);
router.post('/agents/execute/rebalancer', productionBlockchainController.rebalancePortfolio);

// Generic agent execution endpoint
router.post('/agents/execute/:agentType', async (req, res) => {
    const { agentType } = req.params;
    
    try {
        switch (agentType) {
            case 'yield':
                return await productionBlockchainController.executeYieldOptimization(req, res);
            case 'arbitrage':
                return await productionBlockchainController.executeArbitrage(req, res);
            case 'risk':
                return await productionBlockchainController.evaluateRisk(req, res);
            case 'rebalancer':
                return await productionBlockchainController.rebalancePortfolio(req, res);
            default:
                return res.status(400).json({
                    success: false,
                    error: `Unknown agent type: ${agentType}`
                });
        }
    } catch (error) {
        console.error(`❌ Agent execution failed for ${agentType}:`, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// System Management
router.post('/system/initialize', productionBlockchainController.initializeSystem);
router.get('/system/status', productionBlockchainController.getSystemStatus);
router.get('/system/health', productionBlockchainController.healthCheck);
router.get('/system/metrics', productionBlockchainController.getSystemMetrics);

// Contract Information
router.get('/contracts/stats', productionBlockchainController.getContractStats);
router.get('/contracts/network', productionBlockchainController.getNetworkStatus);
router.get('/contracts/user/:userAddress', productionBlockchainController.getUserData);

// Dashboard Data
router.get('/dashboard/summary', productionBlockchainController.getDashboardSummary);

// Agent Management
router.post('/agents/start/:agentName', productionBlockchainController.startAgent);
router.post('/agents/stop/:agentName', productionBlockchainController.stopAgent);
router.post('/agents/restart/:agentName', productionBlockchainController.restartAgent);
router.get('/agents/status/:agentName', productionBlockchainController.getAgentStatus);

// Portfolio Management
router.post('/portfolio/strategy', productionBlockchainController.createPortfolioStrategy);

export default router;