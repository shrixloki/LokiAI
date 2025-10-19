import { ethers } from 'ethers';
import crypto from 'crypto';
import blockchainService from './blockchain-service.js';

/**
 * Wallet Service - Manages MetaMask integration and server-side private key operations
 * Handles both user-initiated transactions and automated agent operations
 */
class WalletService {
    constructor() {
        this.serverWallets = new Map(); // Network -> Wallet mapping
        this.userSessions = new Map(); // Address -> Session data
        this.encryptionKey = process.env.WALLET_ENCRYPTION_KEY || 'loki-wallet-key-2025';
    }

    /**
     * Initialize server-side wallets for automated operations
     */
    async initializeServerWallets() {
        console.log('🔐 Initializing server wallets...');
        
        const networks = blockchainService.getSupportedNetworks();
        
        for (const networkName of networks) {
            try {
                await this.initializeServerWallet(networkName);
            } catch (error) {
                console.error(`❌ Failed to initialize server wallet for ${networkName}:`, error.message);
            }
        }
        
        console.log('✅ Server wallets initialized');
    }

    /**
     * Initialize server wallet for a specific network
     */
    async initializeServerWallet(networkName) {
        const privateKeyEnvVar = `${networkName.toUpperCase()}_PRIVATE_KEY`;
        const privateKey = process.env[privateKeyEnvVar];
        
        if (!privateKey) {
            console.warn(`⚠️ No private key configured for ${networkName} (${privateKeyEnvVar})`);
            return;
        }

        try {
            const provider = blockchainService.getProvider(networkName);
            const wallet = new ethers.Wallet(privateKey, provider);
            
            // Verify wallet can connect
            const address = await wallet.getAddress();
            const balance = await wallet.provider.getBalance(address);
            
            this.serverWallets.set(networkName, wallet);
            
            console.log(`✅ Server wallet initialized for ${networkName}:`);
            console.log(`   Address: ${address}`);
            console.log(`   Balance: ${ethers.formatEther(balance)} ${blockchainService.getNetworkConfig(networkName).nativeCurrency.symbol}`);
            
        } catch (error) {
            throw new Error(`Server wallet initialization failed for ${networkName}: ${error.message}`);
        }
    }

    /**
     * Get server wallet for a specific network
     */
    getServerWallet(networkName) {
        const wallet = this.serverWallets.get(networkName);
        if (!wallet) {
            throw new Error(`Server wallet not available for network: ${networkName}`);
        }
        return wallet;
    }

    /**
     * Validate MetaMask signature for user authentication
     */
    async validateMetaMaskSignature(address, message, signature) {
        try {
            const recoveredAddress = ethers.verifyMessage(message, signature);
            return recoveredAddress.toLowerCase() === address.toLowerCase();
        } catch (error) {
            console.error('❌ MetaMask signature validation failed:', error);
            return false;
        }
    }

    /**
     * Create user session after successful MetaMask authentication
     */
    createUserSession(address, networkName = 'ethereum') {
        const sessionId = crypto.randomBytes(32).toString('hex');
        const session = {
            address: address.toLowerCase(),
            networkName,
            sessionId,
            createdAt: new Date(),
            lastActivity: new Date(),
            isActive: true
        };
        
        this.userSessions.set(address.toLowerCase(), session);
        return session;
    }

    /**
     * Get user session
     */
    getUserSession(address) {
        return this.userSessions.get(address.toLowerCase());
    }

    /**
     * Update user session activity
     */
    updateSessionActivity(address) {
        const session = this.getUserSession(address);
        if (session) {
            session.lastActivity = new Date();
        }
    }

    /**
     * Validate wallet permissions before executing transactions
     */
    async validateWalletPermissions(address, networkName, transactionType) {
        const session = this.getUserSession(address);
        
        if (!session || !session.isActive) {
            throw new Error('Invalid or expired user session');
        }

        // Check if session is too old (24 hours)
        const sessionAge = Date.now() - session.createdAt.getTime();
        if (sessionAge > 24 * 60 * 60 * 1000) {
            session.isActive = false;
            throw new Error('Session expired, please re-authenticate');
        }

        // Update activity
        this.updateSessionActivity(address);

        // Additional permission checks can be added here
        // For example, checking if user has enabled specific transaction types
        
        return true;
    }

