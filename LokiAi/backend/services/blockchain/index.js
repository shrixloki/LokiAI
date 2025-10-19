import blockchainService from './blockchain-service.js';
import walletService from './wallet-service.js';

/**
 * Blockchain Integration Entry Point
 * Initializes all blockchain services and provides unified access
 */
class BlockchainIntegration {
    constructor() {
        this.isInitialized = false;
        this.services = {
            blockchain: blockchainService,
            wallet: walletService
        };
    }

    /**
     * Initialize all blockchain services
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('⚠️ Blockchain integration already initialized');
            return;
        }

        console.log('🚀 Initializing LokiAI Blockchain Integration...');
        
        try {
            // Initialize blockchain connections
            await blockchainService.initialize();
            
            // Initialize server wallets
            await walletService.initializeServerWallets();
            
            // Start connection monitoring
            blockchainService.monitorConnections();
            
            this.isInitialized = true;
            console.log('✅ Blockchain integration initialized successfully');
            
            // Log initialization summary
            await this.logInitializationSummary();
            
        } catch (error) {
            console.error('❌ Blockchain integration initialization failed:', error);
            throw error;
        }
    }

    /**
     * Log initialization summary
     */
    async logInitializationSummary() {
        console.log('\n📊 BLOCKCHAIN INTEGRATION SUMMARY');
        console.log('=====================================');
        
        // Network status
        const networkStatus = await blockchainService.getAllNetworkStatus();
        console.log('🔗 Network Connections:');
        for (const [network, status] of Object.entries(networkStatus)) {
            const statusIcon = status.connected ? '✅' : '❌';
            console.log(`   ${statusIcon} ${network}: Block ${status.blockNumber || 'N/A'}`);
        }
        
        // Wallet addresses
        const walletAddresses = walletService.getServerWalletAddresses();
        console.log('\n💼 Server Wallets:');
        for (const [network, address] of Object.entries(walletAddresses)) {
            console.log(`   🔑 ${network}: ${address}`);
        }
        
        console.log('\n🎯 Ready for AI Agent Integration');
        console.log('=====================================\n');
    }

    /**
     * Get blockchain service
     */
    getBlockchainService() {
        this.ensureInitialized();
        return blockchainService;
    }

    /**
     * Get wallet service
     */
    getWalletService() {
        this.ensureInitialized();
        return walletService;
    }

    /**
     * Get all services
     */
    getServices() {
        this.ensureInitialized();
        return this.services;
    }

    /**
     * Check if integration is initialized
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * Ensure services are initialized
     */
    ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error('Blockchain integration not initialized. Call initialize() first.');
        }
    }

    /**
     * Get health status of all blockchain services
     */
    async getHealthStatus() {
        if (!this.isInitialized) {
            return {
                status: 'not_initialized',
                message: 'Blockchain integration not initialized'
            };
        }

        try {
            const networkStatus = await blockchainService.getAllNetworkStatus();
            const connectedNetworks = Object.values(networkStatus).filter(n => n.connected).length;
            const totalNetworks = Object.keys(networkStatus).length;
            
            const walletAddresses = walletService.getServerWalletAddresses();
            const availableWallets = Object.keys(walletAddresses).length;
            
            return {
                status: connectedNetworks > 0 ? 'healthy' : 'unhealthy',
                initialized: this.isInitialized,
                networks: {
                    connected: connectedNetworks,
                    total: totalNetworks,
                    details: networkStatus
                },
                wallets: {
                    available: availableWallets,
                    addresses: walletAddresses
                },
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Shutdown blockchain services gracefully
     */
    async shutdown() {
        console.log('🔄 Shutting down blockchain integration...');
        
        // Add any cleanup logic here
        this.isInitialized = false;
        
        console.log('✅ Blockchain integration shutdown complete');
    }
}

// Create singleton instance
const blockchainIntegration = new BlockchainIntegration();

export default blockchainIntegration;