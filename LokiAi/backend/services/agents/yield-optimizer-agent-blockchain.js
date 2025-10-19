import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { ethers } from 'ethers';
import smartContractsService from '../blockchain/smart-contracts-service.js';
import defiIntegrations from '../blockchain/protocols/defi-integrations.js';
import priceFeedService from '../blockchain/price-feed-service.js';
import contractManager from '../blockchain/contracts/contract-manager.js';
import contractRegistry from '../blockchain/contracts/contract-registry.js';
import transactionService from '../blockchain/transaction-service.js';
import walletService from '../blockchain/wallet-service.js';
import gasService from '../blockchain/gas-service.js';
import blockchainService from '../blockchain/blockchain-service.js';

/**
 * Yield Optimizer Agent - Blockchain Integrated Version
 * Finds and executes optimal yield farming strategies on-chain
 * Integrates with deployed smart contracts for real blockchain execution
 */
class YieldOptimizerAgentBlockchain extends EventEmitter {
    constructor() {
        super();
        this.agentId = 'yield-optimizer-blockchain';
        this.name = 'Yield Optimizer (Blockchain)';
        this.version = '2.0.0';
        this.isActive = false;
        this.isRunning = false;
        
        // Agent configuration
        this.config = {
            scanInterval: 60000, // 1 minute
            minYieldThreshold: 0.05, // 5% APY minimum
            maxRiskLevel: 0.7, // 70% max risk
            maxPositionSize: 0.3, // 30% of portfolio max
            compoundThreshold: 0.01, // 1% minimum to compound
            gasOptimization: true,
            autoCompound: true,
            emergencyExitThreshold: 0.15 // 15% loss triggers exit
        };

        // Current positions and performance tracking
        this.positions = new Map();
        this.yieldHistory = [];
        this.totalYieldEarned = 0;
        this.scanTimer = null;
        this.compoundTimer = null;
        this.performanceTracker = null;
        
        // Performance tracking configuration
        this.performanceConfig = {
            trackingInterval: 300000, // 5 minutes
            historyRetention: 1000, // Keep 1000 data points
            benchmarkAPY: 0.04, // 4% benchmark APY
            alertThresholds: {
                underperformance: -0.02, // -2% vs benchmark
                excellentPerformance: 0.05 // +5% vs benchmark
            }
        };

        // Supported protocols for yield farming
        this.supportedProtocols = [
            'aave-v3',
            'compound-v3',
            'curve-pools',
            'yearn-vaults',
            'convex-finance'
        ];

        this.init();
    }

    async init() {
        try {
            console.log(`[${this.name}] Initializing blockchain yield optimizer...`);
            
            // Initialize blockchain connections
            await this.initializeBlockchainServices();
            
            // Load existing positions from blockchain
            await this.loadExistingPositions();
            
            console.log(`[${this.name}] Initialization complete`);
            this.emit('initialized');
        } catch (error) {
            console.error(`[${this.name}] Initialization failed:`, error);
            this.emit('error', error);
        }
    }

    async initializeBlockchainServices() {
        // Ensure all blockchain services are ready
        await smartContractsService.initialize();
        await defiIntegrations.initialize();
        await priceFeedService.initialize();
        await contractManager.initialize();
    }

    async loadExistingPositions() {
        try {
            const walletAddress = await walletService.getAddress();
            
            // Load positions from each supported protocol
            for (const protocol of this.supportedProtocols) {
                const positions = await defiIntegrations.getPositions(protocol, walletAddress);
                
                for (const position of positions) {
                    this.positions.set(position.id, {
                        ...position,
                        protocol,
                        entryTime: new Date(position.timestamp),
                        lastCompound: new Date(position.lastCompound || position.timestamp)
                    });
                }
            }

            console.log(`[${this.name}] Loaded ${this.positions.size} existing positions`);
        } catch (error) {
            console.error(`[${this.name}] Failed to load existing positions:`, error);
        }
    }

    async start() {
        if (this.isRunning) {
            console.log(`[${this.name}] Already running`);
            return;
        }

        try {
            console.log(`[${this.name}] Starting yield optimization agent...`);
            this.isRunning = true;
            this.isActive = true;

            // Start yield opportunity scanning
            await this.startYieldScanning();
            
            // Start auto-compound monitoring
            await this.startAutoCompounding();
            
            // Start performance tracking
            await this.startPerformanceTracking();

            // Start automated monitoring for unstaking conditions
            await this.startAutomatedMonitoring();

            console.log(`[${this.name}] Agent started successfully with automated staking/unstaking`);
            this.emit('started');
        } catch (error) {
            console.error(`[${this.name}] Failed to start:`, error);
            this.isRunning = false;
            this.isActive = false;
            this.emit('error', error);
        }
    }

    async stop() {
        console.log(`[${this.name}] Stopping yield optimization agent...`);
        
        this.isRunning = false;
        this.isActive = false;

        // Clear timers
        if (this.scanTimer) {
            clearInterval(this.scanTimer);
            this.scanTimer = null;
        }

        if (this.compoundTimer) {
            clearInterval(this.compoundTimer);
            this.compoundTimer = null;
        }
        
        if (this.performanceTracker) {
            clearInterval(this.performanceTracker);
            this.performanceTracker = null;
        }

        // Stop automated monitoring
        await this.stopAutomatedMonitoring();

        console.log(`[${this.name}] Agent stopped`);
        this.emit('stopped');
    }

    async startYieldScanning() {
        // Initial scan
        await this.scanYieldOpportunities();

        // Set up periodic scanning
        this.scanTimer = setInterval(async () => {
            if (this.isRunning) {
                await this.scanYieldOpportunities();
            }
        }, this.config.scanInterval);
    }

    async startAutoCompounding() {
        // Check for compound opportunities every 30 minutes
        this.compoundTimer = setInterval(async () => {
            if (this.isRunning && this.config.autoCompound) {
                await this.checkAndExecuteCompounding();
            }
        }, 30 * 60 * 1000); // 30 minutes
    }

    async startPerformanceTracking() {
        // Initial performance snapshot
        await this.capturePerformanceSnapshot();

        // Set up periodic performance tracking
        this.performanceTracker = setInterval(async () => {
            if (this.isRunning) {
                await this.capturePerformanceSnapshot();
                await this.analyzePerformanceTrends();
            }
        }, this.performanceConfig.trackingInterval);
    }

    async scanYieldOpportunities() {
        try {
            console.log(`[${this.name}] Scanning yield opportunities...`);

            const opportunities = [];
            
            // Scan each supported protocol
            for (const protocol of this.supportedProtocols) {
                try {
                    const protocolOpportunities = await this.scanProtocolOpportunities(protocol);
                    opportunities.push(...protocolOpportunities);
                } catch (error) {
                    console.error(`[${this.name}] Error scanning ${protocol}:`, error);
                }
            }

            // Filter and rank opportunities
            const viableOpportunities = opportunities
                .filter(opp => opp.apy >= this.config.minYieldThreshold)
                .filter(opp => opp.riskScore <= this.config.maxRiskLevel)
                .sort((a, b) => this.calculateOpportunityScore(b) - this.calculateOpportunityScore(a));

            console.log(`[${this.name}] Found ${viableOpportunities.length} viable opportunities`);

            // Execute top opportunities if we have available capital
            await this.evaluateAndExecuteOpportunities(viableOpportunities);

            this.emit('scan-complete', {
                totalOpportunities: opportunities.length,
                viableOpportunities: viableOpportunities.length,
                topOpportunity: viableOpportunities[0] || null
            });

        } catch (error) {
            console.error(`[${this.name}] Error during yield scanning:`, error);
            this.emit('error', error);
        }
    }

    async scanProtocolOpportunities(protocol) {
        switch (protocol) {
            case 'aave-v3':
                return await this.scanAaveOpportunities();
            case 'compound-v3':
                return await this.scanCompoundOpportunities();
            case 'curve-pools':
                return await this.scanCurveOpportunities();
            case 'yearn-vaults':
                return await this.scanYearnOpportunities();
            case 'convex-finance':
                return await this.scanConvexOpportunities();
            default:
                return [];
        }
    }

    async scanAaveOpportunities() {
        try {
            const markets = await defiIntegrations.aave.getMarkets();
            const opportunities = [];

            for (const market of markets) {
                const apy = await defiIntegrations.aave.getSupplyAPY(market.asset);
                const liquidity = await defiIntegrations.aave.getAvailableLiquidity(market.asset);
                
                if (apy > this.config.minYieldThreshold && liquidity > 1000) {
                    opportunities.push({
                        protocol: 'aave-v3',
                        asset: market.asset,
                        apy: apy,
                        liquidity: liquidity,
                        riskScore: this.calculateRiskScore('aave-v3', market.asset),
                        action: 'supply',
                        gasEstimate: await this.estimateGasCost('aave-supply')
                    });
                }
            }

            return opportunities;
        } catch (error) {
            console.error(`[${this.name}] Error scanning Aave:`, error);
            return [];
        }
    }

    async scanCompoundOpportunities() {
        // Similar implementation for Compound V3
        return [];
    }

