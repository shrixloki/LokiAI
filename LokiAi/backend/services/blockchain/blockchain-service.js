import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Blockchain Service - Core infrastructure for multi-chain blockchain interactions
 * Supports Ethereum, Polygon, BSC, and Arbitrum networks
 */
class BlockchainService {
    constructor() {
        this.providers = new Map();
        this.networks = new Map();
        this.isInitialized = false;
        
        // Network configurations
        this.networkConfigs = {
            ethereum: {
                chainId: 1,
                name: 'Ethereum Mainnet',
                rpcUrl: process.env.ETHEREUM_RPC_URL || process.env.ALCHEMY_ETHEREUM_URL,
                explorerUrl: 'https://etherscan.io',
                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
            },
            sepolia: {
                chainId: 11155111,
                name: 'Sepolia Testnet',
                rpcUrl: process.env.SEPOLIA_RPC_URL,
                explorerUrl: 'https://sepolia.etherscan.io',
                nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 }
            },
            polygon: {
                chainId: 137,
                name: 'Polygon Mainnet',
                rpcUrl: process.env.POLYGON_RPC_URL || process.env.ALCHEMY_POLYGON_URL,
                explorerUrl: 'https://polygonscan.com',
                nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }
            },
            bsc: {
                chainId: 56,
                name: 'BSC Mainnet',
                rpcUrl: process.env.BSC_RPC_URL || process.env.QUICKNODE_BSC_URL,
                explorerUrl: 'https://bscscan.com',
                nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 }
            },
            arbitrum: {
                chainId: 42161,
                name: 'Arbitrum One',
                rpcUrl: process.env.ARBITRUM_RPC_URL || process.env.ALCHEMY_ARBITRUM_URL,
                explorerUrl: 'https://arbiscan.io',
                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
            }
        };
    }

    /**
     * Initialize blockchain connections for all supported networks
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        console.log('🔗 Initializing blockchain connections...');
        
        for (const [networkName, config] of Object.entries(this.networkConfigs)) {
            try {
                await this.initializeNetwork(networkName, config);
            } catch (error) {
                console.error(`❌ Failed to initialize ${networkName}:`, error.message);
                // Continue with other networks even if one fails
            }
        }

        this.isInitialized = true;
        console.log('✅ Blockchain service initialized');
    }

    /**
     * Initialize a specific network connection
     */
    async initializeNetwork(networkName, config) {
        if (!config.rpcUrl) {
            throw new Error(`RPC URL not configured for ${networkName}`);
        }

        // Create provider with automatic failover
        const provider = new ethers.JsonRpcProvider(config.rpcUrl, {
            chainId: config.chainId,
            name: config.name
        });

        // Test connection
        try {
            const network = await provider.getNetwork();
            if (Number(network.chainId) !== config.chainId) {
                throw new Error(`Chain ID mismatch for ${networkName}`);
            }

            this.providers.set(networkName, provider);
            this.networks.set(networkName, config);
            
            console.log(`✅ Connected to ${config.name} (Chain ID: ${config.chainId})`);
        } catch (error) {
            throw new Error(`Connection test failed for ${networkName}: ${error.message}`);
        }
    }

    /**
     * Get provider for a specific network
     */
    getProvider(networkName) {
        if (!this.isInitialized) {
            throw new Error('Blockchain service not initialized');
        }

        const provider = this.providers.get(networkName);
        if (!provider) {
            throw new Error(`Provider not available for network: ${networkName}`);
        }

        return provider;
    }

    /**
     * Get network configuration
     */
    getNetworkConfig(networkName) {
        const config = this.networks.get(networkName);
        if (!config) {
            throw new Error(`Network configuration not found: ${networkName}`);
        }
        return config;
    }

    /**
     * Get all supported networks
     */
    getSupportedNetworks() {
        return Array.from(this.networks.keys());
    }

    /**
     * Check if a network is supported and connected
     */
    isNetworkSupported(networkName) {
        return this.providers.has(networkName);
    }

    /**
     * Get current block number for a network
     */
    async getCurrentBlock(networkName) {
        const provider = this.getProvider(networkName);
        return await provider.getBlockNumber();
    }

    /**
     * Get network status and health
     */
    async getNetworkStatus(networkName) {
        try {
            const provider = this.getProvider(networkName);
            const config = this.getNetworkConfig(networkName);
            
            const [blockNumber, gasPrice] = await Promise.all([
                provider.getBlockNumber(),
                provider.getFeeData()
            ]);

            return {
                network: networkName,
                chainId: config.chainId,
                connected: true,
                blockNumber,
                gasPrice: gasPrice.gasPrice?.toString(),
                maxFeePerGas: gasPrice.maxFeePerGas?.toString(),
                maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString(),
                lastChecked: new Date().toISOString()
            };
        } catch (error) {
            return {
                network: networkName,
                connected: false,
                error: error.message,
                lastChecked: new Date().toISOString()
            };
        }
    }

    /**
     * Get status for all networks
     */
    async getAllNetworkStatus() {
        const statuses = {};
        
        for (const networkName of this.getSupportedNetworks()) {
            statuses[networkName] = await this.getNetworkStatus(networkName);
        }

        return statuses;
    }

    /**
     * Switch to a different RPC provider (failover)
     */
    async switchProvider(networkName, newRpcUrl) {
        try {
            const config = this.getNetworkConfig(networkName);
            const newProvider = new ethers.JsonRpcProvider(newRpcUrl, {
                chainId: config.chainId,
                name: config.name
            });

            // Test new provider
            const network = await newProvider.getNetwork();
            if (Number(network.chainId) !== config.chainId) {
                throw new Error('Chain ID mismatch');
            }

            // Replace provider
            this.providers.set(networkName, newProvider);
            console.log(`✅ Switched ${networkName} provider to: ${newRpcUrl}`);
            
            return true;
        } catch (error) {
            console.error(`❌ Failed to switch ${networkName} provider:`, error.message);
            return false;
        }
    }

    /**
     * Monitor connection health and attempt reconnection
     */
    async monitorConnections() {
        const healthCheck = async () => {
            for (const networkName of this.getSupportedNetworks()) {
                try {
                    const provider = this.getProvider(networkName);
                    await provider.getBlockNumber();
                } catch (error) {
                    console.warn(`⚠️ Connection issue with ${networkName}:`, error.message);
                    
                    // Attempt to reinitialize the network
                    const config = this.getNetworkConfig(networkName);
                    try {
                        await this.initializeNetwork(networkName, config);
                        console.log(`✅ Reconnected to ${networkName}`);
                    } catch (reconnectError) {
                        console.error(`❌ Failed to reconnect to ${networkName}:`, reconnectError.message);
                    }
                }
            }
        };

        // Run health check every 30 seconds
        setInterval(healthCheck, 30000);
        console.log('🔍 Started blockchain connection monitoring');
    }

    /**
     * Get blockchain explorer URL for a transaction
     */
    getExplorerUrl(networkName, txHash) {
        const config = this.getNetworkConfig(networkName);
        return `${config.explorerUrl}/tx/${txHash}`;
    }

    /**
     * Get blockchain explorer URL for an address
     */
    getAddressExplorerUrl(networkName, address) {
        const config = this.getNetworkConfig(networkName);
        return `${config.explorerUrl}/address/${address}`;
    }
}

// Create singleton instance
const blockchainService = new BlockchainService();

export default blockchainService;