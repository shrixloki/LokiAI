import defiIntegrations from '../blockchain/protocols/defi-integrations.js';
import priceFeedService from '../blockchain/price-feed-service.js';
import contractManager from '../blockchain/contracts/contract-manager.js';
import transactionService from '../blockchain/transaction-service.js';
import walletService from '../blockchain/wallet-service.js';

/**
 * Yield Optimizer Agent
 * Automatically finds and executes optimal yield farming strategies
 */
class YieldOptimizerAgent {
    constructor() {
        this.name = 'Yield Optimizer';
        this.isActive = false;
        this.strategies = new Map();
        this.positions = new Map();
        this.minYieldThreshold = 0.05; // 5% APY minimum
        this.maxPositionSize = 0.1; // 10% of portfolio max
        this.rebalanceThreshold = 0.02; // 2% yield difference to trigger rebalance
    }

    /**
     * Start the yield optimizer agent
     */
    async start(config = {}) {
        if (this.isActive) {
            throw new Error('Yield Optimizer already active');
        }

        this.config = {
            networks: ['ethereum', 'polygon'],
            assets: ['USDC', 'USDT', 'DAI'],
            protocols: ['aave'],
            maxPositionSize: config.maxPositionSize || this.maxPositionSize,
            minYieldThreshold: config.minYieldThreshold || this.minYieldThreshold,
            checkInterval: config.checkInterval || 300000, // 5 minutes
            ...config
        };

        this.isActive = true;
        console.log('🌀 Yield Optimizer Agent started');
        
        // Start monitoring cycle
        this.monitoringInterval = setInterval(() => {
            this.executeOptimizationCycle().catch(error => {
                console.error('❌ Yield optimization cycle failed:', error.message);
            });
        }, this.config.checkInterval);

        // Initial scan
        await this.executeOptimizationCycle();
    }

    /**
     * Stop the yield optimizer agent
     */
    stop() {
        if (!this.isActive) return;

        this.isActive = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        console.log('🛑 Yield Optimizer Agent stopped');
    }

    /**
     * Execute optimization cycle
     */
    async executeOptimizationCycle() {
        if (!this.isActive) return;

        try {
            console.log('🔍 Starting yield optimization cycle...');

            // Scan for opportunities across all configured networks
            const opportunities = await this.scanYieldOpportunities();
            
            // Analyze current positions
            const currentPositions = await this.analyzeCurrentPositions();
            
            // Find optimization actions
            const actions = await this.findOptimizationActions(opportunities, currentPositions);
            
            // Execute actions
            if (actions.length > 0) {
                await this.executeOptimizationActions(actions);
            }

            console.log(`✅ Yield optimization cycle completed. Found ${opportunities.length} opportunities, executed ${actions.length} actions.`);

        } catch (error) {
            console.error('❌ Yield optimization cycle failed:', error.message);
            throw error;
        }
    }

    /**
     * Scan for yield opportunities across networks and protocols
     */
    async scanYieldOpportunities() {
        const opportunities = [];

        for (const network of this.config.networks) {
            for (const asset of this.config.assets) {
                try {
                    // Check Aave yields
                    if (this.config.protocols.includes('aave')) {
                        const aaveYield = await this.getAaveYield(network, asset);
                        if (aaveYield && aaveYield.apy >= this.config.minYieldThreshold) {
                            opportunities.push(aaveYield);
                        }
                    }

                    // Add other protocols as needed
                    
                } catch (error) {
                    console.warn(`⚠️ Failed to scan ${asset} on ${network}:`, error.message);
                }
            }
        }

        return opportunities.sort((a, b) => b.apy - a.apy);
    }

    /**
     * Get Aave yield information
     */
    async getAaveYield(network, asset) {
        try {
            const reserveData = await defiIntegrations.getAaveReserveData(network, asset);
            
            // Convert liquidity rate to APY (simplified calculation)
            const liquidityRate = Number(reserveData.liquidityRate) / 1e27; // Ray format
            const apy = liquidityRate * 100; // Convert to percentage

            if (apy < this.config.minYieldThreshold) {
                return null;
            }

            return {
                protocol: 'aave',
                network,
                asset,
                apy,
                liquidityRate: reserveData.liquidityRate,
                aTokenAddress: reserveData.aTokenAddress,
                risk: this.calculateRisk('aave', network, asset),
                tvl: await this.estimateTVL(network, asset, 'aave'),
                timestamp: new Date()
            };

        } catch (error) {
            throw new Error(`Failed to get Aave yield for ${asset} on ${network}: ${error.message}`);
        }
    }