    async scanCurveOpportunities() {
        try {
            const pools = await defiIntegrations.curve.getPools();
            const opportunities = [];

            for (const pool of pools) {
                const apy = await defiIntegrations.curve.getPoolAPY(pool.address);
                const tvl = await defiIntegrations.curve.getPoolTVL(pool.address);
                
                if (apy > this.config.minYieldThreshold && tvl > 100000) {
                    opportunities.push({
                        protocol: 'curve-pools',
                        pool: pool.address,
                        assets: pool.coins,
                        apy: apy,
                        tvl: tvl,
                        riskScore: this.calculateRiskScore('curve-pools', pool.address),
                        action: 'add-liquidity',
                        gasEstimate: await this.estimateGasCost('curve-deposit')
                    });
                }
            }

            return opportunities;
        } catch (error) {
            console.error(`[${this.name}] Error scanning Curve:`, error);
            return [];
        }
    }

    async scanYearnOpportunities() {
        // Implementation for Yearn vaults
        return [];
    }

    async scanConvexOpportunities() {
        // Implementation for Convex Finance
        return [];
    }

    calculateOpportunityScore(opportunity) {
        // Score based on APY, risk, and liquidity
        const apyScore = opportunity.apy * 100;
        const riskPenalty = opportunity.riskScore * 50;
        const liquidityBonus = Math.min(opportunity.liquidity / 1000000, 10);
        
        return apyScore - riskPenalty + liquidityBonus;
    }

    calculateRiskScore(protocol, asset) {
        // Simple risk scoring - can be enhanced with more sophisticated models
        const protocolRisk = {
            'aave-v3': 0.2,
            'compound-v3': 0.25,
            'curve-pools': 0.3,
            'yearn-vaults': 0.35,
            'convex-finance': 0.4
        };

        const assetRisk = {
            'USDC': 0.1,
            'USDT': 0.15,
            'DAI': 0.1,
            'WETH': 0.3,
            'WBTC': 0.35
        };

        return (protocolRisk[protocol] || 0.5) + (assetRisk[asset] || 0.4);
    }

    async evaluateAndExecuteOpportunities(opportunities) {
        const walletBalance = await walletService.getBalance();
        const availableCapital = walletBalance * (1 - this.getTotalPositionRatio());

        for (const opportunity of opportunities.slice(0, 3)) { // Top 3 opportunities
            const positionSize = Math.min(
                availableCapital * this.config.maxPositionSize,
                opportunity.liquidity * 0.1 // Max 10% of available liquidity
            );

            if (positionSize > 100) { // Minimum $100 position
                await this.executeStakeTransaction(opportunity, positionSize);
            }
        }
    }

    async executeStakeTransaction(opportunity, amount) {
        try {
            console.log(`[${this.name}] Executing stake: ${opportunity.protocol} - ${amount} ${opportunity.asset}`);

            const transactionId = uuidv4();
            const walletAddress = await walletService.getAddress();
            
            // Pre-execution validation
            await this.validateStakeTransaction(opportunity, amount);
            
            let txHash;
            let txData = {};

            // Execute based on protocol with enhanced logic
            switch (opportunity.protocol) {
                case 'aave-v3':
                    txHash = await this.executeAaveStake(opportunity, amount, walletAddress);
                    break;
                case 'curve-pools':
                    txHash = await this.executeCurveStake(opportunity, amount, walletAddress);
                    break;
                case 'compound-v3':
                    txHash = await this.executeCompoundStake(opportunity, amount, walletAddress);
                    break;
                case 'yearn-vaults':
                    txHash = await this.executeYearnStake(opportunity, amount, walletAddress);
                    break;
                default:
                    // Fallback to smart contract execution
                    txHash = await this.executeSmartContractStake(opportunity, amount, walletAddress);
            }

            // Calculate gas costs for tracking
            const gasUsed = await this.calculateTransactionGasCost(txHash);

            // Track the new position with enhanced data
            const position = {
                id: transactionId,
                protocol: opportunity.protocol,
                asset: opportunity.asset || opportunity.pool,
                amount: amount,
                entryAPY: opportunity.apy,
                entryTime: new Date(),
                txHash: txHash,
                status: 'active',
                lastCompound: new Date(),
                gasCosts: gasUsed,
                riskScore: opportunity.riskScore,
                expectedYield: this.calculateExpectedYield(amount, opportunity.apy),
                autoCompoundEnabled: this.config.autoCompound,
                emergencyExitThreshold: this.config.emergencyExitThreshold
            };

            this.positions.set(transactionId, position);

            // Update performance tracking
            await this.updatePerformanceMetrics('stake', position);

            console.log(`[${this.name}] Stake executed successfully: ${txHash}`);
            
            this.emit('stake-executed', {
                position,
                txHash,
                opportunity,
                gasUsed,
                explorerUrl: this.getExplorerUrl(txHash)
            });

            // Send notifications
            await this.sendStakeNotification(position, opportunity);

            return txHash;

        } catch (error) {
            console.error(`[${this.name}] Failed to execute stake:`, error);
            this.emit('stake-failed', { opportunity, error: error.message });
            
            // Send failure notification
            await this.sendFailureNotification('stake', opportunity, error);
            throw error;
        }
    }

    async validateStakeTransaction(opportunity, amount) {
        // Check minimum amount
        if (amount < 100) {
            throw new Error('Stake amount too small (minimum $100)');
        }

        // Check APY threshold
        if (opportunity.apy < this.config.minYieldThreshold) {
            throw new Error(`APY ${opportunity.apy} below minimum threshold ${this.config.minYieldThreshold}`);
        }

        // Check risk level
        if (opportunity.riskScore > this.config.maxRiskLevel) {
            throw new Error(`Risk score ${opportunity.riskScore} exceeds maximum ${this.config.maxRiskLevel}`);
        }

        // Check portfolio concentration
        const currentPositionRatio = this.getTotalPositionRatio();
        if (currentPositionRatio + (amount / 10000) > this.config.maxPositionSize) {
            throw new Error('Position would exceed maximum portfolio allocation');
        }

        // Check wallet balance
        const balance = await walletService.getBalance();
        if (balance < amount * 1.1) { // 10% buffer for gas
            throw new Error('Insufficient wallet balance for stake + gas');
        }
    }

    async executeAaveStake(opportunity, amount, walletAddress) {
        try {
            console.log(`[${this.name}] Executing Aave supply: ${amount} ${opportunity.asset}`);
            
            // Get signer from wallet service
            const signer = await walletService.getSigner();
            
            // Approve token spending if needed
            await this.approveTokenSpending(opportunity.asset, amount, 'aave');
            
            // Execute supply to Aave
            const result = await defiIntegrations.supplyToAave(
                'sepolia', // or get from config
                signer,
                opportunity.asset,
                ethers.parseUnits(amount.toString(), 18), // Adjust decimals as needed
                walletAddress
            );

            console.log(`[${this.name}] Aave supply successful: ${result.hash}`);
            return result.hash;

        } catch (error) {
            throw new Error(`Aave stake failed: ${error.message}`);
        }
    }

    async executeCurveStake(opportunity, amount, walletAddress) {
        try {
            console.log(`[${this.name}] Executing Curve deposit: ${amount} to ${opportunity.pool}`);
            
            // For Curve, we need to add liquidity to the pool
            // This is a simplified implementation - real implementation would handle multiple tokens
            const signer = await walletService.getSigner();
            
            // Prepare curve deposit (simplified)
            const poolContract = new ethers.Contract(
                opportunity.pool,
                contractManager.getABI('CurvePool'),
                signer
            );

            // Estimate gas
            const gasEstimate = await gasService.estimateGasLimit('sepolia', {
                to: opportunity.pool,
                data: poolContract.interface.encodeFunctionData('add_liquidity', [
                    [ethers.parseUnits(amount.toString(), 18), 0], // Simplified for single token
                    0 // min_mint_amount
                ])
            });

            const tx = await poolContract.add_liquidity(
                [ethers.parseUnits(amount.toString(), 18), 0],
                0,
                { gasLimit: gasEstimate.recommended }
            );

            console.log(`[${this.name}] Curve deposit successful: ${tx.hash}`);
            return tx.hash;

        } catch (error) {
            throw new Error(`Curve stake failed: ${error.message}`);
        }
    }

    async executeCompoundStake(opportunity, amount, walletAddress) {
        try {
            console.log(`[${this.name}] Executing Compound supply: ${amount} ${opportunity.asset}`);
            
            // Compound V3 integration (simplified)
            const signer = await walletService.getSigner();
            
            // This would need actual Compound V3 contract integration
            // For now, using smart contract fallback
            return await this.executeSmartContractStake(opportunity, amount, walletAddress);

        } catch (error) {
            throw new Error(`Compound stake failed: ${error.message}`);
        }
    }

    async executeYearnStake(opportunity, amount, walletAddress) {
        try {
            console.log(`[${this.name}] Executing Yearn vault deposit: ${amount} ${opportunity.asset}`);
            
            // Yearn vault integration (simplified)
            const signer = await walletService.getSigner();
            
            // This would need actual Yearn vault contract integration
            // For now, using smart contract fallback
            return await this.executeSmartContractStake(opportunity, amount, walletAddress);

        } catch (error) {
            throw new Error(`Yearn stake failed: ${error.message}`);
        }
    }

    async executeSmartContractStake(opportunity, amount, walletAddress) {
        try {
            console.log(`[${this.name}] Executing via LokiAI smart contract: ${amount} ${opportunity.asset}`);
            
            // Use the deployed YieldOptimizer smart contract
            const result = await smartContractsService.executeYieldOptimization(
                walletAddress,
                contractRegistry.getTokenAddress('sepolia', opportunity.asset || 'USDC'),
                ethers.parseUnits(amount.toString(), 18)
            );

            if (!result.success) {
                throw new Error(result.error);
            }

            console.log(`[${this.name}] Smart contract execution successful: ${result.txHash}`);
            return result.txHash;

        } catch (error) {
            throw new Error(`Smart contract stake failed: ${error.message}`);
        }
    }

