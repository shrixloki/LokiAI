import express from 'express';
import { 
    runAgent, 
    getAgentStatus, 
    updateAgentPerformance, 
    configureAgent, 
    toggleAgent 
} from '../backend/controllers/agents.controller.js';

const router = express.Router();

// Middleware to attach Socket.IO to requests
router.use((req, res, next) => {
    req.io = req.app.get('io');
    next();
});

/**
 * GET /api/agents/status?wallet=0x...
 * 
 * Returns all AI agents for a specific wallet with real-time performance data
 */
router.get('/status', getAgentStatus);

/**
 * POST /api/agents/run/:agentType
 * 
 * Execute a specific AI agent (arbitrage, yield-optimizer, etc.)
 */
router.post('/run/:agentType', runAgent);

/**
 * POST /api/agents/update
 * 
 * Update agent performance metrics (called by agent execution logic)
 */
router.post('/update', updateAgentPerformance);

/**
 * POST /api/agents/configure
 * 
 * Create or update agent configuration
 */
router.post('/configure', configureAgent);

/**
 * POST /api/agents/toggle
 * 
 * Start or stop an agent
 */
router.post('/toggle', toggleAgent);

export default router;