    /**
     * Analyze current positions
     */
    async analyzeCurrentPositions() {
        const positions = [];

        for (const network of this.config.networks) {
            try {
                const walletAddress = walletService.getServerWallet(network).address;
                
                // Check Aave positions
                const aavePositions = await this.getAavePositions(network, walletAddress);
                positions.push(...aavePositions);

            } catch (error) {
                console.warn(`⚠️ Failed to analyze positions on ${network}:`, error.message);
            }
        }

        return positions;
    }

    /**
     * Get Aave positions for a wallet
     */
    async getAavePositions(network, walletAddress) {
        try {
            const accountData = await defiIntegrations.getAaveUserAccountData(network, walletAddress);
            const positions = [];

            // Get detailed position data for each asset
            for (const asset of this.config.assets) {
                try {
                    const dataProvider = contractManager.getContract(network, 'aavePoolDataProvider', 'AaveV3DataProvider');
                    const assetAddress = contractManager.getTokenContract(network, asset).target;
                    
                    const userReserveData = await dataProvider.getUserReserveData(assetAddress, walletAddress);
                    
                    if (Number(userReserveData.currentATokenBalance) > 0) {
                        const currentYield = await this.getAaveYield(network, asset);
                        
                        positions.push({
                            protocol: 'aave',
                            network,
                            asset,
                            balance: userReserveData.currentATokenBalance.toString(),
                            currentYield: currentYield ? currentYield.apy : 0,
                            healthFactor: Number(accountData.healthFactor) / 1e18,
                            canOptimize: true
                        });
                    }
                } catch (error) {
                    console.warn(`⚠️ Failed to get ${asset} position data:`, error.message);
                }
            }

            return positions;

        } catch (error) {
            throw new Error(`Failed to get Aave positions: ${error.message}`);
        }
    }

    /**
     * Find optimization actions
     */
    async findOptimizationActions(opportunities, currentPositions) {
        const actions = [];

        // Find new opportunities to enter
        for (const opportunity of opportunities) {
            const existingPosition = currentPositions.find(p => 
                p.protocol === opportunity.protocol && 
                p.network === opportunity.network && 
                p.asset === opportunity.asset
            );

            if (!existingPosition) {
                // New opportunity
                const availableBalance = await this.getAvailableBalance(opportunity.network, opportunity.asset);
                if (Number(availableBalance.balanceFormatted) > 0) {
                    actions.push({
                        type: 'enter',
                        opportunity,
                        amount: this.calculateOptimalAmount(availableBalance, opportunity)
                    });
                }
            } else {
                // Check if we should increase position
                const yieldDifference = opportunity.apy - existingPosition.currentYield;
                if (yieldDifference > this.rebalanceThreshold) {
                    const availableBalance = await this.getAvailableBalance(opportunity.network, opportunity.asset);
                    if (Number(availableBalance.balanceFormatted) > 0) {
                        actions.push({
                            type: 'increase',
                            opportunity,
                            currentPosition: existingPosition,
                            amount: this.calculateOptimalAmount(availableBalance, opportunity)
                        });
                    }
                }
            }
        }

        // Find positions to exit or reduce
        for (const position of currentPositions) {
            const betterOpportunity = opportunities.find(opp => 
                opp.asset === position.asset && 
                opp.apy > position.currentYield + this.rebalanceThreshold
            );

            if (betterOpportunity && betterOpportunity.network !== position.network) {
                actions.push({
                    type: 'migrate',
                    from: position,
                    to: betterOpportunity,
                    amount: position.balance
                });
            }
        }

        return actions;
    }

    /**
     * Execute optimization actions
     */
    async executeOptimizationActions(actions) {
        const results = [];

        for (const action of actions) {
            try {
                let result;
                
                switch (action.type) {
                    case 'enter':
                        result = await this.enterPosition(action);
                        break;
                    case 'increase':
                        result = await this.increasePosition(action);
                        break;
                    case 'migrate':
                        result = await this.migratePosition(action);
                        break;
                    default:
                        throw new Error(`Unknown action type: ${action.type}`);
                }

                results.push({ action, result, success: true });
                console.log(`✅ Executed ${action.type} action for ${action.opportunity?.asset || action.from?.asset}`);

            } catch (error) {
                results.push({ action, error: error.message, success: false });
                console.error(`❌ Failed to execute ${action.type} action:`, error.message);
            }
        }

        return results;
    }

    /**
     * Enter new yield position
     */
    async enterPosition(action) {
        const { opportunity, amount } = action;
        const { protocol, network, asset } = opportunity;

        if (protocol === 'aave') {
            // Approve token spending
            const tokenContract = contractManager.getTokenContractWithSigner(
                network, 
                asset, 
                walletService.getServerWallet(network)
            );
            
            const poolAddress = contractManager.getContract(network, 'aavePool').target;
            const approveTx = await tokenContract.approve(poolAddress, amount);
            await approveTx.wait();

            // Supply to Aave
            const supplyResult = await defiIntegrations.supplyToAave(
                network,
                walletService.getServerWallet(network),
                asset,
                amount
            );

            return {
                type: 'enter',
                protocol,
                network,
                asset,
                amount: amount.toString(),
                txHash: supplyResult.hash,
                timestamp: new Date()
            };
        }

        throw new Error(`Protocol ${protocol} not supported for entering positions`);
    }

