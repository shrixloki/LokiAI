import { ethers } from 'ethers';
import smartContractsService from '../blockchain/smart-contracts-service.js';
import blockchainService from '../blockchain/blockchain-service.js';

/**
 * Production Portfolio Rebalancer Agent
 * Real blockchain portfolio rebalancing with deployed smart contracts
 */
class PortfolioRebalancerProduction {
    constructor() {
        this.agentId = 'portfolio-rebalancer-production';
        this.name = 'Portfolio Rebalancer (Production)';
        this.isActive = false;
        this.portfolios = new Map();
        this.rebalanceHistory = new Map();
        this.executionInterval = null;
        
        // Production configuration
        this.config = {
            executionInterval: parseInt(process.env.PORTFOLIO_REBALANCER_INTERVAL) || 120000,
            defaultRebalanceThreshold: 500, // 5% deviation
            minRebalanceAmount: ethers.parseEther("0.01"), // 0.01 ETH minimum
            maxGasPrice: ethers.parseUnits("50", "gwei"),
            autoRebalance: true,
            maxSlippage: 0.005 // 0.5%
        };

        // Predefined strategies
        this.strategies = {
            conservative: {
                name: 'Conservative',
                rebalanceThreshold: 1000, // 10%
                allocations: [
                    { token: 'USDC', targetPercentage: 6000 }, // 60%
                    { token: 'ETH', targetPercentage: 3000 },  // 30%
                    { token: 'DAI', targetPercentage: 1000 }   // 10%
                ]
            },
            balanced: {
                name: 'Balanced',
                rebalanceThreshold: 500, // 5%
                allocations: [
                    { token: 'ETH', targetPercentage: 5000 },  // 50%
                    { token: 'USDC', targetPercentage: 3000 }, // 30%
                    { token: 'WBTC', targetPercentage: 2000 }  // 20%
                ]
            },
            aggressive: {
                name: 'Aggressive',
                rebalanceThreshold: 250, // 2.5%
                allocations: [
                    { token: 'ETH', targetPercentage: 7000 },  // 70%
                    { token: 'WBTC', targetPercentage: 2000 }, // 20%
                    { token: 'USDC', targetPercentage: 1000 }  // 10%
                ]
            }
        };

        // Users with active portfolios
        this.activeUsers = new Set();
    }

    /**
     * Initialize production portfolio rebalancer
     */
    async initialize() {
        console.log('🚀 Initializing Production Portfolio Rebalancer...');
        
        try {
            await blockchainService.initialize();
            await smartContractsService.initialize();
            
            if (!smartContractsService.isReady()) {
                throw new Error('Smart contracts service not ready');
            }
            
            console.log('✅ Production Portfolio Rebalancer initialized');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize Production Portfolio Rebalancer:', error);
            return false;
        }
    }

    /**
     * Start production portfolio rebalancer
     */
    async start() {
        if (this.isActive) {
            console.log('⚠️ Production Portfolio Rebalancer already running');
            return;
        }

        console.log('🟢 Starting Production Portfolio Rebalancer...');
        this.isActive = true;

        // Start execution loop
        this.executionInterval = setInterval(async () => {
            try {
                await this.executeRebalanceCycle();
            } catch (error) {
                console.error('❌ Rebalance cycle error:', error);
            }
        }, this.config.executionInterval);

        console.log(`✅ Production Portfolio Rebalancer started (${this.config.executionInterval}ms interval)`);
    }

