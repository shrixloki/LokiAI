import { ethers } from 'ethers';
import blockchainService from './blockchain-service.js';

/**
 * Gas Fee Estimation Service
 * Provides dynamic gas price calculation, optimization strategies, and cost management
 */
class GasService {
    constructor() {
        this.gasCache = new Map();
        this.cacheTimeout = 30000; // 30 seconds cache
        this.gasHistory = new Map();
        this.maxHistorySize = 100;
        
        // Gas limits for common transaction types
        this.gasLimits = {
            transfer: 21000,
            erc20Transfer: 65000,
            erc20Approve: 50000,
            uniswapV2Swap: 150000,
            uniswapV3Swap: 180000,
            aaveDeposit: 200000,
            aaveWithdraw: 180000,
            curveSwap: 250000,
            sushiswapSwap: 150000,
            complexDeFi: 300000,
            contractDeploy: 2000000
        };

        // Network-specific configurations
        this.networkConfigs = {
            ethereum: {
                maxGasPrice: ethers.parseUnits('100', 'gwei'), // 100 gwei max
                priorityFeeMultiplier: 1.1,
                baseFeeMultiplier: 1.2,
                confirmationTarget: 2 // blocks
            },
            polygon: {
                maxGasPrice: ethers.parseUnits('500', 'gwei'), // 500 gwei max
                priorityFeeMultiplier: 1.2,
                baseFeeMultiplier: 1.1,
                confirmationTarget: 1
            },
            bsc: {
                maxGasPrice: ethers.parseUnits('20', 'gwei'), // 20 gwei max
                priorityFeeMultiplier: 1.1,
                baseFeeMultiplier: 1.1,
                confirmationTarget: 1
            },
            arbitrum: {
                maxGasPrice: ethers.parseUnits('5', 'gwei'), // 5 gwei max
                priorityFeeMultiplier: 1.05,
                baseFeeMultiplier: 1.1,
                confirmationTarget: 1
            }
        };
    }

    /**
     * Get current gas prices for a network
     */
    async getGasPrices(networkName) {
        const cacheKey = `gas:${networkName}`;
        
        // Check cache first
        const cached = this.gasCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const provider = blockchainService.getProvider(networkName);
            const feeData = await provider.getFeeData();
            const config = this.networkConfigs[networkName] || this.networkConfigs.ethereum;

            let gasData;

            if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
                // EIP-1559 network (Ethereum, Polygon)
                gasData = await this.calculateEIP1559Gas(feeData, config, networkName);
            } else {
                // Legacy gas pricing (BSC, some others)
                gasData = await this.calculateLegacyGas(feeData, config, networkName);
            }

            // Add network-specific data
            gasData.network = networkName;
            gasData.timestamp = new Date();
            gasData.cached = false;

            // Cache the result
            this.gasCache.set(cacheKey, {
                data: gasData,
                timestamp: Date.now()
            });

            // Store in history
            this.addToHistory(networkName, gasData);