    async approveTokenSpending(asset, amount, protocol) {
        try {
            const tokenAddress = contractRegistry.getTokenAddress('sepolia', asset);
            const spenderAddress = this.getProtocolSpenderAddress(protocol);
            
            if (!spenderAddress) {
                console.log(`[${this.name}] No approval needed for ${protocol}`);
                return;
            }

            const signer = await walletService.getSigner();
            const tokenContract = new ethers.Contract(
                tokenAddress,
                contractManager.getABI('ERC20'),
                signer
            );

            // Check current allowance
            const currentAllowance = await tokenContract.allowance(
                await signer.getAddress(),
                spenderAddress
            );

            const requiredAmount = ethers.parseUnits(amount.toString(), 18);
            
            if (currentAllowance < requiredAmount) {
                console.log(`[${this.name}] Approving ${asset} spending for ${protocol}`);
                
                const approveTx = await tokenContract.approve(spenderAddress, requiredAmount);
                await approveTx.wait();
                
                console.log(`[${this.name}] Approval successful: ${approveTx.hash}`);
            }

        } catch (error) {
            throw new Error(`Token approval failed: ${error.message}`);
        }
    }

    getProtocolSpenderAddress(protocol) {
        const spenderMap = {
            'aave': contractRegistry.getContractAddress('sepolia', 'aavePool'),
            'curve': null, // Curve pools handle approvals differently
            'compound': contractRegistry.getContractAddress('sepolia', 'compoundComet'),
            'yearn': null // Yearn vaults handle approvals in deposit
        };
        
        return spenderMap[protocol];
    }

    calculateExpectedYield(amount, apy) {
        const annualYield = amount * apy;
        const dailyYield = annualYield / 365;
        const monthlyYield = annualYield / 12;
        
        return {
            annual: annualYield,
            monthly: monthlyYield,
            daily: dailyYield,
            apy: apy
        };
    }

    async calculateTransactionGasCost(txHash) {
        try {
            const provider = blockchainService.getProvider('sepolia');
            const receipt = await provider.getTransactionReceipt(txHash);
            const tx = await provider.getTransaction(txHash);
            
            const gasCost = receipt.gasUsed * tx.gasPrice;
            const gasCostEth = ethers.formatEther(gasCost);
            
            return {
                gasUsed: receipt.gasUsed.toString(),
                gasPrice: tx.gasPrice.toString(),
                gasCostWei: gasCost.toString(),
                gasCostEth: parseFloat(gasCostEth),
                gasCostUsd: parseFloat(gasCostEth) * 2000 // Approximate ETH price
            };

        } catch (error) {
            console.error(`[${this.name}] Error calculating gas cost:`, error);
            return {
                gasUsed: '0',
                gasPrice: '0',
                gasCostWei: '0',
                gasCostEth: 0,
                gasCostUsd: 0
            };
        }
    }

    getExplorerUrl(txHash) {
        const explorerUrls = {
            'sepolia': 'https://sepolia.etherscan.io/tx/',
            'ethereum': 'https://etherscan.io/tx/',
            'polygon': 'https://polygonscan.com/tx/',
            'arbitrum': 'https://arbiscan.io/tx/'
        };
        
        const network = process.env.USE_TESTNET === 'true' ? 'sepolia' : 'ethereum';
        return `${explorerUrls[network]}${txHash}`;
    }

    async checkAndExecuteCompounding() {
        try {
            console.log(`[${this.name}] Checking compound opportunities...`);

            for (const [positionId, position] of this.positions) {
                if (position.status !== 'active') continue;

                const rewards = await this.getPositionRewards(position);
                
                if (rewards.amount > this.config.compoundThreshold) {
                    await this.executeCompound(position, rewards);
                }
            }

        } catch (error) {
            console.error(`[${this.name}] Error during compounding check:`, error);
        }
    }

    async getPositionRewards(position) {
        try {
            switch (position.protocol) {
                case 'aave-v3':
                    return await defiIntegrations.aave.getAccruedRewards(position.asset);
                case 'curve-pools':
                    return await defiIntegrations.curve.getPoolRewards(position.pool);
                default:
                    return { amount: 0, tokens: [] };
            }
        } catch (error) {
            console.error(`[${this.name}] Error getting rewards for position ${position.id}:`, error);
            return { amount: 0, tokens: [] };
        }
    }

    async executeCompound(position, rewards) {
        try {
            console.log(`[${this.name}] Compounding position ${position.id}: ${rewards.amount}`);

            let txHash;
            let gasUsed;

            // Execute compound based on protocol
            switch (position.protocol) {
                case 'aave-v3':
                    txHash = await this.executeAaveCompound(position, rewards);
                    break;
                case 'curve-pools':
                    txHash = await this.executeCurveCompound(position, rewards);
                    break;
                case 'compound-v3':
                    txHash = await this.executeCompoundV3Compound(position, rewards);
                    break;
                case 'yearn-vaults':
                    txHash = await this.executeYearnCompound(position, rewards);
                    break;
                default:
                    txHash = await this.executeSmartContractCompound(position, rewards);
            }

            // Calculate gas costs
            gasUsed = await this.calculateTransactionGasCost(txHash);

            // Update position with compound data
            position.lastCompound = new Date();
            position.totalCompounded = (position.totalCompounded || 0) + rewards.amount;
            position.compoundCount = (position.compoundCount || 0) + 1;
            position.totalGasCosts = (position.totalGasCosts || 0) + (gasUsed?.gasCostUsd || 0);

            // Update global metrics
            this.totalYieldEarned += rewards.amount;

            console.log(`[${this.name}] Compound executed: ${txHash}`);
            
            this.emit('compound-executed', {
                position,
                rewards,
                txHash,
                gasUsed,
                explorerUrl: this.getExplorerUrl(txHash)
            });

            // Send compound notification
            await this.sendCompoundNotification(position, rewards, txHash);

        } catch (error) {
            console.error(`[${this.name}] Failed to compound position ${position.id}:`, error);
            this.emit('compound-failed', { position, error: error.message });
            
            // Send failure notification
            await this.sendFailureNotification('compound', { positionId: position.id }, error);
        }
    }

    async executeAaveCompound(position, rewards) {
        try {
            console.log(`[${this.name}] Executing Aave compound: ${rewards.amount} ${position.asset}`);
            
            const signer = await walletService.getSigner();
            
            // For Aave, compounding typically means claiming rewards and re-supplying
            // This is a simplified implementation - real Aave compounding would involve
            // claiming AAVE rewards and either selling for more of the supplied asset or supplying AAVE
            
            // Simulate compound by increasing supply (in real implementation, this would claim and reinvest)
            const result = await defiIntegrations.supplyToAave(
                'sepolia',
                signer,
                position.asset,
                ethers.parseUnits(rewards.amount.toString(), 18)
            );

            return result.hash;

        } catch (error) {
            throw new Error(`Aave compound failed: ${error.message}`);
        }
    }

    async executeCurveCompound(position, rewards) {
        try {
            console.log(`[${this.name}] Executing Curve compound: ${rewards.amount}`);
            
            const signer = await walletService.getSigner();
            const poolContract = new ethers.Contract(
                position.asset, // pool address
                contractManager.getABI('CurvePool'),
                signer
            );

            // Claim CRV rewards and add to liquidity (simplified)
            const tx = await poolContract.add_liquidity(
                [ethers.parseUnits(rewards.amount.toString(), 18), 0],
                0
            );

            return tx.hash;

        } catch (error) {
            throw new Error(`Curve compound failed: ${error.message}`);
        }
    }

    async executeCompoundV3Compound(position, rewards) {
        try {
            console.log(`[${this.name}] Executing Compound V3 compound: ${rewards.amount}`);
            
            // Compound V3 auto-compounds by default, so this might just be claiming COMP rewards
            return await this.executeSmartContractCompound(position, rewards);

        } catch (error) {
            throw new Error(`Compound V3 compound failed: ${error.message}`);
        }
    }

    async executeYearnCompound(position, rewards) {
        try {
            console.log(`[${this.name}] Executing Yearn compound: ${rewards.amount}`);
            
            // Yearn vaults auto-compound, so this might be claiming additional rewards
            return await this.executeSmartContractCompound(position, rewards);

        } catch (error) {
            throw new Error(`Yearn compound failed: ${error.message}`);
        }
    }

    async executeSmartContractCompound(position, rewards) {
        try {
            console.log(`[${this.name}] Executing smart contract compound: ${rewards.amount}`);
            
            // Use the YieldOptimizer smart contract to handle compounding
            const walletAddress = await walletService.getAddress();
            
            // This would call a compound function on the smart contract
            // For now, simulate with a simple transaction
            const signer = await walletService.getSigner();
            const tx = await signer.sendTransaction({
                to: walletAddress,
                value: 0,
                data: '0x' // Empty data for simulation
            });

            return tx.hash;

        } catch (error) {
            throw new Error(`Smart contract compound failed: ${error.message}`);
        }
    }

