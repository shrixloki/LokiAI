import { ethers } from 'ethers';
import EventEmitter from 'events';

/**
 * Advanced Blockchain Connection Manager
 * Handles multi-chain connections with automatic failover, health monitoring, and reconnection logic
 */
class ConnectionManager extends EventEmitter {
    constructor() {
        super();
        this.connections = new Map();
        this.healthStatus = new Map();
        this.reconnectAttempts = new Map();
        this.maxReconnectAttempts = 5;
        this.healthCheckInterval = 30000; // 30 seconds
        this.reconnectDelay = 5000; // 5 seconds
        this.isMonitoring = false;
    }

    /**
     * Initialize connection for a network with failover providers
     */
    async initializeConnection(networkName, config) {
        console.log(`🔗 Initializing connection for ${networkName}...`);
        
        const providers = this.createProviderChain(config);
        let connectedProvider = null;
        let lastError = null;

        // Try each provider in order until one connects
        for (let i = 0; i < providers.length; i++) {
            try {
                const provider = providers[i];
                await this.testProvider(provider, config.chainId);
                
                connectedProvider = provider;
                console.log(`✅ Connected to ${networkName} using provider ${i + 1}`);
                break;
                
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Provider ${i + 1} failed for ${networkName}:`, error.message);
            }
        }

        if (!connectedProvider) {
            throw new Error(`All providers failed for ${networkName}. Last error: ${lastError?.message}`);
        }

        // Store connection info
        const connectionInfo = {
            provider: connectedProvider,
            config,
            providers,
            currentProviderIndex: providers.indexOf(connectedProvider),
            lastConnected: new Date(),
            isHealthy: true
        };

        this.connections.set(networkName, connectionInfo);
        this.healthStatus.set(networkName, { healthy: true, lastCheck: new Date() });
        this.reconnectAttempts.set(networkName, 0);

        // Set up provider event listeners
        this.setupProviderListeners(networkName, connectedProvider);

        this.emit('connectionEstablished', { network: networkName, provider: connectedProvider });
        return connectedProvider;
    }

    /**
     * Create chain of providers with failover options
     */
    createProviderChain(config) {
        const providers = [];
        
        // Primary RPC URL
        if (config.rpcUrl) {
            providers.push(new ethers.JsonRpcProvider(config.rpcUrl, {
                chainId: config.chainId,
                name: config.name
            }));
        }

        // Backup RPC URLs
        if (config.backupRpcUrls) {
            config.backupRpcUrls.forEach(url => {
                providers.push(new ethers.JsonRpcProvider(url, {
                    chainId: config.chainId,
                    name: config.name
                }));
            });
        }

        // Fallback to public RPCs if available
        const publicRpcs = this.getPublicRpcUrls(config.chainId);
        publicRpcs.forEach(url => {
            providers.push(new ethers.JsonRpcProvider(url, {
                chainId: config.chainId,
                name: config.name
            }));
        });

        return providers;
    }

    /**
     * Get public RPC URLs as fallback
     */
    getPublicRpcUrls(chainId) {
        const publicRpcs = {
            1: ['https://eth.llamarpc.com', 'https://rpc.ankr.com/eth'],
            137: ['https://polygon.llamarpc.com', 'https://rpc.ankr.com/polygon'],
            56: ['https://bsc.llamarpc.com', 'https://rpc.ankr.com/bsc'],
            42161: ['https://arbitrum.llamarpc.com', 'https://rpc.ankr.com/arbitrum']
        };
        
        return publicRpcs[chainId] || [];
    }

    /**
     * Test provider connectivity and chain ID
     */
    async testProvider(provider, expectedChainId) {
        const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 10000)
        );

        const test = async () => {
            const network = await provider.getNetwork();
            const blockNumber = await provider.getBlockNumber();
            
            if (Number(network.chainId) !== expectedChainId) {
                throw new Error(`Chain ID mismatch: expected ${expectedChainId}, got ${network.chainId}`);
            }
            
            if (blockNumber <= 0) {
                throw new Error('Invalid block number received');
            }
            
            return { network, blockNumber };
        };

        return Promise.race([test(), timeout]);
    }

    /**
     * Set up provider event listeners for connection monitoring
     */
    setupProviderListeners(networkName, provider) {
        provider.on('error', (error) => {
            console.error(`❌ Provider error for ${networkName}:`, error);
            this.handleProviderError(networkName, error);
        });

        provider.on('network', (newNetwork, oldNetwork) => {
            if (oldNetwork) {
                console.log(`🔄 Network changed for ${networkName}:`, { old: oldNetwork.chainId, new: newNetwork.chainId });
            }
        });
    }

    /**
     * Handle provider errors and attempt failover
     */
    async handleProviderError(networkName, error) {
        console.warn(`⚠️ Handling provider error for ${networkName}:`, error.message);
        
        const connectionInfo = this.connections.get(networkName);
        if (!connectionInfo) return;

        connectionInfo.isHealthy = false;
        this.healthStatus.set(networkName, { healthy: false, lastCheck: new Date(), error: error.message });
        
        // Attempt failover to next provider
        await this.attemptFailover(networkName);
    }

    /**
     * Attempt failover to next available provider
     */
    async attemptFailover(networkName) {
        const connectionInfo = this.connections.get(networkName);
        if (!connectionInfo) return false;

        const { providers, currentProviderIndex } = connectionInfo;
        
        // Try next providers in the chain
        for (let i = 1; i < providers.length; i++) {
            const nextIndex = (currentProviderIndex + i) % providers.length;
            const nextProvider = providers[nextIndex];
            
            try {
                await this.testProvider(nextProvider, connectionInfo.config.chainId);
                
                // Update connection info
                connectionInfo.provider = nextProvider;
                connectionInfo.currentProviderIndex = nextIndex;
                connectionInfo.lastConnected = new Date();
                connectionInfo.isHealthy = true;
                
                this.healthStatus.set(networkName, { healthy: true, lastCheck: new Date() });
                this.reconnectAttempts.set(networkName, 0);
                
                // Set up listeners for new provider
                this.setupProviderListeners(networkName, nextProvider);
                
                console.log(`✅ Failover successful for ${networkName} to provider ${nextIndex + 1}`);
                this.emit('failoverSuccess', { network: networkName, providerIndex: nextIndex });
                
                return true;
                
            } catch (error) {
                console.warn(`⚠️ Failover attempt ${i} failed for ${networkName}:`, error.message);
            }
        }
        
        console.error(`❌ All failover attempts failed for ${networkName}`);
        this.emit('failoverFailed', { network: networkName });
        return false;
    }

    /**
     * Get provider for a network
     */
    getProvider(networkName) {
        const connectionInfo = this.connections.get(networkName);
        if (!connectionInfo) {
            throw new Error(`No connection found for network: ${networkName}`);
        }
        
        if (!connectionInfo.isHealthy) {
            throw new Error(`Connection unhealthy for network: ${networkName}`);
        }
        
        return connectionInfo.provider;
    }

    /**
     * Check if network connection is healthy
     */
    isNetworkHealthy(networkName) {
        const status = this.healthStatus.get(networkName);
        return status ? status.healthy : false;
    }

    /**
     * Perform health check on a specific network
     */
    async performHealthCheck(networkName) {
        const connectionInfo = this.connections.get(networkName);
        if (!connectionInfo) return false;

        try {
            const provider = connectionInfo.provider;
            const blockNumber = await provider.getBlockNumber();
            const network = await provider.getNetwork();
            
            // Verify chain ID hasn't changed
            if (Number(network.chainId) !== connectionInfo.config.chainId) {
                throw new Error('Chain ID mismatch detected');
            }
            
            // Update health status
            connectionInfo.isHealthy = true;
            this.healthStatus.set(networkName, { 
                healthy: true, 
                lastCheck: new Date(),
                blockNumber,
                chainId: Number(network.chainId)
            });
            
            return true;
            
        } catch (error) {
            console.warn(`⚠️ Health check failed for ${networkName}:`, error.message);
            
            connectionInfo.isHealthy = false;
            this.healthStatus.set(networkName, { 
                healthy: false, 
                lastCheck: new Date(),
                error: error.message
            });
            
            // Attempt reconnection
            await this.attemptReconnection(networkName);
            return false;
        }
    }

    /**
     * Attempt reconnection for a network
     */
    async attemptReconnection(networkName) {
        const attempts = this.reconnectAttempts.get(networkName) || 0;
        
        if (attempts >= this.maxReconnectAttempts) {
            console.error(`❌ Max reconnection attempts reached for ${networkName}`);
            this.emit('reconnectionFailed', { network: networkName, attempts });
            return false;
        }

        this.reconnectAttempts.set(networkName, attempts + 1);
        
        console.log(`🔄 Attempting reconnection ${attempts + 1}/${this.maxReconnectAttempts} for ${networkName}`);
        
        // Wait before attempting reconnection
        await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
        
        try {
            const connectionInfo = this.connections.get(networkName);
            await this.initializeConnection(networkName, connectionInfo.config);
            
            console.log(`✅ Reconnection successful for ${networkName}`);
            this.emit('reconnectionSuccess', { network: networkName, attempts: attempts + 1 });
            return true;
            
        } catch (error) {
            console.error(`❌ Reconnection attempt ${attempts + 1} failed for ${networkName}:`, error.message);
            
            // Try failover if reconnection fails
            return await this.attemptFailover(networkName);
        }
    }

    /**
     * Start health monitoring for all connections
     */
    startHealthMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        console.log('🔍 Starting connection health monitoring...');
        
        const monitor = async () => {
            const networks = Array.from(this.connections.keys());
            
            for (const networkName of networks) {
                await this.performHealthCheck(networkName);
            }
        };
        
        // Initial health check
        monitor();
        
        // Set up periodic monitoring
        this.healthCheckTimer = setInterval(monitor, this.healthCheckInterval);
        
        console.log(`✅ Health monitoring started (interval: ${this.healthCheckInterval}ms)`);
    }

    /**
     * Stop health monitoring
     */
    stopHealthMonitoring() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
        }
        
        console.log('🛑 Health monitoring stopped');
    }

    /**
     * Get comprehensive status of all connections
     */
    getConnectionStatus() {
        const status = {};
        
        for (const [networkName, connectionInfo] of this.connections.entries()) {
            const healthInfo = this.healthStatus.get(networkName);
            const reconnectAttempts = this.reconnectAttempts.get(networkName) || 0;
            
            status[networkName] = {
                connected: connectionInfo.isHealthy,
                providerIndex: connectionInfo.currentProviderIndex + 1,
                totalProviders: connectionInfo.providers.length,
                lastConnected: connectionInfo.lastConnected,
                health: healthInfo,
                reconnectAttempts,
                chainId: connectionInfo.config.chainId
            };
        }
        
        return status;
    }

    /**
     * Force reconnection for a specific network
     */
    async forceReconnect(networkName) {
        console.log(`🔄 Forcing reconnection for ${networkName}...`);
        
        const connectionInfo = this.connections.get(networkName);
        if (!connectionInfo) {
            throw new Error(`Network not found: ${networkName}`);
        }
        
        // Reset reconnection attempts
        this.reconnectAttempts.set(networkName, 0);
        
        // Attempt reconnection
        return await this.attemptReconnection(networkName);
    }

    /**
     * Shutdown all connections
     */
    async shutdown() {
        console.log('🔄 Shutting down connection manager...');
        
        this.stopHealthMonitoring();
        
        // Clean up provider listeners
        for (const [networkName, connectionInfo] of this.connections.entries()) {
            try {
                connectionInfo.provider.removeAllListeners();
            } catch (error) {
                console.warn(`Warning: Failed to clean up listeners for ${networkName}:`, error.message);
            }
        }
        
        this.connections.clear();
        this.healthStatus.clear();
        this.reconnectAttempts.clear();
        
        console.log('✅ Connection manager shutdown complete');
    }
}

export default ConnectionManager;