import express from 'express';
import productionBlockchainController from '../backend/controllers/production-blockchain.controller.js';

const router = express.Router();

/**
 * Production Blockchain API Routes
 * Real blockchain operations with deployed smart contracts
 */

// System Management Routes
router.post('/system/initialize', productionBlockchainController.initializeSystem);
router.post('/system/start', productionBlockchainController.startAllAgents);
router.post('/system/stop', productionBlockchainController.stopAllAgents);
router.get('/system/status', productionBlockchainController.getSystemStatus);
router.get('/system/metrics', productionBlockchainController.getSystemMetrics);
router.get('/system/health', productionBlockchainController.healthCheck);

// Agent Management Routes
router.post('/agents/:agentName/start', productionBlockchainController.startAgent);
router.post('/agents/:agentName/stop', productionBlockchainController.stopAgent);
router.post('/agents/:agentName/restart', productionBlockchainController.restartAgent);
router.get('/agents/:agentName/status', productionBlockchainController.getAgentStatus);

// Blockchain Operations Routes
router.post('/yield/optimize', productionBlockchainController.executeYieldOptimization);
router.post('/arbitrage/execute', productionBlockchainController.executeArbitrage);
router.post('/risk/evaluate', productionBlockchainController.evaluateRisk);
router.post('/portfolio/rebalance', productionBlockchainController.rebalancePortfolio);
router.post('/portfolio/strategy/create', productionBlockchainController.createPortfolioStrategy);

// Data Retrieval Routes
router.get('/contracts/stats', productionBlockchainController.getContractStats);
router.get('/users/:userAddress/data', productionBlockchainController.getUserData);
router.get('/network/status', productionBlockchainController.getNetworkStatus);

// Frontend-specific routes (matching what the UI calls)
router.get('/dashboard/summary', productionBlockchainController.getDashboardSummary);
router.get('/agents/status', productionBlockchainController.getAllAgentsStatus);
router.post('/agents/execute/:agentType', productionBlockchainController.executeAgentByType);
router.post('/orchestrator/start', productionBlockchainController.startOrchestrator);
router.get('/orchestrator/status', productionBlockchainController.getOrchestratorStatus);

export default router;