    // Harvest Yield functionality - separate from compounding
    async harvestYield(positionId, reinvest = false) {
        try {
            const position = this.positions.get(positionId);
            if (!position) {
                throw new Error(`Position ${positionId} not found`);
            }

            console.log(`[${this.name}] Harvesting yield for position ${positionId}`);

            // Get available rewards
            const rewards = await this.getPositionRewards(position);
            
            if (rewards.amount <= 0) {
                console.log(`[${this.name}] No rewards to harvest for position ${positionId}`);
                return null;
            }

            let txHash;
            let gasUsed;

            // Execute harvest based on protocol
            switch (position.protocol) {
                case 'aave-v3':
                    txHash = await this.harvestAaveRewards(position, rewards, reinvest);
                    break;
                case 'curve-pools':
                    txHash = await this.harvestCurveRewards(position, rewards, reinvest);
                    break;
                case 'compound-v3':
                    txHash = await this.harvestCompoundRewards(position, rewards, reinvest);
                    break;
                case 'yearn-vaults':
                    txHash = await this.harvestYearnRewards(position, rewards, reinvest);
                    break;
                default:
                    txHash = await this.harvestSmartContractRewards(position, rewards, reinvest);
            }

            // Calculate gas costs
            gasUsed = await this.calculateTransactionGasCost(txHash);

            // Update position
            position.lastHarvest = new Date();
            position.totalHarvested = (position.totalHarvested || 0) + rewards.amount;
            position.harvestCount = (position.harvestCount || 0) + 1;

            // Update global metrics
            this.totalYieldEarned += rewards.amount;

            console.log(`[${this.name}] Yield harvested: ${txHash}`);
            
            this.emit('yield-harvested', {
                position,
                rewards,
                txHash,
                reinvest,
                gasUsed,
                explorerUrl: this.getExplorerUrl(txHash)
            });

            // Send harvest notification
            await this.sendHarvestNotification(position, rewards, reinvest, txHash);

            return {
                txHash,
                rewards,
                gasUsed,
                reinvest
            };

        } catch (error) {
            console.error(`[${this.name}] Failed to harvest yield for position ${positionId}:`, error);
            this.emit('harvest-failed', { positionId, error: error.message });
            
            // Send failure notification
            await this.sendFailureNotification('harvest', { positionId }, error);
            throw error;
        }
    }

    async harvestAaveRewards(position, rewards, reinvest) {
        try {
            const signer = await walletService.getSigner();
            
            // Claim AAVE rewards (simplified - real implementation would use Aave's rewards controller)
            if (reinvest) {
                // Reinvest rewards back into the same asset
                const result = await defiIntegrations.supplyToAave(
                    'sepolia',
                    signer,
                    position.asset,
                    ethers.parseUnits(rewards.amount.toString(), 18)
                );
                return result.hash;
            } else {
                // Just claim rewards to wallet (simplified)
                const tx = await signer.sendTransaction({
                    to: await signer.getAddress(),
                    value: 0,
                    data: '0x'
                });
                return tx.hash;
            }

        } catch (error) {
            throw new Error(`Aave harvest failed: ${error.message}`);
        }
    }

    async harvestCurveRewards(position, rewards, reinvest) {
        try {
            const signer = await walletService.getSigner();
            
            // Harvest CRV rewards from Curve pool
            if (reinvest) {
                // Reinvest CRV rewards back into the pool
                const poolContract = new ethers.Contract(
                    position.asset,
                    contractManager.getABI('CurvePool'),
                    signer
                );

                const tx = await poolContract.add_liquidity(
                    [ethers.parseUnits(rewards.amount.toString(), 18), 0],
                    0
                );
                return tx.hash;
            } else {
                // Claim rewards to wallet
                const tx = await signer.sendTransaction({
                    to: await signer.getAddress(),
                    value: 0,
                    data: '0x'
                });
                return tx.hash;
            }

        } catch (error) {
            throw new Error(`Curve harvest failed: ${error.message}`);
        }
    }

    async harvestCompoundRewards(position, rewards, reinvest) {
        try {
            // Harvest COMP rewards (simplified)
            return await this.harvestSmartContractRewards(position, rewards, reinvest);

        } catch (error) {
            throw new Error(`Compound harvest failed: ${error.message}`);
        }
    }

    async harvestYearnRewards(position, rewards, reinvest) {
        try {
            // Yearn vaults typically auto-compound, but may have additional rewards
            return await this.harvestSmartContractRewards(position, rewards, reinvest);

        } catch (error) {
            throw new Error(`Yearn harvest failed: ${error.message}`);
        }
    }

    async harvestSmartContractRewards(position, rewards, reinvest) {
        try {
            // Use smart contract to harvest rewards
            const signer = await walletService.getSigner();
            const walletAddress = await signer.getAddress();
            
            // Simulate harvest transaction
            const tx = await signer.sendTransaction({
                to: walletAddress,
                value: 0,
                data: '0x'
            });

            return tx.hash;

        } catch (error) {
            throw new Error(`Smart contract harvest failed: ${error.message}`);
        }
    }

    async executeUnstake(positionId, amount = null, reason = 'manual') {
        try {
            const position = this.positions.get(positionId);
            if (!position) {
                throw new Error(`Position ${positionId} not found`);
            }

            console.log(`[${this.name}] Executing unstake: ${positionId} (reason: ${reason})`);

            const unstakeAmount = amount || position.amount;
            const isPartialUnstake = amount && amount < position.amount;
            
            // Pre-unstake validation and yield calculation
            const currentYield = await this.calculatePositionYield(position);
            const shouldUnstake = await this.validateUnstakeDecision(position, reason, currentYield);
            
            if (!shouldUnstake && reason === 'auto') {
                console.log(`[${this.name}] Auto-unstake validation failed for position ${positionId}`);
                return null;
            }

            let txHash;
            let gasUsed;

            // Execute unstake based on protocol
            switch (position.protocol) {
                case 'aave-v3':
                    txHash = await this.executeAaveUnstake(position, unstakeAmount);
                    break;
                case 'curve-pools':
                    txHash = await this.executeCurveUnstake(position, unstakeAmount);
                    break;
                case 'compound-v3':
                    txHash = await this.executeCompoundUnstake(position, unstakeAmount);
                    break;
                case 'yearn-vaults':
                    txHash = await this.executeYearnUnstake(position, unstakeAmount);
                    break;
                default:
                    txHash = await this.executeSmartContractUnstake(position, unstakeAmount);
            }

            // Calculate gas costs
            gasUsed = await this.calculateTransactionGasCost(txHash);
            
            // Calculate final yield including gas costs
            const finalYield = await this.calculateFinalYield(position, currentYield, gasUsed);
            
            // Update position status
            if (isPartialUnstake) {
                position.amount -= unstakeAmount;
                position.partialUnstakes = (position.partialUnstakes || 0) + 1;
            } else {
                position.status = 'closed';
                position.exitTime = new Date();
                position.finalYield = finalYield;
                position.exitReason = reason;
            }

            // Update performance tracking
            await this.updatePerformanceMetrics('unstake', position, finalYield);

            console.log(`[${this.name}] Unstake executed: ${txHash}`);
            
            this.emit('unstake-executed', {
                position,
                amount: unstakeAmount,
                finalYield,
                txHash,
                reason,
                gasUsed,
                explorerUrl: this.getExplorerUrl(txHash),
                isPartialUnstake
            });

            // Send notifications
            await this.sendUnstakeNotification(position, finalYield, reason);

            return txHash;

        } catch (error) {
            console.error(`[${this.name}] Failed to unstake position ${positionId}:`, error);
            this.emit('unstake-failed', { positionId, error: error.message, reason });
            
            // Send failure notification
            await this.sendFailureNotification('unstake', { positionId, reason }, error);
            throw error;
        }
    }

    async validateUnstakeDecision(position, reason, currentYield) {
        try {
            // Always allow manual unstakes
            if (reason === 'manual') {
                return true;
            }

            // Emergency exit conditions
            if (reason === 'emergency') {
                return true;
            }

            // Risk-based unstaking
            if (reason === 'risk') {
                const currentRisk = await this.assessPositionRisk(position);
                return currentRisk > this.config.maxRiskLevel;
            }

            // Performance-based unstaking
            if (reason === 'performance') {
                const performanceThreshold = -0.05; // -5% loss threshold
                return currentYield.totalReturn < performanceThreshold;
            }

            // APY-based unstaking (if better opportunities exist)
            if (reason === 'reallocation') {
                const betterOpportunities = await this.findBetterOpportunities(position);
                return betterOpportunities.length > 0;
            }

            // Time-based unstaking (for strategies with time limits)
            if (reason === 'time-limit') {
                const maxHoldingPeriod = 90; // 90 days
                const holdingDays = (new Date() - position.entryTime) / (1000 * 60 * 60 * 24);
                return holdingDays > maxHoldingPeriod;
            }

            return false;

        } catch (error) {
            console.error(`[${this.name}] Error validating unstake decision:`, error);
            return false; // Conservative approach - don't unstake if validation fails
        }
    }

    async executeAaveUnstake(position, amount) {
        try {
            console.log(`[${this.name}] Executing Aave withdrawal: ${amount} ${position.asset}`);
            
            const signer = await walletService.getSigner();
            
            const result = await defiIntegrations.withdrawFromAave(
                'sepolia',
                signer,
                position.asset,
                ethers.parseUnits(amount.toString(), 18)
            );

            console.log(`[${this.name}] Aave withdrawal successful: ${result.hash}`);
            return result.hash;

        } catch (error) {
            throw new Error(`Aave unstake failed: ${error.message}`);
        }
    }

