import { ethers } from 'ethers';
import contractManager from '../contracts/contract-manager.js';
import contractRegistry from '../contracts/contract-registry.js';
import gasService from '../gas-service.js';

/**
 * DeFi Protocol Integrations
 * Unified interface for interacting with major DeFi protocols
 */
class DeFiIntegrations {
    constructor() {
        this.supportedProtocols = ['uniswap-v2', 'uniswap-v3', 'sushiswap', 'aave', 'curve'];
    }

    // ==================== UNISWAP V2 INTEGRATION ====================

    /**
     * Get Uniswap V2 quote for token swap
     */
    async getUniswapV2Quote(networkName, tokenIn, tokenOut, amountIn) {
        try {
            const router = contractManager.getContract(networkName, 'uniswapV2Router', 'UniswapV2Router');
            const tokenInAddress = contractRegistry.getTokenAddress(networkName, tokenIn);
            const tokenOutAddress = contractRegistry.getTokenAddress(networkName, tokenOut);
            
            const path = [tokenInAddress, tokenOutAddress];
            const amounts = await router.getAmountsOut(amountIn, path);
            
            return {
                protocol: 'uniswap-v2',
                network: networkName,
                tokenIn,
                tokenOut,
                amountIn: amountIn.toString(),
                amountOut: amounts[1].toString(),
                path,
                priceImpact: this.calculatePriceImpact(amountIn, amounts[1]),
                timestamp: new Date()
            };
        } catch (error) {
            throw new Error(`Uniswap V2 quote failed: ${error.message}`);
        }
    }

    /**
     * Execute Uniswap V2 swap
     */
    async executeUniswapV2Swap(networkName, signer, tokenIn, tokenOut, amountIn, minAmountOut, deadline) {
        try {
            const router = contractManager.getContractWithSigner(networkName, 'uniswapV2Router', signer, 'UniswapV2Router');
            const tokenInAddress = contractRegistry.getTokenAddress(networkName, tokenIn);
            const tokenOutAddress = contractRegistry.getTokenAddress(networkName, tokenOut);
            
            const path = [tokenInAddress, tokenOutAddress];
            const to = await signer.getAddress();
            
            // Estimate gas
            const gasEstimate = await gasService.estimateGasLimit(networkName, {
                to: router.target,
                data: router.interface.encodeFunctionData('swapExactTokensForTokens', [
                    amountIn, minAmountOut, path, to, deadline
                ])
            });

            const tx = await router.swapExactTokensForTokens(
                amountIn,
                minAmountOut,
                path,
                to,
                deadline,
                { gasLimit: gasEstimate.recommended }
            );

            return {
                protocol: 'uniswap-v2',
                network: networkName,
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                tokenIn,
                tokenOut,
                amountIn: amountIn.toString(),
                minAmountOut: minAmountOut.toString(),
                gasLimit: gasEstimate.recommended,
                timestamp: new Date()
            };
        } catch (error) {
            throw new Error(`Uniswap V2 swap failed: ${error.message}`);
        }
    }

    // ==================== UNISWAP V3 INTEGRATION ====================

    /**
     * Get Uniswap V3 quote
     */
    async getUniswapV3Quote(networkName, tokenIn, tokenOut, amountIn, fee = 3000) {
        try {
            const quoter = contractManager.getContract(networkName, 'uniswapV3Quoter', 'UniswapV3Quoter');
            const tokenInAddress = contractRegistry.getTokenAddress(networkName, tokenIn);
            const tokenOutAddress = contractRegistry.getTokenAddress(networkName, tokenOut);
            
            const amountOut = await quoter.quoteExactInputSingle(
                tokenInAddress,
                tokenOutAddress,
                fee,
                amountIn,
                0 // sqrtPriceLimitX96
            );

            return {
                protocol: 'uniswap-v3',
                network: networkName,
                tokenIn,
                tokenOut,
                amountIn: amountIn.toString(),
                amountOut: amountOut.toString(),
                fee,
                priceImpact: this.calculatePriceImpact(amountIn, amountOut),
                timestamp: new Date()
            };
        } catch (error) {
            throw new Error(`Uniswap V3 quote failed: ${error.message}`);
        }
    }

