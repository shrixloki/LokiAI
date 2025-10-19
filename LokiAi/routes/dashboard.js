import express from 'express';
import productionAgentOrchestrator from '../backend/services/production-agent-orchestrator.js';
import smartContractsService from '../backend/services/blockchain/smart-contracts-service.js';

const router = express.Router();

/**
 * Dashboard API Routes
 * Provides dashboard data for the frontend
 */

// Get dashboard summary
router.get('/summary', async (req, res) => {
    try {
        const { wallet } = req.query;
        
        console.log(`📊 Dashboard summary requested for wallet: ${wallet}`);
        
        // Get system status
        const systemStatus = productionAgentOrchestrator.getSystemStatus();
        
        // Get user data from contracts if wallet provided
        let userData = {};
        if (wallet) {
            try {
                userData = await smartContractsService.getUserData(wallet);
            } catch (error) {
                console.warn('⚠️ Could not fetch user data:', error.message);
            }
        }
        
        // Get contract stats
        let contractStats = {};
        try {
            contractStats = await smartContractsService.getContractStats();
        } catch (error) {
            console.warn('⚠️ Could not fetch contract stats:', error.message);
        }
        
        // Sanitize BigInt values
        const sanitizedData = JSON.parse(JSON.stringify({
            systemStatus,
            userData,
            contractStats
        }, (key, value) => typeof value === 'bigint' ? value.toString() : value));
        
        const summary = {
            wallet: wallet || null,
            totalValue: userData.portfolio?.totalValue || '0',
            totalProfit: '0', // Calculate from user data
            activeAgents: systemStatus.orchestrator?.runningAgents || 0,
            totalAgents: systemStatus.orchestrator?.totalAgents || 4,
            systemHealth: systemStatus.orchestrator?.isRunning ? 'healthy' : 'unhealthy',
            networkStatus: 'Connected to Sepolia',
            contracts: {
                yieldOptimizer: process.env.YIELD_OPTIMIZER_ADDRESS,
                arbitrageBot: process.env.ARBITRAGE_BOT_ADDRESS,
                riskManager: process.env.RISK_MANAGER_ADDRESS,
                portfolioRebalancer: process.env.PORTFOLIO_REBALANCER_ADDRESS
            },
            stats: sanitizedData.contractStats,
            lastUpdate: new Date().toISOString()
        };
        
        res.json({
            success: true,
            data: summary,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Dashboard summary error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Get portfolio data
router.get('/portfolio', async (req, res) => {
    try {
        const { wallet } = req.query;
        
        if (!wallet) {
            return res.status(400).json({
                success: false,
                error: 'Wallet address required'
            });
        }
        
        const userData = await smartContractsService.getUserData(wallet);
        
        const sanitizedData = JSON.parse(JSON.stringify(userData, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        
        res.json({
            success: true,
            data: sanitizedData,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Portfolio data error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;