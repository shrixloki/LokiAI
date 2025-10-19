import { ethers } from 'ethers';
import smartContractsService from '../blockchain/smart-contracts-service.js';
import blockchainService from '../blockchain/blockchain-service.js';

/**
 * Production Arbitrage Bot Agent
 * Real blockchain arbitrage execution with deployed smart contracts
 */
class ArbitrageBotProduction {
    constructor() {
        this.agentId = 'arbitrage-bot-production';
        this.name = 'Arbitrage Bot (Production)';
        this.isActive = false;
        this.opportunities = new Map();
        this.executedTrades = new Map();
        this.executionInterval = null;
        
        // Production configuration
        this.config = {
            executionInterval: parseInt(process.env.ARBITRAGE_INTERVAL) || 30000,
            minProfitThreshold: ethers.parseEther("0.01"), // 0.01 ETH minimum profit
            maxGasPrice: ethers.parseUnits("50", "gwei"),
            maxSlippage: 0.005, // 0.5%
            autoExecute: true,
            maxTradeSize: ethers.parseEther("1.0") // 1 ETH max
        };

        // DEX configurations for Sepolia
        this.dexes = {
            'Uniswap V2': { active: true, fee: 30, riskScore: 3 },
            'Sushiswap': { active: true, fee: 30, riskScore: 3 },
            'PancakeSwap': { active: true, fee: 25, riskScore: 4 },
            'Curve': { active: true, fee: 4, riskScore: 2 }
        };

        // Token pairs to monitor
        this.tokenPairs = [
            { tokenA: 'WETH', tokenB: 'USDC' },
            { tokenA: 'WETH', tokenB: 'DAI' },
            { tokenA: 'USDC', tokenB: 'DAI' },
            { tokenA: 'WETH', tokenB: 'WBTC' }
        ];
    }

    /**
     * Initialize production arbitrage bot
     */
    async initialize() {
        console.log('🚀 Initializing Production Arbitrage Bot...');
        
        try {
            await blockchainService.initialize();
            await smartContractsService.initialize();
            
            if (!smartContractsService.isReady()) {
                throw new Error('Smart contracts service not ready');
            }
            
            console.log('✅ Production Arbitrage Bot initialized');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize Production Arbitrage Bot:', error);
            return false;
        }
    }

    /**
     * Start production arbitrage bot
     */
    async start() {
        if (this.isActive) {
            console.log('⚠️ Production Arbitrage Bot already running');
            return;
        }

        console.log('🟢 Starting Production Arbitrage Bot...');
        this.isActive = true;

        // Start execution loop
        this.executionInterval = setInterval(async () => {
            try {
                await this.executeArbitrageCycle();
            } catch (error) {
                console.error('❌ Arbitrage cycle error:', error);
            }
        }, this.config.executionInterval);

        console.log(`✅ Production Arbitrage Bot started (${this.config.executionInterval}ms interval)`);
    }