    /**
     * Execute Uniswap V3 swap
     */
    async executeUniswapV3Swap(networkName, signer, tokenIn, tokenOut, amountIn, minAmountOut, fee = 3000, deadline) {
        try {
            const router = contractManager.getContractWithSigner(networkName, 'uniswapV3Router', signer, 'UniswapV3Router');
            const tokenInAddress = contractRegistry.getTokenAddress(networkName, tokenIn);
            const tokenOutAddress = contractRegistry.getTokenAddress(networkName, tokenOut);
            const recipient = await signer.getAddress();

            const params = {
                tokenIn: tokenInAddress,
                tokenOut: tokenOutAddress,
                fee,
                recipient,
                deadline,
                amountIn,
                amountOutMinimum: minAmountOut,
                sqrtPriceLimitX96: 0
            };

            // Estimate gas
            const gasEstimate = await gasService.estimateGasLimit(networkName, {
                to: router.target,
                data: router.interface.encodeFunctionData('exactInputSingle', [params])
            });

            const tx = await router.exactInputSingle(params, { gasLimit: gasEstimate.recommended });

            return {
                protocol: 'uniswap-v3',
                network: networkName,
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                tokenIn,
                tokenOut,
                amountIn: amountIn.toString(),
                minAmountOut: minAmountOut.toString(),
                fee,
                gasLimit: gasEstimate.recommended,
                timestamp: new Date()
            };
        } catch (error) {
            throw new Error(`Uniswap V3 swap failed: ${error.message}`);
        }
    }

    // ==================== AAVE INTEGRATION ====================

    /**
     * Get Aave reserve data
     */
    async getAaveReserveData(networkName, asset) {
        try {
            const pool = contractManager.getContract(networkName, 'aavePool', 'AaveV3Pool');
            const assetAddress = contractRegistry.getTokenAddress(networkName, asset);
            
            const reserveData = await pool.getReserveData(assetAddress);
            
            return {
                protocol: 'aave',
                network: networkName,
                asset,
                assetAddress,
                liquidityRate: reserveData.currentLiquidityRate.toString(),
                variableBorrowRate: reserveData.currentVariableBorrowRate.toString(),
                stableBorrowRate: reserveData.currentStableBorrowRate.toString(),
                aTokenAddress: reserveData.aTokenAddress,
                lastUpdateTimestamp: Number(reserveData.lastUpdateTimestamp),
                timestamp: new Date()
            };
        } catch (error) {
            throw new Error(`Aave reserve data failed: ${error.message}`);
        }
    }

    /**
     * Supply to Aave
     */
    async supplyToAave(networkName, signer, asset, amount, onBehalfOf = null) {
        try {
            const pool = contractManager.getContractWithSigner(networkName, 'aavePool', signer, 'AaveV3Pool');
            const assetAddress = contractRegistry.getTokenAddress(networkName, asset);
            const userAddress = onBehalfOf || await signer.getAddress();

            // Estimate gas
            const gasEstimate = await gasService.estimateGasLimit(networkName, {
                to: pool.target,
                data: pool.interface.encodeFunctionData('supply', [assetAddress, amount, userAddress, 0])
            });

            const tx = await pool.supply(assetAddress, amount, userAddress, 0, {
                gasLimit: gasEstimate.recommended
            });

            return {
                protocol: 'aave',
                action: 'supply',
                network: networkName,
                hash: tx.hash,
                asset,
                amount: amount.toString(),
                user: userAddress,
                gasLimit: gasEstimate.recommended,
                timestamp: new Date()
            };
        } catch (error) {
            throw new Error(`Aave supply failed: ${error.message}`);
        }
    }

    /**
     * Withdraw from Aave
     */
    async withdrawFromAave(networkName, signer, asset, amount) {
        try {
            const pool = contractManager.getContractWithSigner(networkName, 'aavePool', signer, 'AaveV3Pool');
            const assetAddress = contractRegistry.getTokenAddress(networkName, asset);
            const userAddress = await signer.getAddress();

            // Estimate gas
            const gasEstimate = await gasService.estimateGasLimit(networkName, {
                to: pool.target,
                data: pool.interface.encodeFunctionData('withdraw', [assetAddress, amount, userAddress])
            });

            const tx = await pool.withdraw(assetAddress, amount, userAddress, {
                gasLimit: gasEstimate.recommended
            });

            return {
                protocol: 'aave',
                action: 'withdraw',
                network: networkName,
                hash: tx.hash,
                asset,
                amount: amount.toString(),
                user: userAddress,
                gasLimit: gasEstimate.recommended,
                timestamp: new Date()
            };
        } catch (error) {
            throw new Error(`Aave withdraw failed: ${error.message}`);
        }
    }