    async executeCurveUnstake(position, amount) {
        try {
            console.log(`[${this.name}] Executing Curve withdrawal: ${amount} from ${position.asset}`);
            
            const signer = await walletService.getSigner();
            const poolContract = new ethers.Contract(
                position.asset, // pool address
                contractManager.getABI('CurvePool'),
                signer
            );

            // Calculate LP tokens to remove
            const lpTokensToRemove = ethers.parseUnits(amount.toString(), 18);

            const tx = await poolContract.remove_liquidity_one_coin(
                lpTokensToRemove,
                0, // coin index (simplified)
                0  // min_amount
            );

            console.log(`[${this.name}] Curve withdrawal successful: ${tx.hash}`);
            return tx.hash;

        } catch (error) {
            throw new Error(`Curve unstake failed: ${error.message}`);
        }
    }

    async executeCompoundUnstake(position, amount) {
        try {
            console.log(`[${this.name}] Executing Compound withdrawal: ${amount} ${position.asset}`);
            
            // Compound V3 withdrawal (simplified)
            return await this.executeSmartContractUnstake(position, amount);

        } catch (error) {
            throw new Error(`Compound unstake failed: ${error.message}`);
        }
    }

    async executeYearnUnstake(position, amount) {
        try {
            console.log(`[${this.name}] Executing Yearn withdrawal: ${amount} ${position.asset}`);
            
            // Yearn vault withdrawal (simplified)
            return await this.executeSmartContractUnstake(position, amount);

        } catch (error) {
            throw new Error(`Yearn unstake failed: ${error.message}`);
        }
    }

    async executeSmartContractUnstake(position, amount) {
        try {
            console.log(`[${this.name}] Executing smart contract unstake: ${amount} ${position.asset}`);
            
            // This would interact with a custom unstake function in the YieldOptimizer contract
            // For now, we'll simulate the unstake
            const signer = await walletService.getSigner();
            const walletAddress = await signer.getAddress();
            
            // Create a mock transaction for unstaking
            const tx = await signer.sendTransaction({
                to: walletAddress,
                value: 0,
                data: '0x' // Empty data for simulation
            });

            console.log(`[${this.name}] Smart contract unstake simulated: ${tx.hash}`);
            return tx.hash;

        } catch (error) {
            throw new Error(`Smart contract unstake failed: ${error.message}`);
        }
    }

    async calculateFinalYield(position, currentYield, gasUsed) {
        try {
            const totalGasCosts = (position.gasCosts?.gasCostUsd || 0) + (gasUsed?.gasCostUsd || 0);
            const netProfit = currentYield.profit - totalGasCosts;
            const netReturn = netProfit / position.amount;
            
            return {
                ...currentYield,
                totalGasCosts,
                netProfit,
                netReturn,
                netAnnualizedReturn: netReturn * (365 / currentYield.timeHeld),
                profitability: netProfit > 0 ? 'profitable' : 'loss',
                roi: netReturn * 100 // Return on Investment percentage
            };

        } catch (error) {
            console.error(`[${this.name}] Error calculating final yield:`, error);
            return currentYield;
        }
    }

    async assessPositionRisk(position) {
        try {
            // Get current market conditions
            const currentPrice = await priceFeedService.getPrice(position.asset);
            const entryPrice = position.entryPrice || currentPrice; // Fallback if no entry price
            
            // Calculate price volatility risk
            const priceChange = Math.abs(currentPrice - entryPrice) / entryPrice;
            
            // Protocol-specific risk factors
            const protocolRisk = this.calculateRiskScore(position.protocol, position.asset);
            
            // Time-based risk (longer positions may have higher risk)
            const timeHeld = (new Date() - position.entryTime) / (1000 * 60 * 60 * 24);
            const timeRisk = Math.min(timeHeld / 365, 0.2); // Max 20% time risk
            
            // Liquidity risk (simplified)
            const liquidityRisk = position.amount > 10000 ? 0.1 : 0.05;
            
            const totalRisk = protocolRisk + priceChange + timeRisk + liquidityRisk;
            
            return Math.min(totalRisk, 1.0); // Cap at 100%

        } catch (error) {
            console.error(`[${this.name}] Error assessing position risk:`, error);
            return 0.5; // Default moderate risk
        }
    }

    async findBetterOpportunities(currentPosition) {
        try {
            // Scan for opportunities with significantly better APY
            const opportunities = [];
            
            for (const protocol of this.supportedProtocols) {
                try {
                    const protocolOpportunities = await this.scanProtocolOpportunities(protocol);
                    opportunities.push(...protocolOpportunities);
                } catch (error) {
                    console.warn(`[${this.name}] Error scanning ${protocol} for better opportunities:`, error);
                }
            }

            // Filter for significantly better opportunities (at least 2% APY improvement)
            const betterOpportunities = opportunities.filter(opp => 
                opp.apy > currentPosition.entryAPY + 0.02 && // 2% better APY
                opp.riskScore <= currentPosition.riskScore + 0.1 // Similar or lower risk
            );

            return betterOpportunities.sort((a, b) => b.apy - a.apy);

        } catch (error) {
            console.error(`[${this.name}] Error finding better opportunities:`, error);
            return [];
        }
    }

    // Automated unstaking based on conditions
    async checkAutomatedUnstaking() {
        try {
            console.log(`[${this.name}] Checking automated unstaking conditions...`);

            const activePositions = Array.from(this.positions.values())
                .filter(p => p.status === 'active');

            for (const position of activePositions) {
                try {
                    // Check emergency exit conditions
                    const currentYield = await this.calculatePositionYield(position);
                    if (currentYield.totalReturn < -this.config.emergencyExitThreshold) {
                        console.log(`[${this.name}] Emergency exit triggered for position ${position.id}`);
                        await this.executeUnstake(position.id, null, 'emergency');
                        continue;
                    }

                    // Check risk-based unstaking
                    const currentRisk = await this.assessPositionRisk(position);
                    if (currentRisk > this.config.maxRiskLevel) {
                        console.log(`[${this.name}] Risk-based unstaking triggered for position ${position.id}`);
                        await this.executeUnstake(position.id, null, 'risk');
                        continue;
                    }

                    // Check for better opportunities (reallocation)
                    const betterOpportunities = await this.findBetterOpportunities(position);
                    if (betterOpportunities.length > 0 && betterOpportunities[0].apy > position.entryAPY + 0.03) {
                        console.log(`[${this.name}] Reallocation opportunity found for position ${position.id}`);
                        await this.executeUnstake(position.id, null, 'reallocation');
                        
                        // Automatically stake in better opportunity
                        setTimeout(async () => {
                            try {
                                await this.executeStakeTransaction(betterOpportunities[0], position.amount);
                            } catch (error) {
                                console.error(`[${this.name}] Failed to restake after reallocation:`, error);
                            }
                        }, 5000); // Wait 5 seconds before restaking
                    }

                } catch (error) {
                    console.error(`[${this.name}] Error checking position ${position.id} for automated unstaking:`, error);
                }
            }

        } catch (error) {
            console.error(`[${this.name}] Error during automated unstaking check:`, error);
        }
    }

    async calculatePositionYield(position) {
        try {
            const currentValue = await this.getPositionCurrentValue(position);
            const initialValue = position.amount;
            const timeHeld = (new Date() - position.entryTime) / (1000 * 60 * 60 * 24); // days
            
            const totalReturn = (currentValue - initialValue) / initialValue;
            const annualizedReturn = totalReturn * (365 / timeHeld);

            return {
                totalReturn,
                annualizedReturn,
                currentValue,
                initialValue,
                timeHeld,
                profit: currentValue - initialValue
            };
        } catch (error) {
            console.error(`[${this.name}] Error calculating yield for position ${position.id}:`, error);
            return null;
        }
    }

    async getPositionCurrentValue(position) {
        switch (position.protocol) {
            case 'aave-v3':
                return await defiIntegrations.aave.getSupplyBalance(position.asset);
            case 'curve-pools':
                return await defiIntegrations.curve.getLPTokenValue(position.pool, position.amount);
            default:
                return position.amount;
        }
    }

    async getOptimalGasPrice() {
        try {
            const gasPrice = await smartContractsService.getOptimalGasPrice();
            return gasPrice;
        } catch (error) {
            console.error(`[${this.name}] Error getting gas price:`, error);
            return null;
        }
    }

    async estimateGasCost(operation) {
        try {
            return await smartContractsService.estimateGas(operation);
        } catch (error) {
            console.error(`[${this.name}] Error estimating gas:`, error);
            return 100000; // Default estimate
        }
    }

    getTotalPositionRatio() {
        let totalPositionValue = 0;
        for (const position of this.positions.values()) {
            if (position.status === 'active') {
                totalPositionValue += position.amount;
            }
        }
        return totalPositionValue / (totalPositionValue + 1000); // Avoid division by zero
    }

