import yieldOptimizerProduction from './agents/yield-optimizer-production.js';
import arbitrageBotProduction from './agents/arbitrage-bot-production.js';
import riskManagerProduction from './agents/risk-manager-production.js';
import portfolioRebalancerProduction from './agents/portfolio-rebalancer-production.js';
import smartContractsService from './blockchain/smart-contracts-service.js';

/**
 * Production Agent Orchestrator
 * Manages all production blockchain agents with real smart contract integration
 */
class ProductionAgentOrchestrator {
    constructor() {
        this.name = 'Production Agent Orchestrator';
        this.version = '1.0.0';
        this.isInitialized = false;
        this.isRunning = false;
        
        // Production agents
        this.agents = {
            yieldOptimizer: yieldOptimizerProduction,
            arbitrageBot: arbitrageBotProduction,
            riskManager: riskManagerProduction,
            portfolioRebalancer: portfolioRebalancerProduction
        };
        
        // Agent status tracking
        this.agentStatus = new Map();
        this.systemMetrics = {
            totalTransactions: 0,
            totalProfit: 0,
            totalGasUsed: 0,
            uptime: 0,
            startTime: null
        };
        
        // Configuration
        this.config = {
            autoStart: true,
            healthCheckInterval: 30000, // 30 seconds
            metricsUpdateInterval: 60000, // 1 minute
            maxRetries: 3,
            retryDelay: 5000 // 5 seconds
        };
        
        this.healthCheckTimer = null;
        this.metricsTimer = null;
    }

    /**
     * Initialize all production agents
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('⚠️ Production Agent Orchestrator already initialized');
            return true;
        }

        console.log('🚀 Initializing Production Agent Orchestrator...');
        
        try {
            // Initialize smart contracts service first
            await smartContractsService.initialize();
            
            if (!smartContractsService.isReady()) {
                throw new Error('Smart contracts service not ready');
            }
            
            // Initialize all agents
            const initResults = await Promise.allSettled([
                this.agents.yieldOptimizer.initialize(),
                this.agents.arbitrageBot.initialize(),
                this.agents.riskManager.initialize(),
                this.agents.portfolioRebalancer.initialize()
            ]);
            
            // Check initialization results
            let successCount = 0;
            const agentNames = Object.keys(this.agents);
            
            for (let i = 0; i < initResults.length; i++) {
                const result = initResults[i];
                const agentName = agentNames[i];
                
                if (result.status === 'fulfilled' && result.value === true) {
                    successCount++;
                    this.agentStatus.set(agentName, {
                        initialized: true,
                        running: false,
                        lastError: null,
                        retryCount: 0
                    });
                    console.log(`✅ ${agentName} initialized successfully`);
                } else {
                    const error = result.reason || 'Unknown error';
                    this.agentStatus.set(agentName, {
                        initialized: false,
                        running: false,
                        lastError: error,
                        retryCount: 0
                    });
                    console.error(`❌ ${agentName} initialization failed:`, error);
                }
            }
            
            this.isInitialized = successCount > 0;
            
            if (this.isInitialized) {
                console.log(`✅ Production Agent Orchestrator initialized (${successCount}/${agentNames.length} agents)`);
                
                // Start health monitoring
                this.startHealthMonitoring();
                
                return true;
            } else {
                throw new Error('No agents initialized successfully');
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize Production Agent Orchestrator:', error);
            return false;
        }
    }

    /**
     * Start all production agents
     */
    async startAllAgents() {
        if (!this.isInitialized) {
            console.log('⚠️ Orchestrator not initialized. Initializing first...');
            const initialized = await this.initialize();
            if (!initialized) {
                throw new Error('Failed to initialize orchestrator');
            }
        }

        if (this.isRunning) {
            console.log('⚠️ Production agents already running');
            return;
        }

        console.log('🟢 Starting all production agents...');
        this.isRunning = true;
        this.systemMetrics.startTime = Date.now();
        
        try {
            // Start agents sequentially to avoid conflicts
            for (const [agentName, agent] of Object.entries(this.agents)) {
                const status = this.agentStatus.get(agentName);
                
                if (status && status.initialized) {
                    try {
                        await agent.start();
                        status.running = true;
                        status.lastError = null;
                        console.log(`✅ ${agentName} started successfully`);
                        
                        // Add delay between agent starts
                        await this.delay(2000);
                        
                    } catch (error) {
                        status.running = false;
                        status.lastError = error.message;
                        console.error(`❌ Failed to start ${agentName}:`, error);
                    }
                } else {
                    console.warn(`⚠️ Skipping ${agentName} - not initialized`);
                }
            }
            
            // Start metrics collection
            this.startMetricsCollection();
            
            console.log('✅ All production agents started');
            
            // Send startup notification
            await this.sendSystemNotification('success', {
                type: 'SYSTEM_STARTED',
                message: 'LokiAI Production System Started',
                agents: this.getRunningAgentsCount(),
                timestamp: Date.now()
            });
            
        } catch (error) {
            console.error('❌ Failed to start production agents:', error);
            this.isRunning = false;
            throw error;
        }
    }