    /**
     * Get user account data from Aave
     */
    async getAaveUserAccountData(networkName, userAddress) {
        try {
            const pool = contractManager.getContract(networkName, 'aavePool', 'AaveV3Pool');
            const accountData = await pool.getUserAccountData(userAddress);

            return {
                protocol: 'aave',
                network: networkName,
                user: userAddress,
                totalCollateralBase: accountData.totalCollateralBase.toString(),
                totalDebtBase: accountData.totalDebtBase.toString(),
                availableBorrowsBase: accountData.availableBorrowsBase.toString(),
                currentLiquidationThreshold: accountData.currentLiquidationThreshold.toString(),
                ltv: accountData.ltv.toString(),
                healthFactor: accountData.healthFactor.toString(),
                timestamp: new Date()
            };
        } catch (error) {
            throw new Error(`Aave user account data failed: ${error.message}`);
        }
    }

    // ==================== CURVE INTEGRATION ====================

    /**
     * Get Curve pool info
     */
    async getCurvePoolInfo(networkName, poolAddress) {
        try {
            const registry = contractManager.getContract(networkName, 'curveRegistry', 'CurveRegistry');
            const poolInfo = await registry.get_pool_info(poolAddress);
            const coins = await registry.get_coins(poolAddress);

            return {
                protocol: 'curve',
                network: networkName,
                poolAddress,
                balances: poolInfo.balances.map(b => b.toString()),
                underlyingBalances: poolInfo.underlying_balances.map(b => b.toString()),
                decimals: poolInfo.decimals.map(d => Number(d)),
                lpToken: poolInfo.lp_token,
                A: poolInfo.A.toString(),
                fee: poolInfo.fee.toString(),
                coins: coins.filter(coin => coin !== ethers.ZeroAddress),
                timestamp: new Date()
            };
        } catch (error) {
            throw new Error(`Curve pool info failed: ${error.message}`);
        }
    }

    /**
     * Get Curve swap quote
     */
    async getCurveSwapQuote(networkName, poolAddress, tokenIndexIn, tokenIndexOut, amountIn) {
        try {
            const poolContract = new ethers.Contract(
                poolAddress,
                contractManager.getABI('CurvePool'),
                contractManager.getProvider(networkName)
            );

            const amountOut = await poolContract.get_dy(tokenIndexIn, tokenIndexOut, amountIn);

            return {
                protocol: 'curve',
                network: networkName,
                poolAddress,
                tokenIndexIn,
                tokenIndexOut,
                amountIn: amountIn.toString(),
                amountOut: amountOut.toString(),
                priceImpact: this.calculatePriceImpact(amountIn, amountOut),
                timestamp: new Date()
            };
        } catch (error) {
            throw new Error(`Curve swap quote failed: ${error.message}`);
        }
    }

    // ==================== SUSHISWAP INTEGRATION ====================

    /**
     * Get SushiSwap quote (uses same interface as Uniswap V2)
     */
    async getSushiSwapQuote(networkName, tokenIn, tokenOut, amountIn) {
        try {
            const router = contractManager.getContract(networkName, 'sushiswapRouter', 'UniswapV2Router');
            const tokenInAddress = contractRegistry.getTokenAddress(networkName, tokenIn);
            const tokenOutAddress = contractRegistry.getTokenAddress(networkName, tokenOut);
            
            const path = [tokenInAddress, tokenOutAddress];
            const amounts = await router.getAmountsOut(amountIn, path);
            
            return {
                protocol: 'sushiswap',
                network: networkName,
                tokenIn,
                tokenOut,
                amountIn: amountIn.toString(),
                amountOut: amounts[1].toString(),
                path,
                priceImpact: this.calculatePriceImpact(amountIn, amounts[1]),
                timestamp: new Date()
            };
        } catch (error) {
            throw new Error(`SushiSwap quote failed: ${error.message}`);
        }
    }

    // ==================== UTILITY FUNCTIONS ====================

    /**
     * Calculate price impact (simplified)
     */
    calculatePriceImpact(amountIn, amountOut) {
        // This is a simplified calculation
        // In practice, you'd need to compare with the current market price
        const ratio = Number(amountOut) / Number(amountIn);
        return {
            ratio,
            percentage: ((1 - ratio) * 100).toFixed(4)
        };
    }