    /**
     * Execute arbitrage cycle
     */
    async executeArbitrageCycle() {
        if (!this.isActive) return;

        try {
            console.log('🔄 Executing arbitrage cycle...');
            
            // Check gas prices
            const gasPrice = await this.checkGasPrice();
            if (gasPrice > this.config.maxGasPrice) {
                console.log(`⛽ Gas price too high: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);
                return;
            }
            
            // Scan for arbitrage opportunities
            const opportunities = await this.scanArbitrageOpportunities();
            
            // Execute profitable opportunities
            for (const opportunity of opportunities) {
                if (opportunity.profitPotential >= this.config.minProfitThreshold) {
                    await this.executeArbitrageOpportunity(opportunity);
                    await this.delay(3000); // Prevent nonce issues
                }
            }
            
            this.lastExecution = Date.now();
            
        } catch (error) {
            console.error('❌ Arbitrage cycle failed:', error);
        }
    }

    /**
     * Scan for real arbitrage opportunities
     */
    async scanArbitrageOpportunities() {
        try {
            const opportunities = [];
            
            // Check each token pair across DEXs
            for (const pair of this.tokenPairs) {
                try {
                    const opportunity = await this.detectOpportunityForPair(pair);
                    if (opportunity && opportunity.hasOpportunity) {
                        opportunities.push(opportunity);
                    }
                } catch (error) {
                    console.warn(`⚠️ Error checking pair ${pair.tokenA}/${pair.tokenB}:`, error.message);
                }
            }
            
            // Sort by profit potential
            return opportunities.sort((a, b) => 
                parseFloat(b.profitPotential) - parseFloat(a.profitPotential)
            );
            
        } catch (error) {
            console.error('❌ Failed to scan arbitrage opportunities:', error);
            return [];
        }
    }

    /**
     * Detect opportunity for specific token pair
     */
    async detectOpportunityForPair(pair) {
        try {
            const result = await smartContractsService.detectArbitrageOpportunity(
                this.getTokenAddress(pair.tokenA),
                this.getTokenAddress(pair.tokenB)
            );
            
            if (result.success && result.hasOpportunity) {
                const opportunity = {
                    ...result,
                    tokenA: pair.tokenA,
                    tokenB: pair.tokenB,
                    timestamp: Date.now(),
                    id: `${pair.tokenA}-${pair.tokenB}-${Date.now()}`
                };
                
                // Store opportunity
                this.opportunities.set(opportunity.id, opportunity);
                
                console.log(`💡 Arbitrage opportunity: ${pair.tokenA}/${pair.tokenB}`);
                console.log(`💰 Profit potential: ${result.profitPotential}`);
                console.log(`🔄 DEXs: ${result.dexA} → ${result.dexB}`);
                
                return opportunity;
            }
            
            return null;
            
        } catch (error) {
            console.error(`❌ Failed to detect opportunity for ${pair.tokenA}/${pair.tokenB}:`, error);
            return null;
        }
    }

    /**
     * Execute arbitrage opportunity
     */
    async executeArbitrageOpportunity(opportunity) {
        try {
            console.log(`🚀 Executing arbitrage: ${opportunity.tokenA}/${opportunity.tokenB}`);
            console.log(`💰 Expected profit: ${opportunity.profitPotential}`);
            
            // Calculate optimal trade size
            const tradeSize = this.calculateOptimalTradeSize(opportunity);
            
            // Execute arbitrage via smart contract
            const result = await smartContractsService.executeArbitrage(
                this.getTokenAddress(opportunity.tokenA),
                this.getTokenAddress(opportunity.tokenB),
                tradeSize,
                opportunity.dexA,
                opportunity.dexB
            );
            
            if (result.success) {
                // Store executed trade
                const trade = {
                    id: `trade-${Date.now()}`,
                    opportunityId: opportunity.id,
                    tokenA: opportunity.tokenA,
                    tokenB: opportunity.tokenB,
                    dexA: opportunity.dexA,
                    dexB: opportunity.dexB,
                    amountIn: result.amountIn,
                    amountOut: result.amountOut,
                    profit: result.profit,
                    txHash: result.txHash,
                    blockNumber: result.blockNumber,
                    gasUsed: result.gasUsed,
                    explorerUrl: result.explorerUrl,
                    timestamp: Date.now()
                };
                
                this.executedTrades.set(trade.id, trade);
                
                console.log(`✅ Arbitrage executed successfully!`);
                console.log(`📤 Transaction: ${result.txHash}`);
                console.log(`💰 Actual profit: ${result.profit}`);
                console.log(`🔗 Explorer: ${result.explorerUrl}`);
                console.log(`⛽ Gas used: ${result.gasUsed}`);
                
                // Send notification
                await this.sendNotification('success', {
                    type: 'ARBITRAGE_EXECUTED',
                    tokenA: opportunity.tokenA,
                    tokenB: opportunity.tokenB,
                    profit: result.profit,
                    dexA: opportunity.dexA,
                    dexB: opportunity.dexB,
                    txHash: result.txHash,
                    explorerUrl: result.explorerUrl
                });
                
                return result;
                
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('❌ Arbitrage execution failed:', error);
            
            await this.sendNotification('error', {
                type: 'ARBITRAGE_FAILED',
                tokenA: opportunity.tokenA,
                tokenB: opportunity.tokenB,
                error: error.message
            });
            
            return { success: false, error: error.message };
        }
    }

    /**
     * Calculate optimal trade size
     */
    calculateOptimalTradeSize(opportunity) {
        try {
            // Start with a base amount
            let tradeSize = ethers.parseEther("0.1"); // 0.1 ETH
            
            // Adjust based on profit potential
            const profitPotential = parseFloat(opportunity.profitPotential);
            if (profitPotential > 0.05) { // > 0.05 ETH profit potential
                tradeSize = ethers.parseEther("0.5"); // Increase to 0.5 ETH
            }
            
            // Cap at maximum trade size
            if (tradeSize > this.config.maxTradeSize) {
                tradeSize = this.config.maxTradeSize;
            }
            
            return tradeSize;
            
        } catch (error) {
            console.error('❌ Error calculating trade size:', error);
            return ethers.parseEther("0.1"); // Default fallback
        }
    }

    /**
     * Manual arbitrage execution
     */
    async executeManualArbitrage(tokenA, tokenB, amount, dexA, dexB) {
        try {
            console.log(`🎯 Manual arbitrage: ${tokenA}/${tokenB} (${amount} ETH)`);
            
            const result = await smartContractsService.executeArbitrage(
                this.getTokenAddress(tokenA),
                this.getTokenAddress(tokenB),
                ethers.parseEther(amount.toString()),
                dexA,
                dexB
            );
            
            if (result.success) {
                console.log(`✅ Manual arbitrage successful: ${result.txHash}`);
                
                await this.sendNotification('success', {
                    type: 'MANUAL_ARBITRAGE_EXECUTED',
                    tokenA,
                    tokenB,
                    amount,
                    profit: result.profit,
                    txHash: result.txHash,
                    explorerUrl: result.explorerUrl
                });
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Manual arbitrage failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get arbitrage statistics
     */
    async getArbitrageStats() {
        try {
            const stats = await smartContractsService.getContractStats();
            const arbitrageStats = stats.ArbitrageBot;
            
            if (arbitrageStats && arbitrageStats.available) {
                return {
                    totalVolume: arbitrageStats.stats[0]?.toString() || '0',
                    totalProfit: arbitrageStats.stats[1]?.toString() || '0',
                    totalTrades: arbitrageStats.stats[2]?.toString() || '0',
                    activeDexes: arbitrageStats.stats[3]?.toString() || '0',
                    localTrades: this.executedTrades.size,
                    localOpportunities: this.opportunities.size
                };
            }
            
            return {
                totalVolume: '0',
                totalProfit: '0',
                totalTrades: '0',
                activeDexes: '0',
                localTrades: this.executedTrades.size,
                localOpportunities: this.opportunities.size
            };
            
        } catch (error) {
            console.error('❌ Failed to get arbitrage stats:', error);
            return {
                error: error.message,
                localTrades: this.executedTrades.size,
                localOpportunities: this.opportunities.size
            };
        }
    }

    /**
     * Get recent opportunities
     */
    getRecentOpportunities(limit = 10) {
        const opportunities = Array.from(this.opportunities.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
            
        return opportunities;
    }

    /**
     * Get executed trades
     */
    getExecutedTrades(limit = 10) {
        const trades = Array.from(this.executedTrades.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
            
        return trades;
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
            case 'ARBITRAGE_EXECUTED':
                return `🔄 Arbitrage Executed: ${data.tokenA}/${data.tokenB} via ${data.dexA}→${data.dexB} | Profit: ${data.profit} | TX: ${data.txHash}`;
            case 'MANUAL_ARBITRAGE_EXECUTED':
                return `🎯 Manual Arbitrage: ${data.tokenA}/${data.tokenB} (${data.amount} ETH) | Profit: ${data.profit} | TX: ${data.txHash}`;
            case 'ARBITRAGE_FAILED':
                return `❌ Arbitrage Failed: ${data.tokenA}/${data.tokenB} | Error: ${data.error}`;
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
                    text: `🤖 LokiAI Arbitrage Bot\n\n${message}`,
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
                        title: '🤖 LokiAI Arbitrage Bot',
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
            opportunities: this.opportunities.size,
            executedTrades: this.executedTrades.size,
            config: this.config
        };
    }

    /**
     * Stop agent
     */
    async stop() {
        console.log('🔴 Stopping Production Arbitrage Bot...');
        
        this.isActive = false;
        
        if (this.executionInterval) {
            clearInterval(this.executionInterval);
            this.executionInterval = null;
        }
        
        console.log('✅ Production Arbitrage Bot stopped');
    }
}

// Create singleton instance
const arbitrageBotProduction = new ArbitrageBotProduction();

export default arbitrageBotProduction;