    /**
     * Stop all production agents
     */
    async stopAllAgents() {
        console.log('🔴 Stopping all production agents...');
        
        try {
            // Stop agents in reverse order
            const agentEntries = Object.entries(this.agents).reverse();
            
            for (const [agentName, agent] of agentEntries) {
                const status = this.agentStatus.get(agentName);
                
                if (status && status.running) {
                    try {
                        await agent.stop();
                        status.running = false;
                        console.log(`✅ ${agentName} stopped successfully`);
                    } catch (error) {
                        console.error(`❌ Failed to stop ${agentName}:`, error);
                    }
                }
            }
            
            // Stop monitoring
            this.stopHealthMonitoring();
            this.stopMetricsCollection();
            
            this.isRunning = false;
            
            console.log('✅ All production agents stopped');
            
            // Send shutdown notification
            await this.sendSystemNotification('info', {
                type: 'SYSTEM_STOPPED',
                message: 'LokiAI Production System Stopped',
                uptime: this.getUptime(),
                timestamp: Date.now()
            });
            
        } catch (error) {
            console.error('❌ Failed to stop production agents:', error);
            throw error;
        }
    }

    /**
     * Restart all agents
     */
    async restartAllAgents() {
        console.log('🔄 Restarting all production agents...');
        
        await this.stopAllAgents();
        await this.delay(5000); // Wait 5 seconds
        await this.startAllAgents();
        
        console.log('✅ All production agents restarted');
    }

    /**
     * Start specific agent
     */
    async startAgent(agentName) {
        const agent = this.agents[agentName];
        const status = this.agentStatus.get(agentName);
        
        if (!agent) {
            throw new Error(`Agent not found: ${agentName}`);
        }
        
        if (!status || !status.initialized) {
            throw new Error(`Agent not initialized: ${agentName}`);
        }
        
        if (status.running) {
            console.log(`⚠️ Agent ${agentName} already running`);
            return;
        }
        
        try {
            await agent.start();
            status.running = true;
            status.lastError = null;
            console.log(`✅ ${agentName} started successfully`);
            
        } catch (error) {
            status.running = false;
            status.lastError = error.message;
            console.error(`❌ Failed to start ${agentName}:`, error);
            throw error;
        }
    }

    /**
     * Stop specific agent
     */
    async stopAgent(agentName) {
        const agent = this.agents[agentName];
        const status = this.agentStatus.get(agentName);
        
        if (!agent) {
            throw new Error(`Agent not found: ${agentName}`);
        }
        
        if (!status || !status.running) {
            console.log(`⚠️ Agent ${agentName} not running`);
            return;
        }
        
        try {
            await agent.stop();
            status.running = false;
            console.log(`✅ ${agentName} stopped successfully`);
            
        } catch (error) {
            console.error(`❌ Failed to stop ${agentName}:`, error);
            throw error;
        }
    }

    /**
     * Execute yield optimization
     */
    async executeYieldOptimization(userAddress, tokenAddress, amount, strategyName = null) {
        try {
            return await this.agents.yieldOptimizer.executeRealOptimization({
                protocol: strategyName || 'Aave V3',
                token: tokenAddress,
                apy: 4.5,
                riskScore: 2
            });
        } catch (error) {
            console.error('❌ Yield optimization failed:', error);
            throw error;
        }
    }