    /**
     * Get best quote across multiple DEXes
     */
    async getBestQuote(networkName, tokenIn, tokenOut, amountIn) {
        const quotes = [];
        
        // Try Uniswap V2
        try {
            const uniV2Quote = await this.getUniswapV2Quote(networkName, tokenIn, tokenOut, amountIn);
            quotes.push(uniV2Quote);
        } catch (error) {
            console.warn('Uniswap V2 quote failed:', error.message);
        }

        // Try Uniswap V3
        try {
            const uniV3Quote = await this.getUniswapV3Quote(networkName, tokenIn, tokenOut, amountIn);
            quotes.push(uniV3Quote);
        } catch (error) {
            console.warn('Uniswap V3 quote failed:', error.message);
        }

        // Try SushiSwap
        try {
            const sushiQuote = await this.getSushiSwapQuote(networkName, tokenIn, tokenOut, amountIn);
            quotes.push(sushiQuote);
        } catch (error) {
            console.warn('SushiSwap quote failed:', error.message);
        }

        if (quotes.length === 0) {
            throw new Error('No quotes available from any DEX');
        }

        // Find best quote (highest output amount)
        const bestQuote = quotes.reduce((best, current) => {
            return BigInt(current.amountOut) > BigInt(best.amountOut) ? current : best;
        });

        return {
            bestQuote,
            allQuotes: quotes,
            savings: this.calculateSavings(quotes, bestQuote),
            timestamp: new Date()
        };
    }

    /**
     * Calculate savings from using best quote
     */
    calculateSavings(quotes, bestQuote) {
        if (quotes.length < 2) return null;

        const worstQuote = quotes.reduce((worst, current) => {
            return BigInt(current.amountOut) < BigInt(worst.amountOut) ? current : worst;
        });

        const savings = BigInt(bestQuote.amountOut) - BigInt(worstQuote.amountOut);
        const savingsPercentage = (Number(savings) / Number(worstQuote.amountOut)) * 100;

        return {
            absoluteSavings: savings.toString(),
            percentageSavings: savingsPercentage.toFixed(4),
            bestProtocol: bestQuote.protocol,
            worstProtocol: worstQuote.protocol
        };
    }

    /**
     * Get protocol TVL and stats
     */
    async getProtocolStats(networkName, protocol) {
        try {
            switch (protocol) {
                case 'aave':
                    return await this.getAaveStats(networkName);
                case 'uniswap-v2':
                case 'uniswap-v3':
                    return await this.getUniswapStats(networkName, protocol);
                default:
                    throw new Error(`Stats not implemented for protocol: ${protocol}`);
            }
        } catch (error) {
            throw new Error(`Failed to get protocol stats: ${error.message}`);
        }
    }

    /**
     * Get Aave protocol stats
     */
    async getAaveStats(networkName) {
        try {
            const dataProvider = contractManager.getContract(networkName, 'aavePoolDataProvider', 'AaveV3DataProvider');
            const reserves = await dataProvider.getAllReservesTokens();
            
            const reserveStats = [];
            for (const reserve of reserves) {
                try {
                    const reserveData = await dataProvider.getReserveData(reserve.tokenAddress);
                    reserveStats.push({
                        symbol: reserve.symbol,
                        address: reserve.tokenAddress,
                        liquidityRate: reserveData.liquidityRate.toString(),
                        variableBorrowRate: reserveData.variableBorrowRate.toString(),
                        totalAToken: reserveData.totalAToken.toString()
                    });
                } catch (error) {
                    console.warn(`Failed to get data for reserve ${reserve.symbol}:`, error.message);
                }
            }

            return {
                protocol: 'aave',
                network: networkName,
                totalReserves: reserves.length,
                reserves: reserveStats,
                timestamp: new Date()
            };
        } catch (error) {
            throw new Error(`Aave stats failed: ${error.message}`);
        }
    }

    /**
     * Check if protocol is supported on network
     */
    isProtocolSupported(networkName, protocol) {
        try {
            switch (protocol) {
                case 'uniswap-v2':
                    return contractRegistry.hasContract(networkName, 'uniswapV2Router');
                case 'uniswap-v3':
                    return contractRegistry.hasContract(networkName, 'uniswapV3Router');
                case 'sushiswap':
                    return contractRegistry.hasContract(networkName, 'sushiswapRouter');
                case 'aave':
                    return contractRegistry.hasContract(networkName, 'aavePool');
                case 'curve':
                    return contractRegistry.hasContract(networkName, 'curveRegistry');
                default:
                    return false;
            }
        } catch {
            return false;
        }
    }

    /**
     * Get supported protocols for a network
     */
    getSupportedProtocols(networkName) {
        return this.supportedProtocols.filter(protocol => 
            this.isProtocolSupported(networkName, protocol)
        );
    }
}

// Create singleton instance
const defiIntegrations = new DeFiIntegrations();

export default defiIntegrations;