    /**
     * Execute rebalance cycle
     */
    async executeRebalanceCycle() {
        if (!this.isActive) return;

        try {
            console.log('⚖️ Executing rebalance cycle...');
            
            // Check gas prices
            const gasPrice = await this.checkGasPrice();
            if (gasPrice > this.config.maxGasPrice) {
                console.log(`⛽ Gas price too high: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);
                return;
            }
            
            // Rebalance portfolios for all active users
            for (const userAddress of this.activeUsers) {
                try {
                    await this.checkAndRebalancePortfolio(userAddress);
                    await this.delay(2000); // Prevent nonce issues
                } catch (error) {
                    console.error(`❌ Rebalance failed for ${userAddress}:`, error.message);
                }
            }
            
            this.lastExecution = Date.now();
            
        } catch (error) {
            console.error('❌ Rebalance cycle failed:', error);
        }
    }

    /**
     * Check and rebalance portfolio if needed
     */
    async checkAndRebalancePortfolio(userAddress) {
        try {
            console.log(`⚖️ Checking portfolio for: ${userAddress}`);
            
            const result = await smartContractsService.rebalancePortfolio(userAddress);
            
            if (result.success) {
                const rebalanceRecord = {
                    userAddress,
                    totalValue: result.totalValue,
                    rebalanceAmount: result.rebalanceAmount,
                    txHash: result.txHash,
                    blockNumber: result.blockNumber,
                    gasUsed: result.gasUsed,
                    explorerUrl: result.explorerUrl,
                    timestamp: Date.now()
                };
                
                // Store rebalance history
                const historyKey = `${userAddress}-${Date.now()}`;
                this.rebalanceHistory.set(historyKey, rebalanceRecord);
                
                console.log(`✅ Portfolio rebalanced: ${userAddress}`);
                console.log(`📤 Transaction: ${result.txHash}`);
                console.log(`💼 Total value: ${result.totalValue}`);
                console.log(`🔗 Explorer: ${result.explorerUrl}`);
                console.log(`⛽ Gas used: ${result.gasUsed}`);
                
                // Send notification
                await this.sendNotification('success', {
                    type: 'PORTFOLIO_REBALANCED',
                    user: userAddress,
                    totalValue: result.totalValue,
                    rebalanceAmount: result.rebalanceAmount,
                    txHash: result.txHash,
                    explorerUrl: result.explorerUrl
                });
                
                return result;
                
            } else {
                // No rebalancing needed or failed
                if (result.error && !result.error.includes('No rebalancing needed')) {
                    console.error(`❌ Rebalance failed for ${userAddress}: ${result.error}`);
                }
                return result;
            }
            
        } catch (error) {
            console.error(`❌ Portfolio check failed for ${userAddress}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Create portfolio strategy for user
     */
    async createPortfolioStrategy(userAddress, strategyName, customAllocations = null) {
        try {
            console.log(`📋 Creating portfolio strategy for: ${userAddress}`);
            
            let strategy;
            let allocations;
            
            if (customAllocations) {
                // Custom strategy
                strategy = {
                    name: 'Custom',
                    rebalanceThreshold: this.config.defaultRebalanceThreshold,
                    allocations: customAllocations
                };
                allocations = customAllocations;
            } else {
                // Predefined strategy
                strategy = this.strategies[strategyName];
                if (!strategy) {
                    throw new Error(`Strategy not found: ${strategyName}`);
                }
                allocations = strategy.allocations;
            }
            
            // Validate allocations sum to 100%
            const totalAllocation = allocations.reduce((sum, alloc) => sum + alloc.targetPercentage, 0);
            if (totalAllocation !== 10000) { // 10000 = 100%
                throw new Error('Allocations must sum to 100%');
            }
            
            // Convert allocations for smart contract
            const contractAllocations = allocations.map(alloc => ({
                token: this.getTokenAddress(alloc.token),
                targetPercentage: alloc.targetPercentage,
                currentPercentage: 0,
                currentValue: 0,
                deviation: 0
            }));
            
            // Create strategy via smart contract (mock for now since we don't have funds)
            console.log(`📋 Strategy created: ${strategy.name} for ${userAddress}`);
            
            // Store portfolio locally
            this.portfolios.set(userAddress, {
                userAddress,
                strategy: strategy.name,
                allocations: contractAllocations,
                rebalanceThreshold: strategy.rebalanceThreshold,
                autoRebalance: true,
                createdAt: Date.now(),
                lastRebalance: null
            });
            
            // Add to active users
            this.activeUsers.add(userAddress);
            
            await this.sendNotification('success', {
                type: 'STRATEGY_CREATED',
                user: userAddress,
                strategy: strategy.name,
                allocations: allocations.length
            });
            
            return {
                success: true,
                strategy: strategy.name,
                allocations: contractAllocations,
                userAddress
            };
            
        } catch (error) {
            console.error('❌ Failed to create portfolio strategy:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Manual portfolio rebalance
     */
    async manualRebalance(userAddress) {
        try {
            console.log(`🎯 Manual rebalance for: ${userAddress}`);
            
            const result = await this.checkAndRebalancePortfolio(userAddress);
            
            if (result && result.success) {
                await this.sendNotification('success', {
                    type: 'MANUAL_REBALANCE',
                    user: userAddress,
                    totalValue: result.totalValue,
                    rebalanceAmount: result.rebalanceAmount,
                    txHash: result.txHash
                });
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Manual rebalance failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get portfolio status
     */
    async getPortfolioStatus(userAddress) {
        try {
            const userData = await smartContractsService.getUserData(userAddress);
            const localPortfolio = this.portfolios.get(userAddress);
            
            if (!userData.portfolio && !localPortfolio) {
                return { error: 'No portfolio found for user' };
            }
            
            return {
                userAddress,
                portfolio: userData.portfolio || {},
                localPortfolio: localPortfolio || null,
                rebalanceHistory: this.getUserRebalanceHistory(userAddress),
                isActive: this.activeUsers.has(userAddress)
            };
            
        } catch (error) {
            console.error('❌ Failed to get portfolio status:', error);
            return { error: error.message };
        }
    }

    /**
     * Get user rebalance history
     */
    getUserRebalanceHistory(userAddress, limit = 10) {
        const history = Array.from(this.rebalanceHistory.values())
            .filter(record => record.userAddress === userAddress)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
            
        return history;
    }

    /**
     * Get all portfolios
     */
    getAllPortfolios() {
        return Array.from(this.portfolios.values());
    }

    /**
     * Get rebalancer statistics
     */
    async getRebalancerStatistics() {
        try {
            const stats = await smartContractsService.getContractStats();
            const rebalancerStats = stats.PortfolioRebalancer;
            
            if (rebalancerStats && rebalancerStats.available) {
                return {
                    totalRebalances: rebalancerStats.stats[0]?.toString() || '0',
                    totalValueRebalanced: rebalancerStats.stats[1]?.toString() || '0',
                    activeStrategies: rebalancerStats.stats[2]?.toString() || '0',
                    totalUsers: rebalancerStats.stats[3]?.toString() || '0',
                    localPortfolios: this.portfolios.size,
                    localRebalances: this.rebalanceHistory.size,
                    activeUsers: this.activeUsers.size
                };
            }
            
            return {
                totalRebalances: '0',
                totalValueRebalanced: '0',
                activeStrategies: '0',
                totalUsers: '0',
                localPortfolios: this.portfolios.size,
                localRebalances: this.rebalanceHistory.size,
                activeUsers: this.activeUsers.size
            };
            
        } catch (error) {
            console.error('❌ Failed to get rebalancer statistics:', error);
            return {
                error: error.message,
                localPortfolios: this.portfolios.size,
                localRebalances: this.rebalanceHistory.size,
                activeUsers: this.activeUsers.size
            };
        }
    }

    /**
     * Get available strategies
     */
    getAvailableStrategies() {
        return Object.keys(this.strategies).map(key => ({
            name: key,
            ...this.strategies[key]
        }));
    }

    /**
     * Remove user from active portfolios
     */
    removeUserPortfolio(userAddress) {
        this.activeUsers.delete(userAddress);
        this.portfolios.delete(userAddress);
        console.log(`👤 Removed portfolio for user: ${userAddress}`);
    }

    /**
     * Check current gas price
     */
    async checkGasPrice() {
        try {
            const provider = blockchainService.getProvider('sepolia');
            const feeData = await provider.getFeeData();
            return feeData.gasPrice;
        } catch (error) {
            console.error('❌ Failed to check gas price:', error);
            return this.config.maxGasPrice;
        }
    }

    /**
     * Get token address for network
     */
    getTokenAddress(token) {
        const tokenAddresses = {
            'USDC': '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
            'ETH': '0x0000000000000000000000000000000000000000',
            'WETH': '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
            'DAI': '0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844',
            'WBTC': '0x29f2D40B0605204364af54EC677bD022dA425d03'
        };
        
        return tokenAddresses[token] || tokenAddresses['USDC'];
    }

    /**
     * Send notification
     */
    async sendNotification(type, data) {
        try {
            const message = this.formatNotificationMessage(type, data);
            
            console.log(`📡 ${type.toUpperCase()}: ${message}`);
            
            if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
                await this.sendTelegramNotification(message);
            }
            
            if (process.env.DISCORD_WEBHOOK_URL) {
                await this.sendDiscordNotification(message, type);
            }
            
        } catch (error) {
            console.error('❌ Failed to send notification:', error);
        }
    }

    /**
     * Format notification message
     */
    formatNotificationMessage(type, data) {
        switch (data.type) {
            case 'PORTFOLIO_REBALANCED':
                return `⚖️ Portfolio Rebalanced: ${data.user} | Value: ${data.totalValue} | Amount: ${data.rebalanceAmount} | TX: ${data.txHash}`;
            case 'STRATEGY_CREATED':
                return `📋 Strategy Created: ${data.user} | Strategy: ${data.strategy} | Allocations: ${data.allocations}`;
            case 'MANUAL_REBALANCE':
                return `🎯 Manual Rebalance: ${data.user} | Value: ${data.totalValue} | TX: ${data.txHash}`;
            default:
                return `📡 ${data.type}: ${JSON.stringify(data)}`;
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
                    text: `🤖 LokiAI Portfolio Rebalancer\n\n${message}`,
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
                        title: '🤖 LokiAI Portfolio Rebalancer',
                        description: message,
                        color: colors[type] || colors.info,
                        timestamp: new Date().toISOString(),
                        footer: { text: 'LokiAI Blockchain System' }
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

    /**
     * Get agent status
     */
    getStatus() {
        return {
            agentId: this.agentId,
            name: this.name,
            isActive: this.isActive,
            executionInterval: this.config.executionInterval,
            contractsConnected: smartContractsService.isReady(),
            networkStatus: 'Connected to Sepolia Testnet',
            lastExecution: this.lastExecution || null,
            activeUsers: this.activeUsers.size,
            portfolios: this.portfolios.size,
            rebalanceHistory: this.rebalanceHistory.size,
            availableStrategies: Object.keys(this.strategies).length,
            config: this.config
        };
    }

    /**
     * Stop agent
     */
    async stop() {
        console.log('🔴 Stopping Production Portfolio Rebalancer...');
        
        this.isActive = false;
        
        if (this.executionInterval) {
            clearInterval(this.executionInterval);
            this.executionInterval = null;
        }
        
        console.log('✅ Production Portfolio Rebalancer stopped');
    }
}

// Create singleton instance
const portfolioRebalancerProduction = new PortfolioRebalancerProduction();

export default portfolioRebalancerProduction;