    /**
     * Execute arbitrage
     */
    async executeArbitrage(tokenA, tokenB, amount, dexA, dexB) {
        try {
            return await this.agents.arbitrageBot.executeManualArbitrage(tokenA, tokenB, amount, dexA, dexB);
        } catch (error) {
            console.error('❌ Arbitrage execution failed:', error);
            throw error;
        }
    }

    /**
     * Evaluate risk
     */
    async evaluateRisk(userAddress) {
        try {
            // Add user to risk monitoring
            this.agents.riskManager.addUserToMonitoring(userAddress);
            
            return await this.agents.riskManager.performManualRiskAssessment(userAddress);
        } catch (error) {
            console.error('❌ Risk evaluation failed:', error);
            throw error;
        }
    }

    /**
     * Rebalance portfolio
     */
    async rebalancePortfolio(userAddress) {
        try {
            return await this.agents.portfolioRebalancer.manualRebalance(userAddress);
        } catch (error) {
            console.error('❌ Portfolio rebalancing failed:', error);
            throw error;
        }
    }

    /**
     * Create portfolio strategy
     */
    async createPortfolioStrategy(userAddress, strategyName, customAllocations = null) {
        try {
            return await this.agents.portfolioRebalancer.createPortfolioStrategy(
                userAddress, 
                strategyName, 
                customAllocations
            );
        } catch (error) {
            console.error('❌ Portfolio strategy creation failed:', error);
            throw error;
        }
    }

    /**
     * Start health monitoring
     */
    startHealthMonitoring() {
        this.healthCheckTimer = setInterval(async () => {
            await this.performHealthCheck();
        }, this.config.healthCheckInterval);
        
        console.log('🏥 Health monitoring started');
    }