            return gasData;

        } catch (error) {
            throw new Error(`Failed to get gas prices for ${networkName}: ${error.message}`);
        }
    }

    /**
     * Calculate EIP-1559 gas prices (Ethereum, Polygon)
     */
    async calculateEIP1559Gas(feeData, config, networkName) {
        const provider = blockchainService.getProvider(networkName);
        
        // Get recent blocks to analyze base fee trends
        const currentBlock = await provider.getBlock('latest');
        const baseFee = currentBlock.baseFeePerGas || feeData.maxFeePerGas;

        // Calculate different speed options
        const slow = {
            maxFeePerGas: baseFee * BigInt(Math.floor(config.baseFeeMultiplier * 100)) / 100n,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || ethers.parseUnits('1', 'gwei'),
            estimatedTime: '5-10 minutes'
        };

        const standard = {
            maxFeePerGas: baseFee * BigInt(Math.floor(config.baseFeeMultiplier * 110)) / 100n,
            maxPriorityFeePerGas: (feeData.maxPriorityFeePerGas || ethers.parseUnits('2', 'gwei')) * BigInt(Math.floor(config.priorityFeeMultiplier * 100)) / 100n,
            estimatedTime: '2-5 minutes'
        };

        const fast = {
            maxFeePerGas: baseFee * BigInt(Math.floor(config.baseFeeMultiplier * 130)) / 100n,
            maxPriorityFeePerGas: (feeData.maxPriorityFeePerGas || ethers.parseUnits('3', 'gwei')) * BigInt(Math.floor(config.priorityFeeMultiplier * 150)) / 100n,
            estimatedTime: '30 seconds - 2 minutes'
        };

        // Ensure we don't exceed max gas price
        const maxGasPrice = config.maxGasPrice;
        [slow, standard, fast].forEach(option => {
            if (option.maxFeePerGas > maxGasPrice) {
                option.maxFeePerGas = maxGasPrice;
            }
        });

        return {
            type: 'eip1559',
            baseFee: baseFee.toString(),
            baseFeeGwei: ethers.formatUnits(baseFee, 'gwei'),
            slow: {
                ...slow,
                maxFeePerGasGwei: ethers.formatUnits(slow.maxFeePerGas, 'gwei'),
                maxPriorityFeePerGasGwei: ethers.formatUnits(slow.maxPriorityFeePerGas, 'gwei')
            },
            standard: {
                ...standard,
                maxFeePerGasGwei: ethers.formatUnits(standard.maxFeePerGas, 'gwei'),
                maxPriorityFeePerGasGwei: ethers.formatUnits(standard.maxPriorityFeePerGas, 'gwei')
            },
            fast: {
                ...fast,
                maxFeePerGasGwei: ethers.formatUnits(fast.maxFeePerGas, 'gwei'),
                maxPriorityFeePerGasGwei: ethers.formatUnits(fast.maxPriorityFeePerGas, 'gwei')
            },
            blockNumber: currentBlock.number
        };
    }

    /**
     * Calculate legacy gas prices (BSC, older networks)
     */
    async calculateLegacyGas(feeData, config, networkName) {
        const baseGasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');

        const slow = {
            gasPrice: baseGasPrice,
            estimatedTime: '5-10 minutes'
        };

        const standard = {
            gasPrice: baseGasPrice * 110n / 100n,
            estimatedTime: '2-5 minutes'
        };

        const fast = {
            gasPrice: baseGasPrice * 130n / 100n,
            estimatedTime: '30 seconds - 2 minutes'
        };

        // Ensure we don't exceed max gas price
        const maxGasPrice = config.maxGasPrice;
        [slow, standard, fast].forEach(option => {
            if (option.gasPrice > maxGasPrice) {
                option.gasPrice = maxGasPrice;
            }
        });

        return {
            type: 'legacy',
            slow: {
                ...slow,
                gasPriceGwei: ethers.formatUnits(slow.gasPrice, 'gwei')
            },
            standard: {
                ...standard,
                gasPriceGwei: ethers.formatUnits(standard.gasPrice, 'gwei')
            },
            fast: {
                ...fast,
                gasPriceGwei: ethers.formatUnits(fast.gasPrice, 'gwei')
            }
        };
    }

    /**
     * Estimate gas limit for a transaction
     */
    async estimateGasLimit(networkName, transactionRequest) {
        try {
            const provider = blockchainService.getProvider(networkName);
            
            // Try to estimate gas from the network
            const estimatedGas = await provider.estimateGas(transactionRequest);
            
            // Add 20% buffer for safety
            const gasWithBuffer = estimatedGas * 120n / 100n;
            
            return {
                estimated: estimatedGas.toString(),
                recommended: gasWithBuffer.toString(),
                estimatedNumber: Number(estimatedGas),
                recommendedNumber: Number(gasWithBuffer)
            };

        } catch (error) {
            // Fallback to predefined gas limits based on transaction type
            const fallbackGas = this.getFallbackGasLimit(transactionRequest);
            
            console.warn(`⚠️ Gas estimation failed for ${networkName}, using fallback: ${fallbackGas}`);
            
            return {
                estimated: fallbackGas.toString(),
                recommended: (fallbackGas * 1.2).toString(),
                estimatedNumber: fallbackGas,
                recommendedNumber: Math.floor(fallbackGas * 1.2),
                fallback: true,
                error: error.message
            };
        }
    }

    /**
     * Get fallback gas limit based on transaction type
     */
    getFallbackGasLimit(transactionRequest) {
        // Analyze transaction to determine type
        if (!transactionRequest.to) {
            return this.gasLimits.contractDeploy;
        }
        
        if (!transactionRequest.data || transactionRequest.data === '0x') {
            return this.gasLimits.transfer;
        }

        // Check for common function signatures
        const data = transactionRequest.data.toLowerCase();
        
        if (data.startsWith('0xa9059cbb')) { // transfer(address,uint256)
            return this.gasLimits.erc20Transfer;
        }
        
        if (data.startsWith('0x095ea7b3')) { // approve(address,uint256)
            return this.gasLimits.erc20Approve;
        }
        
        if (data.startsWith('0x7ff36ab5') || data.startsWith('0x38ed1739')) { // Uniswap swaps
            return this.gasLimits.uniswapV2Swap;
        }
        
        if (data.startsWith('0x414bf389') || data.startsWith('0xac9650d8')) { // Uniswap V3
            return this.gasLimits.uniswapV3Swap;
        }

        // Default to complex DeFi transaction
        return this.gasLimits.complexDeFi;
    }

    /**
     * Calculate total transaction cost
     */
    async calculateTransactionCost(networkName, transactionRequest, speed = 'standard') {
        try {
            const [gasData, gasLimit] = await Promise.all([
                this.getGasPrices(networkName),
                this.estimateGasLimit(networkName, transactionRequest)
            ]);

            const speedOption = gasData[speed];
            if (!speedOption) {
                throw new Error(`Invalid speed option: ${speed}`);
            }

            let gasCost;
            if (gasData.type === 'eip1559') {
                // Use maxFeePerGas for cost calculation
                gasCost = BigInt(gasLimit.recommended) * speedOption.maxFeePerGas;
            } else {
                // Legacy gas pricing
                gasCost = BigInt(gasLimit.recommended) * speedOption.gasPrice;
            }

            const networkConfig = blockchainService.getNetworkConfig(networkName);
            const nativeSymbol = networkConfig.nativeCurrency.symbol;

            return {
                network: networkName,
                speed,
                gasLimit: gasLimit.recommended,
                gasLimitNumber: Number(gasLimit.recommended),
                gasCost: gasCost.toString(),
                gasCostEther: ethers.formatEther(gasCost),
                gasCostNumber: Number(ethers.formatEther(gasCost)),
                nativeSymbol,
                estimatedTime: speedOption.estimatedTime,
                gasData: speedOption,
                timestamp: new Date()
            };

        } catch (error) {
            throw new Error(`Failed to calculate transaction cost for ${networkName}: ${error.message}`);
        }
    }

    /**
     * Get optimal gas settings for a transaction
     */
    async getOptimalGasSettings(networkName, transactionRequest, maxCostUSD = null) {
        try {
            const gasData = await this.getGasPrices(networkName);
            const gasLimit = await this.estimateGasLimit(networkName, transactionRequest);

            // Calculate costs for all speed options
            const costs = {};
            for (const speed of ['slow', 'standard', 'fast']) {
                costs[speed] = await this.calculateTransactionCost(networkName, transactionRequest, speed);
            }

            // If max cost is specified, filter options
            let recommendedSpeed = 'standard';
            if (maxCostUSD) {
                // This would require price feed integration to convert to USD
                // For now, recommend based on gas cost in native currency
                const maxCostEther = maxCostUSD / 2000; // Rough ETH price estimate
                
                if (costs.slow.gasCostNumber <= maxCostEther) {
                    recommendedSpeed = 'fast';
                } else if (costs.standard.gasCostNumber <= maxCostEther) {
                    recommendedSpeed = 'standard';
                } else {
                    recommendedSpeed = 'slow';
                }
            }

            return {
                network: networkName,
                gasLimit: gasLimit.recommended,
                recommendedSpeed,
                options: costs,
                gasData,
                timestamp: new Date()
            };

        } catch (error) {
            throw new Error(`Failed to get optimal gas settings for ${networkName}: ${error.message}`);
        }
    }

    /**
     * Monitor gas prices and alert on significant changes
     */
    async monitorGasPrices(networkName, thresholdPercent = 20) {
        try {
            const currentGas = await this.getGasPrices(networkName);
            const history = this.gasHistory.get(networkName) || [];
            
            if (history.length === 0) {
                return { status: 'no_history', currentGas };
            }

            const lastGas = history[history.length - 1];
            let significantChange = false;
            let changePercent = 0;

            if (currentGas.type === 'eip1559') {
                const currentBaseFee = parseFloat(currentGas.baseFeeGwei);
                const lastBaseFee = parseFloat(lastGas.baseFeeGwei);
                changePercent = ((currentBaseFee - lastBaseFee) / lastBaseFee) * 100;
            } else {
                const currentGasPrice = parseFloat(currentGas.standard.gasPriceGwei);
                const lastGasPrice = parseFloat(lastGas.standard.gasPriceGwei);
                changePercent = ((currentGasPrice - lastGasPrice) / lastGasPrice) * 100;
            }

            significantChange = Math.abs(changePercent) >= thresholdPercent;

            return {
                status: significantChange ? 'significant_change' : 'normal',
                changePercent,
                threshold: thresholdPercent,
                currentGas,
                lastGas,
                recommendation: this.getGasRecommendation(changePercent, networkName)
            };

        } catch (error) {
            throw new Error(`Failed to monitor gas prices for ${networkName}: ${error.message}`);
        }
    }

    /**
     * Get gas price recommendation based on trends
     */
    getGasRecommendation(changePercent, networkName) {
        if (changePercent > 20) {
            return {
                action: 'wait',
                message: `Gas prices increased by ${changePercent.toFixed(1)}% on ${networkName}. Consider waiting for prices to decrease.`,
                urgency: 'high'
            };
        } else if (changePercent < -20) {
            return {
                action: 'execute',
                message: `Gas prices decreased by ${Math.abs(changePercent).toFixed(1)}% on ${networkName}. Good time to execute transactions.`,
                urgency: 'low'
            };
        } else {
            return {
                action: 'normal',
                message: `Gas prices are stable on ${networkName} (${changePercent.toFixed(1)}% change).`,
                urgency: 'medium'
            };
        }
    }

    /**
     * Add gas data to history
     */
    addToHistory(networkName, gasData) {
        let history = this.gasHistory.get(networkName) || [];
        
        history.push({
            ...gasData,
            timestamp: new Date()
        });

        // Keep only recent history
        if (history.length > this.maxHistorySize) {
            history = history.slice(-this.maxHistorySize);
        }

        this.gasHistory.set(networkName, history);
    }

    /**
     * Get gas price history for a network
     */
    getGasHistory(networkName, limit = 10) {
        const history = this.gasHistory.get(networkName) || [];
        return history.slice(-limit);
    }

    /**
     * Clear gas cache
     */
    clearCache() {
        this.gasCache.clear();
        console.log('🗑️ Gas cache cleared');
    }

    /**
     * Get gas service statistics
     */
    getStats() {
        const networks = Array.from(this.gasHistory.keys());
        const stats = {};

        for (const network of networks) {
            const history = this.gasHistory.get(network) || [];
            stats[network] = {
                historySize: history.length,
                oldestEntry: history.length > 0 ? history[0].timestamp : null,
                newestEntry: history.length > 0 ? history[history.length - 1].timestamp : null
            };
        }

        return {
            cacheSize: this.gasCache.size,
            cacheTimeout: this.cacheTimeout,
            networks: stats,
            supportedNetworks: Object.keys(this.networkConfigs)
        };
    }

    /**
     * Batch gas estimation for multiple transactions
     */
    async batchEstimateGas(networkName, transactions) {
        const results = [];

        for (let i = 0; i < transactions.length; i++) {
            try {
                const cost = await this.calculateTransactionCost(networkName, transactions[i]);
                results.push({
                    index: i,
                    success: true,
                    ...cost
                });
            } catch (error) {
                results.push({
                    index: i,
                    success: false,
                    error: error.message
                });
            }
        }

        const totalCost = results
            .filter(r => r.success)
            .reduce((sum, r) => sum + r.gasCostNumber, 0);

        return {
            network: networkName,
            transactions: results,
            totalCost,
            totalCostEther: totalCost.toString(),
            successfulEstimations: results.filter(r => r.success).length,
            failedEstimations: results.filter(r => !r.success).length
        };
    }
}

// Create singleton instance
const gasService = new GasService();

export default gasService;