import express from 'express';
import { 
    getAgentStatus,
    runAgent,
    updateAgentPerformance,
    configureAgent,
    toggleAgent
} from '../backend/controllers/simple-agents.controller.js';

const router = express.Router();

// Middleware to attach Socket.IO to requests
router.use((req, res, next) => {
    req.io = req.app.get('io');
    next();
});

// Get agent status
router.get('/status', getAgentStatus);

// Execute agent (both /run and /execute for compatibility)
router.post('/run/:agentType', runAgent);
router.post('/execute/:agentType', runAgent);

// Update agent performance
router.post('/update', updateAgentPerformance);

// Configure agent
router.post('/configure', configureAgent);

// Toggle agent status
router.post('/toggle', toggleAgent);

export default router;