    async capturePerformanceSnapshot() {
        try {
            const timestamp = new Date();
            const activePositions = Array.from(this.positions.values())
                .filter(p => p.status === 'active');

            let totalCurrentValue = 0;
            let totalInitialValue = 0;
            let weightedAPY = 0;
            const positionPerformance = [];

            // Calculate performance for each position
            for (const position of activePositions) {
                const currentValue = await this.getPositionCurrentValue(position);
                const yieldData = await this.calculatePositionYield(position);
                
                totalCurrentValue += currentValue;
                totalInitialValue += position.amount;
                weightedAPY += yieldData.annualizedReturn * (position.amount / totalInitialValue);

                positionPerformance.push({
                    positionId: position.id,
                    protocol: position.protocol,
                    asset: position.asset,
                    initialValue: position.amount,
                    currentValue,
                    yield: yieldData,
                    performance: (currentValue - position.amount) / position.amount
                });
            }

            // Calculate portfolio-level metrics
            const totalReturn = totalInitialValue > 0 ? (totalCurrentValue - totalInitialValue) / totalInitialValue : 0;
            const portfolioAPY = weightedAPY || 0;
            const benchmarkComparison = portfolioAPY - this.performanceConfig.benchmarkAPY;

            // Gas costs tracking
            const gasCosts = await this.calculateGasCosts();
            const netReturn = totalReturn - (gasCosts.total / totalInitialValue);

            const snapshot = {
                timestamp,
                portfolio: {
                    totalPositions: activePositions.length,
                    totalInitialValue,
                    totalCurrentValue,
                    totalReturn,
                    netReturn,
                    portfolioAPY,
                    benchmarkComparison,
                    gasCosts
                },
                positions: positionPerformance,
                metrics: {
                    bestPerformer: positionPerformance.reduce((best, pos) => 
                        pos.performance > (best?.performance || -Infinity) ? pos : best, null),
                    worstPerformer: positionPerformance.reduce((worst, pos) => 
                        pos.performance < (worst?.performance || Infinity) ? pos : worst, null),
                    avgPositionSize: totalInitialValue / activePositions.length || 0,
                    diversificationScore: this.calculateDiversificationScore(activePositions)
                }
            };

            // Add to history and maintain size limit
            this.yieldHistory.push(snapshot);
            if (this.yieldHistory.length > this.performanceConfig.historyRetention) {
                this.yieldHistory.shift();
            }

            // Update total yield earned
            this.totalYieldEarned = totalCurrentValue - totalInitialValue;

            this.emit('performance-snapshot', snapshot);
            return snapshot;

        } catch (error) {
            console.error(`[${this.name}] Error capturing performance snapshot:`, error);
            return null;
        }
    }

    async analyzePerformanceTrends() {
        try {
            if (this.yieldHistory.length < 2) return;

            const latest = this.yieldHistory[this.yieldHistory.length - 1];
            const previous = this.yieldHistory[this.yieldHistory.length - 2];
            
            // Calculate trends
            const trends = {
                portfolioValue: {
                    change: latest.portfolio.totalCurrentValue - previous.portfolio.totalCurrentValue,
                    changePercent: (latest.portfolio.totalCurrentValue - previous.portfolio.totalCurrentValue) / previous.portfolio.totalCurrentValue,
                    trend: latest.portfolio.totalCurrentValue > previous.portfolio.totalCurrentValue ? 'up' : 'down'
                },
                apy: {
                    change: latest.portfolio.portfolioAPY - previous.portfolio.portfolioAPY,
                    trend: latest.portfolio.portfolioAPY > previous.portfolio.portfolioAPY ? 'improving' : 'declining'
                },
                benchmark: {
                    comparison: latest.portfolio.benchmarkComparison,
                    trend: latest.portfolio.benchmarkComparison > previous.portfolio.benchmarkComparison ? 'improving' : 'declining'
                }
            };

            // Check for performance alerts
            await this.checkPerformanceAlerts(latest, trends);

            // Generate recommendations
            const recommendations = await this.generatePerformanceRecommendations(latest, trends);

            this.emit('performance-analysis', {
                snapshot: latest,
                trends,
                recommendations
            });

        } catch (error) {
            console.error(`[${this.name}] Error analyzing performance trends:`, error);
        }
    }

    async checkPerformanceAlerts(snapshot, trends) {
        const alerts = [];

        // Underperformance alert
        if (snapshot.portfolio.benchmarkComparison < this.performanceConfig.alertThresholds.underperformance) {
            alerts.push({
                type: 'underperformance',
                severity: 'warning',
                message: `Portfolio underperforming benchmark by ${(Math.abs(snapshot.portfolio.benchmarkComparison) * 100).toFixed(2)}%`,
                data: { benchmarkComparison: snapshot.portfolio.benchmarkComparison }
            });
        }

        // Excellent performance alert
        if (snapshot.portfolio.benchmarkComparison > this.performanceConfig.alertThresholds.excellentPerformance) {
            alerts.push({
                type: 'excellent-performance',
                severity: 'info',
                message: `Portfolio outperforming benchmark by ${(snapshot.portfolio.benchmarkComparison * 100).toFixed(2)}%`,
                data: { benchmarkComparison: snapshot.portfolio.benchmarkComparison }
            });
        }

        // High gas costs alert
        if (snapshot.portfolio.gasCosts.percentage > 0.05) { // 5% of returns
            alerts.push({
                type: 'high-gas-costs',
                severity: 'warning',
                message: `Gas costs consuming ${(snapshot.portfolio.gasCosts.percentage * 100).toFixed(2)}% of returns`,
                data: { gasCosts: snapshot.portfolio.gasCosts }
            });
        }

        // Position concentration alert
        if (snapshot.metrics.diversificationScore < 0.3) {
            alerts.push({
                type: 'concentration-risk',
                severity: 'warning',
                message: 'Portfolio lacks diversification across protocols',
                data: { diversificationScore: snapshot.metrics.diversificationScore }
            });
        }

        // Emit alerts
        for (const alert of alerts) {
            this.emit('performance-alert', alert);
        }
    }

    async generatePerformanceRecommendations(snapshot, trends) {
        const recommendations = [];

        // Rebalancing recommendations
        if (snapshot.metrics.diversificationScore < 0.4) {
            recommendations.push({
                type: 'diversification',
                priority: 'medium',
                action: 'Diversify positions across more protocols',
                reason: 'Current portfolio is concentrated in few protocols',
                impact: 'Reduce risk and potentially improve returns'
            });
        }

        // Gas optimization recommendations
        if (snapshot.portfolio.gasCosts.percentage > 0.03) {
            recommendations.push({
                type: 'gas-optimization',
                priority: 'high',
                action: 'Batch transactions and optimize gas timing',
                reason: 'Gas costs are eating into returns',
                impact: `Could save ~${(snapshot.portfolio.gasCosts.percentage * 100).toFixed(1)}% in costs`
            });
        }

        // Compound frequency optimization
        const avgCompoundInterval = this.calculateAverageCompoundInterval();
        if (avgCompoundInterval > 7) { // More than 7 days
            recommendations.push({
                type: 'compound-frequency',
                priority: 'medium',
                action: 'Increase compound frequency',
                reason: 'Positions are not being compounded optimally',
                impact: 'Improve compound interest effects'
            });
        }

        // Protocol-specific recommendations
        const protocolPerformance = this.analyzeProtocolPerformance(snapshot);
        if (protocolPerformance.underperforming.length > 0) {
            recommendations.push({
                type: 'protocol-reallocation',
                priority: 'medium',
                action: `Consider moving funds from ${protocolPerformance.underperforming.join(', ')}`,
                reason: 'Some protocols are consistently underperforming',
                impact: 'Potentially improve overall portfolio APY'
            });
        }

        return recommendations;
    }

    calculateDiversificationScore(positions) {
        if (positions.length === 0) return 0;

        // Calculate protocol distribution
        const protocolDistribution = {};
        let totalValue = 0;

        for (const position of positions) {
            protocolDistribution[position.protocol] = (protocolDistribution[position.protocol] || 0) + position.amount;
            totalValue += position.amount;
        }

        // Calculate Herfindahl-Hirschman Index (lower = more diversified)
        let hhi = 0;
        for (const value of Object.values(protocolDistribution)) {
            const share = value / totalValue;
            hhi += share * share;
        }

        // Convert to diversification score (0-1, higher = more diversified)
        return Math.max(0, 1 - hhi);
    }

    async calculateGasCosts() {
        try {
            let totalGasCost = 0;
            let transactionCount = 0;

            // Calculate gas costs for all positions
            for (const position of this.positions.values()) {
                if (position.gasCosts) {
                    totalGasCost += position.gasCosts;
                    transactionCount++;
                }
            }

            const avgGasCost = transactionCount > 0 ? totalGasCost / transactionCount : 0;
            const totalPortfolioValue = Array.from(this.positions.values())
                .filter(p => p.status === 'active')
                .reduce((sum, p) => sum + p.amount, 0);

            return {
                total: totalGasCost,
                average: avgGasCost,
                transactionCount,
                percentage: totalPortfolioValue > 0 ? totalGasCost / totalPortfolioValue : 0
            };
        } catch (error) {
            console.error(`[${this.name}] Error calculating gas costs:`, error);
            return { total: 0, average: 0, transactionCount: 0, percentage: 0 };
        }
    }

    calculateAverageCompoundInterval() {
        const activePositions = Array.from(this.positions.values())
            .filter(p => p.status === 'active');

        if (activePositions.length === 0) return 0;

        const totalInterval = activePositions.reduce((sum, position) => {
            const daysSinceLastCompound = (new Date() - position.lastCompound) / (1000 * 60 * 60 * 24);
            return sum + daysSinceLastCompound;
        }, 0);

        return totalInterval / activePositions.length;
    }