    /**
     * Increase existing position
     */
    async increasePosition(action) {
        // Similar to enterPosition but with additional logic for existing positions
        return await this.enterPosition(action);
    }

    /**
     * Migrate position between networks/protocols
     */
    async migratePosition(action) {
        const { from, to, amount } = action;

        // First withdraw from current position
        const withdrawResult = await this.exitPosition(from, amount);
        
        // Then enter new position
        const enterResult = await this.enterPosition({
            opportunity: to,
            amount: withdrawResult.amountReceived
        });

        return {
            type: 'migrate',
            from,
            to,
            withdrawTx: withdrawResult.txHash,
            enterTx: enterResult.txHash,
            timestamp: new Date()
        };
    }

    /**
     * Exit position
     */
    async exitPosition(position, amount) {
        const { protocol, network, asset } = position;

        if (protocol === 'aave') {
            const withdrawResult = await defiIntegrations.withdrawFromAave(
                network,
                walletService.getServerWallet(network),
                asset,
                amount
            );

            return {
                type: 'exit',
                protocol,
                network,
                asset,
                amount: amount.toString(),
                txHash: withdrawResult.hash,
                amountReceived: amount, // Simplified - should get actual amount from receipt
                timestamp: new Date()
            };
        }

        throw new Error(`Protocol ${protocol} not supported for exiting positions`);
    }

    /**
     * Get available balance for an asset
     */
    async getAvailableBalance(network, asset) {
        const walletAddress = walletService.getServerWallet(network).address;
        return await contractManager.getTokenBalance(network, asset, walletAddress);
    }

    /**
     * Calculate optimal amount to invest
     */
    calculateOptimalAmount(availableBalance, opportunity) {
        const balance = BigInt(availableBalance.balance);
        const maxAmount = balance * BigInt(Math.floor(this.config.maxPositionSize * 100)) / 100n;
        
        // Consider risk and yield when determining amount
        const riskAdjustment = 1 - (opportunity.risk / 100);
        const adjustedAmount = BigInt(Math.floor(Number(maxAmount) * riskAdjustment));
        
        return adjustedAmount > 0n ? adjustedAmount : balance / 10n; // Minimum 10% if risk-adjusted is too low
    }

    /**
     * Calculate risk score for a protocol/asset combination
     */
    calculateRisk(protocol, network, asset) {
        // Simplified risk calculation
        const baseRisk = {
            'aave': 15, // 15% base risk
            'compound': 20,
            'curve': 25
        };

        const networkRisk = {
            'ethereum': 0,
            'polygon': 5,
            'bsc': 10,
            'arbitrum': 3
        };

        const assetRisk = {
            'USDC': 0,
            'USDT': 2,
            'DAI': 1,
            'ETH': 15,
            'BTC': 20
        };

        return (baseRisk[protocol] || 30) + (networkRisk[network] || 10) + (assetRisk[asset] || 5);
    }

    /**
     * Estimate TVL for a protocol/asset
     */
    async estimateTVL(network, asset, protocol) {
        try {
            if (protocol === 'aave') {
                const dataProvider = contractManager.getContract(network, 'aavePoolDataProvider', 'AaveV3DataProvider');
                const assetAddress = contractManager.getTokenContract(network, asset).target;
                const reserveData = await dataProvider.getReserveData(assetAddress);
                return Number(reserveData.totalAToken) / 1e18; // Simplified
            }
            return 0;
        } catch (error) {
            console.warn(`⚠️ Failed to estimate TVL:`, error.message);
            return 0;
        }
    }

    /**
     * Get agent status and statistics
     */
    getStatus() {
        return {
            name: this.name,
            isActive: this.isActive,
            config: this.config,
            strategies: this.strategies.size,
            positions: this.positions.size,
            lastCycle: this.lastCycleTime,
            performance: this.calculatePerformance(),
            timestamp: new Date()
        };
    }

    /**
     * Calculate performance metrics
     */
    calculatePerformance() {
        // Simplified performance calculation
        return {
            totalYieldEarned: 0,
            averageAPY: 0,
            successfulOptimizations: 0,
            failedOptimizations: 0
        };
    }
}

// Create singleton instance
const yieldOptimizerAgent = new YieldOptimizerAgent();

export default yieldOptimizerAgent;