    /**
     * Stop health monitoring
     */
    stopHealthMonitoring() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
        }
        
        console.log('🏥 Health monitoring stopped');
    }

    /**
     * Perform health check on all agents
     */
    async performHealthCheck() {
        try {
            for (const [agentName, agent] of Object.entries(this.agents)) {
                const status = this.agentStatus.get(agentName);
                
                if (status && status.running) {
                    try {
                        // Check if agent is responsive
                        const agentStatus = agent.getStatus();
                        
                        if (!agentStatus.isActive) {
                            console.warn(`⚠️ Agent ${agentName} appears inactive`);
                            
                            // Attempt restart if retry count is below threshold
                            if (status.retryCount < this.config.maxRetries) {
                                console.log(`🔄 Attempting to restart ${agentName} (retry ${status.retryCount + 1})`);
                                status.retryCount++;
                                
                                await this.delay(this.config.retryDelay);
                                await this.restartAgent(agentName);
                            } else {
                                console.error(`❌ Agent ${agentName} exceeded max retries`);
                                status.running = false;
                                status.lastError = 'Max retries exceeded';
                            }
                        } else {
                            // Reset retry count on successful health check
                            status.retryCount = 0;
                        }
                        
                    } catch (error) {
                        console.error(`❌ Health check failed for ${agentName}:`, error);
                        status.lastError = error.message;
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ Health check failed:', error);
        }
    }

    /**
     * Restart specific agent
     */
    async restartAgent(agentName) {
        try {
            await this.stopAgent(agentName);
            await this.delay(2000);
            await this.startAgent(agentName);
        } catch (error) {
            console.error(`❌ Failed to restart ${agentName}:`, error);
            throw error;
        }
    }

    /**
     * Start metrics collection
     */
    startMetricsCollection() {
        this.metricsTimer = setInterval(async () => {
            await this.updateSystemMetrics();
        }, this.config.metricsUpdateInterval);
        
        console.log('📊 Metrics collection started');
    }

    /**
     * Stop metrics collection
     */
    stopMetricsCollection() {
        if (this.metricsTimer) {
            clearInterval(this.metricsTimer);
            this.metricsTimer = null;
        }
        
        console.log('📊 Metrics collection stopped');
    }

    /**
     * Update system metrics
     */
    async updateSystemMetrics() {
        try {
            // Get contract statistics
            const contractStats = await smartContractsService.getContractStats();
            
            // Update metrics from contract data
            if (contractStats.YieldOptimizer?.available) {
                // Update yield optimizer metrics
            }
            
            if (contractStats.ArbitrageBot?.available) {
                // Update arbitrage bot metrics
            }
            
            // Update uptime
            if (this.systemMetrics.startTime) {
                this.systemMetrics.uptime = Date.now() - this.systemMetrics.startTime;
            }
            
        } catch (error) {
            console.error('❌ Failed to update system metrics:', error);
        }
    }

    /**
     * Get system status
     */
    getSystemStatus() {
        const agentStatuses = {};
        
        for (const [agentName, agent] of Object.entries(this.agents)) {
            const status = this.agentStatus.get(agentName);
            agentStatuses[agentName] = {
                ...status,
                agentStatus: agent.getStatus()
            };
        }
        
        return {
            orchestrator: {
                name: this.name,
                version: this.version,
                isInitialized: this.isInitialized,
                isRunning: this.isRunning,
                uptime: this.getUptime(),
                runningAgents: this.getRunningAgentsCount(),
                totalAgents: Object.keys(this.agents).length
            },
            agents: agentStatuses,
            metrics: this.systemMetrics,
            blockchain: {
                contractsConnected: smartContractsService.isReady(),
                networkStatus: 'Connected to Sepolia Testnet'
            }
        };
    }

    /**
     * Get running agents count
     */
    getRunningAgentsCount() {
        let count = 0;
        for (const status of this.agentStatus.values()) {
            if (status.running) count++;
        }
        return count;
    }

    /**
     * Get uptime in milliseconds
     */
    getUptime() {
        return this.systemMetrics.startTime ? Date.now() - this.systemMetrics.startTime : 0;
    }

    /**
     * Send system notification
     */
    async sendSystemNotification(type, data) {
        try {
            const message = this.formatSystemMessage(type, data);
            
            console.log(`📡 SYSTEM ${type.toUpperCase()}: ${message}`);
            
            if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
                await this.sendTelegramNotification(message);
            }
            
            if (process.env.DISCORD_WEBHOOK_URL) {
                await this.sendDiscordNotification(message, type);
            }
            
        } catch (error) {
            console.error('❌ Failed to send system notification:', error);
        }
    }

    /**
     * Format system message
     */
    formatSystemMessage(type, data) {
        switch (data.type) {
            case 'SYSTEM_STARTED':
                return `🚀 ${data.message} | Agents: ${data.agents} | Time: ${new Date(data.timestamp).toISOString()}`;
            case 'SYSTEM_STOPPED':
                return `🔴 ${data.message} | Uptime: ${Math.round(data.uptime / 1000)}s | Time: ${new Date(data.timestamp).toISOString()}`;
            default:
                return `📡 ${data.type}: ${data.message}`;
        }
    }

    /**
     * Send Telegram notification
     */
    async sendTelegramNotification(message) {
        try {
            const fetch = (await import('node-fetch')).default;
            const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
            
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: process.env.TELEGRAM_CHAT_ID,
                    text: `🤖 LokiAI Production System\n\n${message}`,
                    parse_mode: 'HTML'
                })
            });
            
        } catch (error) {
            console.error('❌ Telegram notification failed:', error);
        }
    }

    /**
     * Send Discord notification
     */
    async sendDiscordNotification(message, type) {
        try {
            const fetch = (await import('node-fetch')).default;
            const colors = {
                success: 0x00ff00,
                warning: 0xffaa00,
                error: 0xff0000,
                info: 0x0099ff
            };

            await fetch(process.env.DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    embeds: [{
                        title: '🤖 LokiAI Production System',
                        description: message,
                        color: colors[type] || colors.info,
                        timestamp: new Date().toISOString(),
                        footer: { text: 'LokiAI Production Orchestrator' }
                    }]
                })
            });
            
        } catch (error) {
            console.error('❌ Discord notification failed:', error);
        }
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create singleton instance
const productionAgentOrchestrator = new ProductionAgentOrchestrator();

export default productionAgentOrchestrator;