    analyzeProtocolPerformance(snapshot) {
        const protocolStats = {};
        
        // Group positions by protocol
        for (const position of snapshot.positions) {
            if (!protocolStats[position.protocol]) {
                protocolStats[position.protocol] = {
                    positions: [],
                    totalValue: 0,
                    avgPerformance: 0
                };
            }
            
            protocolStats[position.protocol].positions.push(position);
            protocolStats[position.protocol].totalValue += position.currentValue;
        }

        // Calculate average performance per protocol
        for (const protocol of Object.keys(protocolStats)) {
            const stats = protocolStats[protocol];
            stats.avgPerformance = stats.positions.reduce((sum, pos) => sum + pos.performance, 0) / stats.positions.length;
        }

        // Identify underperforming protocols
        const avgPortfolioPerformance = snapshot.portfolio.totalReturn;
        const underperforming = Object.keys(protocolStats)
            .filter(protocol => protocolStats[protocol].avgPerformance < avgPortfolioPerformance * 0.8);

        const outperforming = Object.keys(protocolStats)
            .filter(protocol => protocolStats[protocol].avgPerformance > avgPortfolioPerformance * 1.2);

        return {
            protocolStats,
            underperforming,
            outperforming,
            avgPortfolioPerformance
        };
    }

    // Enhanced public API methods for performance tracking
    async getPerformanceReport(timeframe = '24h') {
        const now = new Date();
        let startTime;

        switch (timeframe) {
            case '1h':
                startTime = new Date(now - 60 * 60 * 1000);
                break;
            case '24h':
                startTime = new Date(now - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                startTime = new Date(now - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startTime = new Date(now - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startTime = new Date(now - 24 * 60 * 60 * 1000);
        }

        const relevantHistory = this.yieldHistory.filter(snapshot => 
            snapshot.timestamp >= startTime
        );

        if (relevantHistory.length === 0) {
            return { error: 'No performance data available for the specified timeframe' };
        }

        const firstSnapshot = relevantHistory[0];
        const lastSnapshot = relevantHistory[relevantHistory.length - 1];

        return {
            timeframe,
            startTime,
            endTime: now,
            dataPoints: relevantHistory.length,
            performance: {
                initialValue: firstSnapshot.portfolio.totalInitialValue,
                finalValue: lastSnapshot.portfolio.totalCurrentValue,
                totalReturn: (lastSnapshot.portfolio.totalCurrentValue - firstSnapshot.portfolio.totalCurrentValue) / firstSnapshot.portfolio.totalCurrentValue,
                apyChange: lastSnapshot.portfolio.portfolioAPY - firstSnapshot.portfolio.portfolioAPY,
                benchmarkComparison: lastSnapshot.portfolio.benchmarkComparison
            },
            history: relevantHistory,
            summary: {
                bestPerformingPeriod: this.findBestPerformingPeriod(relevantHistory),
                worstPerformingPeriod: this.findWorstPerformingPeriod(relevantHistory),
                volatility: this.calculateVolatility(relevantHistory),
                sharpeRatio: this.calculateSharpeRatio(relevantHistory)
            }
        };
    }

    findBestPerformingPeriod(history) {
        if (history.length < 2) return null;

        let bestPeriod = null;
        let bestReturn = -Infinity;

        for (let i = 1; i < history.length; i++) {
            const periodReturn = (history[i].portfolio.totalCurrentValue - history[i-1].portfolio.totalCurrentValue) / history[i-1].portfolio.totalCurrentValue;
            if (periodReturn > bestReturn) {
                bestReturn = periodReturn;
                bestPeriod = {
                    start: history[i-1].timestamp,
                    end: history[i].timestamp,
                    return: periodReturn
                };
            }
        }

        return bestPeriod;
    }

    findWorstPerformingPeriod(history) {
        if (history.length < 2) return null;

        let worstPeriod = null;
        let worstReturn = Infinity;

        for (let i = 1; i < history.length; i++) {
            const periodReturn = (history[i].portfolio.totalCurrentValue - history[i-1].portfolio.totalCurrentValue) / history[i-1].portfolio.totalCurrentValue;
            if (periodReturn < worstReturn) {
                worstReturn = periodReturn;
                worstPeriod = {
                    start: history[i-1].timestamp,
                    end: history[i].timestamp,
                    return: periodReturn
                };
            }
        }

        return worstPeriod;
    }

    calculateVolatility(history) {
        if (history.length < 2) return 0;

        const returns = [];
        for (let i = 1; i < history.length; i++) {
            const periodReturn = (history[i].portfolio.totalCurrentValue - history[i-1].portfolio.totalCurrentValue) / history[i-1].portfolio.totalCurrentValue;
            returns.push(periodReturn);
        }

        const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
        
        return Math.sqrt(variance);
    }

    calculateSharpeRatio(history) {
        if (history.length < 2) return 0;

        const riskFreeRate = 0.02; // 2% annual risk-free rate
        const volatility = this.calculateVolatility(history);
        
        if (volatility === 0) return 0;

        const latestSnapshot = history[history.length - 1];
        const excessReturn = latestSnapshot.portfolio.portfolioAPY - riskFreeRate;
        
        return excessReturn / volatility;
    }

    // Notification system
    async sendStakeNotification(position, opportunity) {
        try {
            const message = `🚀 Yield Optimizer Stake Executed\n\n` +
                `Protocol: ${position.protocol}\n` +
                `Asset: ${position.asset}\n` +
                `Amount: $${position.amount.toLocaleString()}\n` +
                `APY: ${(opportunity.apy * 100).toFixed(2)}%\n` +
                `Expected Annual Yield: $${position.expectedYield.annual.toLocaleString()}\n` +
                `Risk Score: ${(position.riskScore * 100).toFixed(1)}%\n` +
                `TX: ${this.getExplorerUrl(position.txHash)}`;

            await this.sendNotifications(message, 'success');

        } catch (error) {
            console.error(`[${this.name}] Error sending stake notification:`, error);
        }
    }

    async sendUnstakeNotification(position, finalYield, reason) {
        try {
            const profitEmoji = finalYield.netProfit > 0 ? '💰' : '📉';
            const reasonText = {
                'manual': 'Manual Exit',
                'emergency': '🚨 Emergency Exit',
                'risk': '⚠️ Risk Management',
                'reallocation': '🔄 Reallocation',
                'performance': '📊 Performance Based'
            };

            const message = `${profitEmoji} Yield Optimizer Unstake Executed\n\n` +
                `Reason: ${reasonText[reason] || reason}\n` +
                `Protocol: ${position.protocol}\n` +
                `Asset: ${position.asset}\n` +
                `Amount: $${position.amount.toLocaleString()}\n` +
                `Hold Period: ${finalYield.timeHeld.toFixed(1)} days\n` +
                `Net Profit: $${finalYield.netProfit.toFixed(2)}\n` +
                `ROI: ${finalYield.roi.toFixed(2)}%\n` +
                `Annualized Return: ${(finalYield.netAnnualizedReturn * 100).toFixed(2)}%\n` +
                `TX: ${this.getExplorerUrl(position.txHash)}`;

            const type = finalYield.netProfit > 0 ? 'success' : 'warning';
            await this.sendNotifications(message, type);

        } catch (error) {
            console.error(`[${this.name}] Error sending unstake notification:`, error);
        }
    }

    async sendCompoundNotification(position, rewards, txHash) {
        try {
            const message = `🔄 Yield Optimizer Auto-Compound Executed\n\n` +
                `Protocol: ${position.protocol}\n` +
                `Asset: ${position.asset}\n` +
                `Rewards Compounded: $${rewards.amount.toLocaleString()}\n` +
                `Total Compounded: $${(position.totalCompounded || 0).toLocaleString()}\n` +
                `Compound Count: ${position.compoundCount || 1}\n` +
                `TX: ${this.getExplorerUrl(txHash)}`;

            await this.sendNotifications(message, 'success');

        } catch (error) {
            console.error(`[${this.name}] Error sending compound notification:`, error);
        }
    }

    async sendHarvestNotification(position, rewards, reinvest, txHash) {
        try {
            const harvestEmoji = reinvest ? '🔄' : '💰';
            const actionText = reinvest ? 'Harvested & Reinvested' : 'Harvested';
            
            const message = `${harvestEmoji} Yield Optimizer ${actionText}\n\n` +
                `Protocol: ${position.protocol}\n` +
                `Asset: ${position.asset}\n` +
                `Rewards ${actionText}: $${rewards.amount.toLocaleString()}\n` +
                `Total Harvested: $${(position.totalHarvested || 0).toLocaleString()}\n` +
                `Harvest Count: ${position.harvestCount || 1}\n` +
                `Action: ${reinvest ? 'Reinvested into position' : 'Claimed to wallet'}\n` +
                `TX: ${this.getExplorerUrl(txHash)}`;

            await this.sendNotifications(message, 'success');

        } catch (error) {
            console.error(`[${this.name}] Error sending harvest notification:`, error);
        }
    }

    async sendFailureNotification(action, data, error) {
        try {
            const message = `❌ Yield Optimizer ${action.toUpperCase()} Failed\n\n` +
                `Error: ${error.message}\n` +
                `Data: ${JSON.stringify(data, null, 2)}\n` +
                `Time: ${new Date().toISOString()}`;

            await this.sendNotifications(message, 'error');

        } catch (notificationError) {
            console.error(`[${this.name}] Error sending failure notification:`, notificationError);
        }
    }

    async sendNotifications(message, type = 'info') {
        try {
            // Emit to Socket.IO for real-time dashboard updates
            this.emit('notification', {
                agent: this.agentId,
                type,
                message,
                timestamp: new Date()
            });

            // Send to external notification services (if configured)
            if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
                await this.sendTelegramNotification(message);
            }

            if (process.env.DISCORD_WEBHOOK_URL) {
                await this.sendDiscordNotification(message, type);
            }

            if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
                await this.sendEmailNotification(message, type);
            }

        } catch (error) {
            console.error(`[${this.name}] Error sending notifications:`, error);
        }
    }

    async sendTelegramNotification(message) {
        try {
            const fetch = (await import('node-fetch')).default;
            const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
            
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: process.env.TELEGRAM_CHAT_ID,
                    text: message,
                    parse_mode: 'HTML'
                })
            });

        } catch (error) {
            console.error(`[${this.name}] Telegram notification failed:`, error);
        }
    }

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
                        title: 'LokiAI Yield Optimizer',
                        description: message,
                        color: colors[type] || colors.info,
                        timestamp: new Date().toISOString()
                    }]
                })
            });

        } catch (error) {
            console.error(`[${this.name}] Discord notification failed:`, error);
        }
    }

    async sendEmailNotification(message, type) {
        try {
            const nodemailer = await import('nodemailer');
            
            const transporter = nodemailer.createTransporter({
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_PASS
                }
            });

            const subject = `LokiAI Yield Optimizer - ${type.toUpperCase()}`;
            
            await transporter.sendMail({
                from: process.env.GMAIL_USER,
                to: process.env.NOTIFICATION_EMAIL || process.env.GMAIL_USER,
                subject,
                text: message,
                html: `<pre>${message}</pre>`
            });

        } catch (error) {
            console.error(`[${this.name}] Email notification failed:`, error);
        }
    }

    // Performance tracking and metrics
    async updatePerformanceMetrics(action, position, yieldData = null) {
        try {
            const metric = {
                timestamp: new Date(),
                action,
                positionId: position.id,
                protocol: position.protocol,
                asset: position.asset,
                amount: position.amount,
                apy: position.entryAPY,
                riskScore: position.riskScore,
                gasUsed: position.gasCosts?.gasCostUsd || 0
            };

            if (yieldData) {
                metric.yield = yieldData;
                metric.profitability = yieldData.netProfit > 0;
                metric.roi = yieldData.roi;
            }

            // Store in performance history
            this.performanceHistory = this.performanceHistory || [];
            this.performanceHistory.push(metric);

            // Maintain history size limit
            if (this.performanceHistory.length > 1000) {
                this.performanceHistory.shift();
            }

            // Emit performance update
            this.emit('performance-update', metric);

        } catch (error) {
            console.error(`[${this.name}] Error updating performance metrics:`, error);
        }
    }

    // Enhanced automated monitoring
    async startAutomatedMonitoring() {
        // Check for automated unstaking every 10 minutes
        this.automatedMonitoringTimer = setInterval(async () => {
            if (this.isRunning) {
                await this.checkAutomatedUnstaking();
            }
        }, 10 * 60 * 1000); // 10 minutes

        console.log(`[${this.name}] Automated monitoring started`);
    }

    async stopAutomatedMonitoring() {
        if (this.automatedMonitoringTimer) {
            clearInterval(this.automatedMonitoringTimer);
            this.automatedMonitoringTimer = null;
        }
        console.log(`[${this.name}] Automated monitoring stopped`);
    }

    // Public API methods
    async getStatus() {
        const activePositions = Array.from(this.positions.values())
            .filter(p => p.status === 'active');

        const totalValue = activePositions.reduce((sum, p) => sum + p.amount, 0);
        const avgAPY = activePositions.length > 0 
            ? activePositions.reduce((sum, p) => sum + p.entryAPY, 0) / activePositions.length 
            : 0;

        return {
            agentId: this.agentId,
            name: this.name,
            version: this.version,
            isActive: this.isActive,
            isRunning: this.isRunning,
            config: this.config,
            positions: {
                active: activePositions.length,
                total: this.positions.size,
                totalValue,
                avgAPY
            },
            performance: {
                totalYieldEarned: this.totalYieldEarned,
                yieldHistory: this.yieldHistory.slice(-10) // Last 10 entries
            },
            lastScan: this.lastScan,
            nextScan: this.scanTimer ? new Date(Date.now() + this.config.scanInterval) : null
        };
    }

    async getPositions() {
        return Array.from(this.positions.values());
    }

    async getPosition(positionId) {
        return this.positions.get(positionId);
    }

    // Enhanced public API methods
    async manualStake(protocol, asset, amount, options = {}) {
        try {
            const opportunity = {
                protocol,
                asset,
                apy: options.expectedAPY || this.config.minYieldThreshold,
                riskScore: options.riskScore || 0.3,
                liquidity: options.liquidity || 1000000
            };

            return await this.executeStakeTransaction(opportunity, amount);

        } catch (error) {
            console.error(`[${this.name}] Manual stake failed:`, error);
            throw error;
        }
    }

    async manualUnstake(positionId, amount = null) {
        try {
            return await this.executeUnstake(positionId, amount, 'manual');

        } catch (error) {
            console.error(`[${this.name}] Manual unstake failed:`, error);
            throw error;
        }
    }

    async manualHarvest(positionId, reinvest = false) {
        try {
            return await this.harvestYield(positionId, reinvest);

        } catch (error) {
            console.error(`[${this.name}] Manual harvest failed:`, error);
            throw error;
        }
    }

    async manualCompound(positionId) {
        try {
            const position = this.positions.get(positionId);
            if (!position) {
                throw new Error(`Position ${positionId} not found`);
            }

            const rewards = await this.getPositionRewards(position);
            if (rewards.amount <= 0) {
                throw new Error('No rewards available to compound');
            }

            return await this.executeCompound(position, rewards);

        } catch (error) {
            console.error(`[${this.name}] Manual compound failed:`, error);
            throw error;
        }
    }

    async getPositionDetails(positionId) {
        try {
            const position = this.positions.get(positionId);
            if (!position) {
                throw new Error(`Position ${positionId} not found`);
            }

            const currentYield = await this.calculatePositionYield(position);
            const currentRisk = await this.assessPositionRisk(position);
            const availableRewards = await this.getPositionRewards(position);

            return {
                ...position,
                currentYield,
                currentRisk,
                availableRewards,
                performance: {
                    roi: currentYield.totalReturn * 100,
                    annualizedReturn: currentYield.annualizedReturn * 100,
                    daysHeld: currentYield.timeHeld,
                    profitLoss: currentYield.profit
                },
                metrics: {
                    totalCompounded: position.totalCompounded || 0,
                    totalHarvested: position.totalHarvested || 0,
                    compoundCount: position.compoundCount || 0,
                    harvestCount: position.harvestCount || 0,
                    totalGasCosts: position.totalGasCosts || 0
                }
            };

        } catch (error) {
            console.error(`[${this.name}] Error getting position details:`, error);
            throw error;
        }
    }

    async getAllPositionsDetails() {
        try {
            const positions = Array.from(this.positions.values());
            const detailedPositions = [];

            for (const position of positions) {
                try {
                    const details = await this.getPositionDetails(position.id);
                    detailedPositions.push(details);
                } catch (error) {
                    console.error(`[${this.name}] Error getting details for position ${position.id}:`, error);
                    detailedPositions.push({
                        ...position,
                        error: error.message
                    });
                }
            }

            return detailedPositions;

        } catch (error) {
            console.error(`[${this.name}] Error getting all positions details:`, error);
            throw error;
        }
    }

    async getAgentMetrics() {
        try {
            const activePositions = Array.from(this.positions.values())
                .filter(p => p.status === 'active');
            
            const closedPositions = Array.from(this.positions.values())
                .filter(p => p.status === 'closed');

            let totalValue = 0;
            let totalProfit = 0;
            let totalGasCosts = 0;
            let avgAPY = 0;

            for (const position of activePositions) {
                totalValue += position.amount;
                totalGasCosts += position.totalGasCosts || 0;
                avgAPY += position.entryAPY;
            }

            for (const position of closedPositions) {
                if (position.finalYield) {
                    totalProfit += position.finalYield.netProfit || 0;
                    totalGasCosts += position.totalGasCosts || 0;
                }
            }

            avgAPY = activePositions.length > 0 ? avgAPY / activePositions.length : 0;

            return {
                agent: {
                    id: this.agentId,
                    name: this.name,
                    version: this.version,
                    isActive: this.isActive,
                    isRunning: this.isRunning
                },
                positions: {
                    active: activePositions.length,
                    closed: closedPositions.length,
                    total: this.positions.size
                },
                performance: {
                    totalValue,
                    totalProfit,
                    totalGasCosts,
                    netProfit: totalProfit - totalGasCosts,
                    avgAPY: avgAPY * 100,
                    totalYieldEarned: this.totalYieldEarned
                },
                activity: {
                    totalCompounds: activePositions.reduce((sum, p) => sum + (p.compoundCount || 0), 0),
                    totalHarvests: activePositions.reduce((sum, p) => sum + (p.harvestCount || 0), 0),
                    lastScan: this.lastScan,
                    nextScan: this.scanTimer ? new Date(Date.now() + this.config.scanInterval) : null
                },
                config: this.config
            };

        } catch (error) {
            console.error(`[${this.name}] Error getting agent metrics:`, error);
            throw error;
        }
    }

    async emergencyExit() {
        console.log(`[${this.name}] EMERGENCY EXIT - Closing all positions`);
        
        const activePositions = Array.from(this.positions.values())
            .filter(p => p.status === 'active');

        for (const position of activePositions) {
            try {
                await this.executeUnstake(position.id, null, 'emergency');
            } catch (error) {
                console.error(`[${this.name}] Failed to emergency exit position ${position.id}:`, error);
            }
        }

        await this.stop();
        this.emit('emergency-exit');
    }
}

export default YieldOptimizerAgentBlockchain;