    /**
     * Get wallet balance for any address on any network
     */
    async getWalletBalance(address, networkName) {
        try {
            const provider = blockchainService.getProvider(networkName);
            const balance = await provider.getBalance(address);
            const config = blockchainService.getNetworkConfig(networkName);
            
            return {
                address,
                network: networkName,
                balance: balance.toString(),
                balanceFormatted: ethers.formatEther(balance),
                currency: config.nativeCurrency.symbol,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Failed to get balance for ${address} on ${networkName}: ${error.message}`);
        }
    }

    /**
     * Get balances across all supported networks
     */
    async getMultiChainBalance(address) {
        const networks = blockchainService.getSupportedNetworks();
        const balances = {};
        
        await Promise.allSettled(
            networks.map(async (networkName) => {
                try {
                    balances[networkName] = await this.getWalletBalance(address, networkName);
                } catch (error) {
                    balances[networkName] = {
                        address,
                        network: networkName,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    };
                }
            })
        );
        
        return balances;
    }

    /**
     * Sign transaction with server wallet (for automated operations)
     */
    async signServerTransaction(networkName, transactionRequest) {
        const wallet = this.getServerWallet(networkName);
        
        try {
            // Add gas estimation if not provided
            if (!transactionRequest.gasLimit) {
                transactionRequest.gasLimit = await wallet.estimateGas(transactionRequest);
            }
            
            // Add gas price if not provided
            if (!transactionRequest.gasPrice && !transactionRequest.maxFeePerGas) {
                const feeData = await wallet.provider.getFeeData();
                if (feeData.maxFeePerGas) {
                    transactionRequest.maxFeePerGas = feeData.maxFeePerGas;
                    transactionRequest.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
                } else {
                    transactionRequest.gasPrice = feeData.gasPrice;
                }
            }
            
            const signedTx = await wallet.signTransaction(transactionRequest);
            return signedTx;
            
        } catch (error) {
            throw new Error(`Failed to sign transaction on ${networkName}: ${error.message}`);
        }
    }

    /**
     * Send transaction with server wallet
     */
    async sendServerTransaction(networkName, transactionRequest) {
        const wallet = this.getServerWallet(networkName);
        
        try {
            const tx = await wallet.sendTransaction(transactionRequest);
            
            console.log(`📤 Transaction sent on ${networkName}:`);
            console.log(`   Hash: ${tx.hash}`);
            console.log(`   From: ${tx.from}`);
            console.log(`   To: ${tx.to}`);
            console.log(`   Value: ${ethers.formatEther(tx.value || 0)} ${blockchainService.getNetworkConfig(networkName).nativeCurrency.symbol}`);
            
            return tx;
            
        } catch (error) {
            throw new Error(`Failed to send transaction on ${networkName}: ${error.message}`);
        }
    }

    /**
     * Wait for transaction confirmation
     */
    async waitForTransaction(networkName, txHash, confirmations = 1) {
        const provider = blockchainService.getProvider(networkName);
        
        try {
            const receipt = await provider.waitForTransaction(txHash, confirmations);
            
            console.log(`✅ Transaction confirmed on ${networkName}:`);
            console.log(`   Hash: ${txHash}`);
            console.log(`   Block: ${receipt.blockNumber}`);
            console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
            console.log(`   Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`);
            
            return receipt;
            
        } catch (error) {
            throw new Error(`Transaction confirmation failed on ${networkName}: ${error.message}`);
        }
    }

    /**
     * Get transaction receipt
     */
    async getTransactionReceipt(networkName, txHash) {
        const provider = blockchainService.getProvider(networkName);
        return await provider.getTransactionReceipt(txHash);
    }

    /**
     * Estimate gas for a transaction
     */
    async estimateGas(networkName, transactionRequest) {
        const provider = blockchainService.getProvider(networkName);
        return await provider.estimateGas(transactionRequest);
    }

    /**
     * Get current gas prices
     */
    async getGasPrices(networkName) {
        const provider = blockchainService.getProvider(networkName);
        const feeData = await provider.getFeeData();
        
        return {
            network: networkName,
            gasPrice: feeData.gasPrice?.toString(),
            maxFeePerGas: feeData.maxFeePerGas?.toString(),
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Create separate wallet context for different trading strategies
     */
    createStrategyWallet(networkName, strategyName, privateKey = null) {
        try {
            const provider = blockchainService.getProvider(networkName);
            
            let wallet;
            if (privateKey) {
                wallet = new ethers.Wallet(privateKey, provider);
            } else {
                // Generate new wallet for strategy
                wallet = ethers.Wallet.createRandom(provider);
            }
            
            const strategyKey = `${networkName}-${strategyName}`;
            this.serverWallets.set(strategyKey, wallet);
            
            console.log(`✅ Strategy wallet created: ${strategyKey}`);
            console.log(`   Address: ${wallet.address}`);
            
            return {
                address: wallet.address,
                strategyName,
                networkName,
                privateKey: privateKey ? '[HIDDEN]' : wallet.privateKey
            };
            
        } catch (error) {
            throw new Error(`Failed to create strategy wallet: ${error.message}`);
        }
    }

    /**
     * Get strategy wallet
     */
    getStrategyWallet(networkName, strategyName) {
        const strategyKey = `${networkName}-${strategyName}`;
        const wallet = this.serverWallets.get(strategyKey);
        
        if (!wallet) {
            throw new Error(`Strategy wallet not found: ${strategyKey}`);
        }
        
        return wallet;
    }

    /**
     * Get all server wallet addresses
     */
    getServerWalletAddresses() {
        const addresses = {};
        
        for (const [key, wallet] of this.serverWallets.entries()) {
            addresses[key] = wallet.address;
        }
        
        return addresses;
    }

    /**
     * Encrypt sensitive wallet data
     */
    encryptWalletData(data) {
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return { encrypted, iv: iv.toString('hex') };
    }

    /**
     * Decrypt wallet data
     */
    decryptWalletData(encryptedData, ivHex) {
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    }
}

// Create singleton instance
const walletService = new WalletService();

export default walletService;