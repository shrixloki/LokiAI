import { ethers } from 'ethers';
import blockchainService from '../blockchain-service.js';
import contractRegistry from './contract-registry.js';
import { ABIS, getABI } from './abis/index.js';

/**
 * Contract Manager - Manages contract instances and interactions
 * Provides unified interface for interacting with DeFi protocols
 */
class ContractManager {
    constructor() {
        this.contractInstances = new Map();
        this.contractCache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
    }

    /**
     * Get contract instance
     */
    getContract(networkName, contractName, abiName = null) {
        const cacheKey = `${networkName}:${contractName}`;
        
        // Check cache first
        const cached = this.contractCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.contract;
        }

        try {
            const provider = blockchainService.getProvider(networkName);
            const contractAddress = contractRegistry.getContractAddress(networkName, contractName);
            
            // Determine ABI to use
            let abi;
            if (abiName) {
                abi = getABI(abiName);
            } else {
                // Try to infer ABI from contract name
                abi = this.inferABI(contractName);
            }

            const contract = new ethers.Contract(contractAddress, abi, provider);
            
            // Cache the contract
            this.contractCache.set(cacheKey, {
                contract,
                timestamp: Date.now()
            });

            return contract;

        } catch (error) {
            throw new Error(`Failed to get contract ${contractName} on ${networkName}: ${error.message}`);
        }
    }

    /**
     * Get token contract (ERC20)
     */
    getTokenContract(networkName, tokenSymbol) {
        const cacheKey = `${networkName}:token:${tokenSymbol}`;
        
        // Check cache first
        const cached = this.contractCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.contract;
        }

        try {
            const provider = blockchainService.getProvider(networkName);
            const tokenAddress = contractRegistry.getTokenAddress(networkName, tokenSymbol);
            const contract = new ethers.Contract(tokenAddress, ABIS.ERC20, provider);
            
            // Cache the contract
            this.contractCache.set(cacheKey, {
                contract,
                timestamp: Date.now()
            });

            return contract;

        } catch (error) {
            throw new Error(`Failed to get token contract ${tokenSymbol} on ${networkName}: ${error.message}`);
        }
    }

    /**
     * Get contract with signer (for write operations)
     */
    getContractWithSigner(networkName, contractName, signer, abiName = null) {
        try {
            const contractAddress = contractRegistry.getContractAddress(networkName, contractName);
            
            // Determine ABI to use
            let abi;
            if (abiName) {
                abi = getABI(abiName);
            } else {
                abi = this.inferABI(contractName);
            }

            return new ethers.Contract(contractAddress, abi, signer);

        } catch (error) {
            throw new Error(`Failed to get contract with signer ${contractName} on ${networkName}: ${error.message}`);
        }
    }

    /**
     * Get token contract with signer
     */
    getTokenContractWithSigner(networkName, tokenSymbol, signer) {
        try {
            const tokenAddress = contractRegistry.getTokenAddress(networkName, tokenSymbol);
            return new ethers.Contract(tokenAddress, ABIS.ERC20, signer);

        } catch (error) {
            throw new Error(`Failed to get token contract with signer ${tokenSymbol} on ${networkName}: ${error.message}`);
        }
    }

    /**
     * Infer ABI from contract name
     */
    inferABI(contractName) {
        const name = contractName.toLowerCase();
        
        // Uniswap V2
        if (name.includes('uniswapv2router') || name.includes('sushiswapRouter') || name.includes('pancakeswapv2router')) {
            return ABIS.UniswapV2Router;
        }
        if (name.includes('uniswapv2factory') || name.includes('sushiswapfactory') || name.includes('pancakeswapv2factory')) {
            return ABIS.UniswapV2Factory;
        }
        
        // Uniswap V3
        if (name.includes('uniswapv3router') || name.includes('pancakeswapv3router')) {
            return ABIS.UniswapV3Router;
        }
        if (name.includes('uniswapv3quoter')) {
            return ABIS.UniswapV3Quoter;
        }
        if (name.includes('uniswapv3factory') || name.includes('pancakeswapv3factory')) {
            return ABIS.UniswapV3Factory;
        }
        
        // Aave
        if (name.includes('aavepool')) {
            return ABIS.AaveV3Pool;
        }
        if (name.includes('aavepooldataprovider')) {
            return ABIS.AaveV3DataProvider;
        }
        
        // Curve
        if (name.includes('curveregistry')) {
            return ABIS.CurveRegistry;
        }
        
        // Default to ERC20 for tokens
        if (name.includes('token') || name.includes('weth') || name.includes('usdc') || name.includes('usdt')) {
            return ABIS.ERC20;
        }

        throw new Error(`Cannot infer ABI for contract: ${contractName}`);
    }

    /**
     * Get token information (name, symbol, decimals, etc.)
     */
    async getTokenInfo(networkName, tokenSymbol) {
        try {
            const tokenContract = this.getTokenContract(networkName, tokenSymbol);
            const tokenAddress = contractRegistry.getTokenAddress(networkName, tokenSymbol);
            
            const [name, symbol, decimals, totalSupply] = await Promise.all([
                tokenContract.name(),
                tokenContract.symbol(),
                tokenContract.decimals(),
                tokenContract.totalSupply()
            ]);

            return {
                address: tokenAddress,
                name,
                symbol,
                decimals: Number(decimals),
                totalSupply: totalSupply.toString(),
                network: networkName
            };

        } catch (error) {
            throw new Error(`Failed to get token info for ${tokenSymbol} on ${networkName}: ${error.message}`);
        }
    }

    /**
     * Get token balance for an address
     */
    async getTokenBalance(networkName, tokenSymbol, address) {
        try {
            const tokenContract = this.getTokenContract(networkName, tokenSymbol);
            const balance = await tokenContract.balanceOf(address);
            const decimals = await tokenContract.decimals();
            
            return {
                address,
                token: tokenSymbol,
                network: networkName,
                balance: balance.toString(),
                balanceFormatted: ethers.formatUnits(balance, decimals),
                decimals: Number(decimals)
            };

        } catch (error) {
            throw new Error(`Failed to get token balance for ${tokenSymbol} on ${networkName}: ${error.message}`);
        }
    }

    /**
     * Get multiple token balances for an address
     */
    async getMultipleTokenBalances(networkName, tokenSymbols, address) {
        const balances = {};
        
        await Promise.allSettled(
            tokenSymbols.map(async (tokenSymbol) => {
                try {
                    balances[tokenSymbol] = await this.getTokenBalance(networkName, tokenSymbol, address);
                } catch (error) {
                    balances[tokenSymbol] = {
                        error: error.message,
                        token: tokenSymbol,
                        network: networkName,
                        address
                    };
                }
            })
        );

        return balances;
    }

    /**
     * Check token allowance
     */
    async getTokenAllowance(networkName, tokenSymbol, owner, spender) {
        try {
            const tokenContract = this.getTokenContract(networkName, tokenSymbol);
            const allowance = await tokenContract.allowance(owner, spender);
            const decimals = await tokenContract.decimals();
            
            return {
                owner,
                spender,
                token: tokenSymbol,
                network: networkName,
                allowance: allowance.toString(),
                allowanceFormatted: ethers.formatUnits(allowance, decimals),
                decimals: Number(decimals)
            };

        } catch (error) {
            throw new Error(`Failed to get token allowance for ${tokenSymbol} on ${networkName}: ${error.message}`);
        }
    }

    /**
     * Batch contract calls (read-only)
     */
    async batchCall(networkName, calls) {
        const results = [];
        
        for (const call of calls) {
            try {
                const { contractName, method, params = [], abiName } = call;
                const contract = this.getContract(networkName, contractName, abiName);
                const result = await contract[method](...params);
                
                results.push({
                    success: true,
                    contractName,
                    method,
                    result,
                    params
                });
                
            } catch (error) {
                results.push({
                    success: false,
                    contractName: call.contractName,
                    method: call.method,
                    error: error.message,
                    params: call.params
                });
            }
        }
        
        return results;
    }

    /**
     * Get contract events
     */
    async getContractEvents(networkName, contractName, eventName, fromBlock = 'latest', toBlock = 'latest', abiName = null) {
        try {
            const contract = this.getContract(networkName, contractName, abiName);
            const filter = contract.filters[eventName]();
            const events = await contract.queryFilter(filter, fromBlock, toBlock);
            
            return events.map(event => ({
                address: event.address,
                blockNumber: event.blockNumber,
                blockHash: event.blockHash,
                transactionHash: event.transactionHash,
                transactionIndex: event.transactionIndex,
                logIndex: event.logIndex,
                event: eventName,
                args: event.args,
                data: event.data,
                topics: event.topics
            }));

        } catch (error) {
            throw new Error(`Failed to get events for ${contractName} on ${networkName}: ${error.message}`);
        }
    }

    /**
     * Validate contract address
     */
    async validateContract(networkName, contractAddress, expectedABI = null) {
        try {
            const provider = blockchainService.getProvider(networkName);
            const code = await provider.getCode(contractAddress);
            
            if (code === '0x') {
                return {
                    valid: false,
                    reason: 'No contract code at address'
                };
            }

            // If ABI is provided, try to create contract and call a basic function
            if (expectedABI) {
                try {
                    const contract = new ethers.Contract(contractAddress, expectedABI, provider);
                    // Try to call a common read function (this will vary by contract type)
                    // This is a basic validation - more specific validation would be needed per contract type
                    
                    return {
                        valid: true,
                        hasCode: true,
                        address: contractAddress
                    };
                } catch (error) {
                    return {
                        valid: false,
                        reason: `ABI validation failed: ${error.message}`
                    };
                }
            }

            return {
                valid: true,
                hasCode: true,
                address: contractAddress
            };

        } catch (error) {
            return {
                valid: false,
                reason: error.message
            };
        }
    }

    /**
     * Clear contract cache
     */
    clearCache() {
        this.contractCache.clear();
        console.log('🗑️ Contract cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        const now = Date.now();
        let validEntries = 0;
        let expiredEntries = 0;

        for (const [key, cached] of this.contractCache.entries()) {
            if (now - cached.timestamp < this.cacheTimeout) {
                validEntries++;
            } else {
                expiredEntries++;
            }
        }

        return {
            totalEntries: this.contractCache.size,
            validEntries,
            expiredEntries,
            cacheTimeout: this.cacheTimeout
        };
    }

    /**
     * Get supported contracts for a network
     */
    getSupportedContracts(networkName) {
        try {
            const contracts = contractRegistry.getNetworkContracts(networkName);
            const tokens = contractRegistry.getNetworkTokens(networkName);
            
            return {
                network: networkName,
                contracts: Object.keys(contracts).filter(key => key !== 'tokens'),
                tokens: Object.keys(tokens),
                total: Object.keys(contracts).length + Object.keys(tokens).length - 1 // -1 for tokens object
            };
        } catch (error) {
            throw new Error(`Failed to get supported contracts for ${networkName}: ${error.message}`);
        }
    }
}

// Create singleton instance
const contractManager = new ContractManager();

export default contractManager;