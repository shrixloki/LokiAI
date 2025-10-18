/**
 * Production Agents Routes - Only 4 Production-Level AI Agents
 * 
 * Routes for managing the 4 most powerful, production-ready agents:
 * 1. Arbitrage Bot (LSTM-based)
 * 2. Yield Optimizer (DQN-based)
 * 3. Risk Manager (Advanced blockchain analysis)
 * 4. Portfolio Rebalancer (Python-based)
 */

import express from 'express';
import { 
    startProductionAgents,
    stopProductionAgents,
    getProductionAgentStatus,
    executeProductionAgent,
    getProductionAgentMetrics,
    configureProductionAgent,
    toggleProductionAgent
} from '../backend/controllers/production-agents.controller.js';

const router = express.Router();

// Middleware to attach Socket.IO to requests
router.use((req, res, next) => {
    req.io = req.app.get('io');
    next();
});

/**
 * POST /api/agents/start
 * 
 * Start the production agent orchestrator with all 4 agents
 */
router.post('/start', startProductionAgents);

/**
 * POST /api/agents/stop
 * 
 * Stop the production agent orchestrator
 */
router.post('/stop', stopProductionAgents);

/**
 * GET /api/agents/status?wallet=0x...
 * 
 * Get status of all 4 production agents for a specific wallet
 */
router.get('/status', getProductionAgentStatus);

/**
 * POST /api/agents/execute/:agentType
 * 
 * Execute a specific production agent
 * Valid agentTypes: arbitrage, yield, risk, rebalancer
 */
router.post('/execute/:agentType', executeProductionAgent);

/**
 * GET /api/agents/metrics?agentType=arbitrage&wallet=0x...&timeframe=24h
 * 
 * Get performance metrics for production agents
 */
router.get('/metrics', getProductionAgentMetrics);

/**
 * POST /api/agents/configure
 * 
 * Configure a production agent
 * Body: { walletAddress, agentType, config }
 */
router.post('/configure', configureProductionAgent);

/**
 * POST /api/agents/toggle
 * 
 * Toggle production agent status (start/stop)
 * Body: { walletAddress, agentType, status }
 */
router.post('/toggle', toggleProductionAgent);

export default router;