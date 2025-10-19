import { ethers } from 'ethers';
import walletService from './wallet-service.js';
import gasService from './gas-service.js';
import blockchainService from './blockchain-service.js';

/**
 * Transaction Execution Service
 * Handles secure transaction signing, broadcasting, and confirmation monitoring
 */
class TransactionService {
    constructor() {
        this.pendingTransactions = new Map();
        this.transactionHistory = new Map();
        this.maxRetries = 3;
        this.confirmationBlocks = {
            ethereum: 2,
            polygon: 10,
            bsc: 3,
            arbitrum: 1
        };
    }

    /**
     * Execute transaction with server wallet
     */
    async executeTransaction(networkName, transactionRequest, options = {}) {
        try {
            const {
                speed = 'standard',
                maxRetries = this.maxRetries,
                waitForConfirmation = true,
                confirmations = this.confirmationBlocks[networkName] || 1
            } = options;

            // Get optimal gas settings
            const gasSettings = await gasService.getOptimalGasSettings(networkName, transactionRequest);
            const gasData = gasSettings.options[speed];

            // Prepare transaction with gas settings
            const txRequest = {
                ...transactionRequest,
                gasLimit: gasSettings.gasLimit
            };

            if (gasData.maxFeePerGas) {
                txRequest.maxFeePerGas = gasData.maxFeePerGas;
                txRequest.maxPriorityFeePerGas = gasData.maxPriorityFeePerGas;
            } else {
                txRequest.gasPrice = gasData.gasPrice;
            }

            // Send transaction
            const tx = await walletService.sendServerTransaction(networkName, txRequest);
            
            // Track transaction
            this.trackTransaction(networkName, tx.hash, {
                request: txRequest,
                options,
                startTime: Date.now()
            });

            // Wait for confirmation if requested
            if (waitForConfirmation) {
                const receipt = await walletService.waitForTransaction(networkName, tx.hash, confirmations);
                this.updateTransactionStatus(networkName, tx.hash, 'confirmed', receipt);
                
                return {
                    hash: tx.hash,
                    receipt,
                    status: 'confirmed',
                    gasUsed: receipt.gasUsed.toString(),
                    effectiveGasPrice: receipt.effectiveGasPrice?.toString(),
                    blockNumber: receipt.blockNumber,
                    confirmations,
                    timestamp: new Date()
                };
            }

            return {
                hash: tx.hash,
                status: 'pending',
                timestamp: new Date()
            };

        } catch (error) {
            throw new Error(`Transaction execution failed: ${error.message}`);
        }
    }

    /**
     * Execute batch transactions
     */
    async executeBatchTransactions(networkName, transactions, options = {}) {
        const results = [];
        const { sequential = false, stopOnError = false } = options;

        if (sequential) {
            // Execute transactions one by one
            for (let i = 0; i < transactions.length; i++) {
                try {
                    const result = await this.executeTransaction(networkName, transactions[i], options);
                    results.push({ index: i, success: true, ...result });
                } catch (error) {
                    results.push({ index: i, success: false, error: error.message });
                    if (stopOnError) break;
                }
            }
        } else {
            // Execute transactions in parallel
            const promises = transactions.map(async (tx, index) => {
                try {
                    const result = await this.executeTransaction(networkName, tx, options);
                    return { index, success: true, ...result };
                } catch (error) {
                    return { index, success: false, error: error.message };
                }
            });

            const settled = await Promise.allSettled(promises);
            results.push(...settled.map(result => 
                result.status === 'fulfilled' ? result.value : { success: false, error: result.reason.message }
            ));
        }

        return {
            network: networkName,
            total: transactions.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results,
            timestamp: new Date()
        };
    }

    /**
     * Track transaction status
     */
    trackTransaction(networkName, txHash, metadata) {
        const key = `${networkName}:${txHash}`;
        this.pendingTransactions.set(key, {
            hash: txHash,
            network: networkName,
            status: 'pending',
            metadata,
            createdAt: new Date()
        });
    }

    /**
     * Update transaction status
     */
    updateTransactionStatus(networkName, txHash, status, receipt = null) {
        const key = `${networkName}:${txHash}`;
        const tx = this.pendingTransactions.get(key);
        
        if (tx) {
            tx.status = status;
            tx.receipt = receipt;
            tx.updatedAt = new Date();
            
            if (status === 'confirmed' || status === 'failed') {
                // Move to history
                this.transactionHistory.set(key, tx);
                this.pendingTransactions.delete(key);
            }
        }
    }

    /**
     * Get transaction status
     */
    async getTransactionStatus(networkName, txHash) {
        const key = `${networkName}:${txHash}`;
        
        // Check pending transactions first
        const pending = this.pendingTransactions.get(key);
        if (pending) {
            try {
                const receipt = await walletService.getTransactionReceipt(networkName, txHash);
                if (receipt) {
                    const status = receipt.status === 1 ? 'confirmed' : 'failed';
                    this.updateTransactionStatus(networkName, txHash, status, receipt);
                    return { ...pending, status, receipt };
                }
                return pending;
            } catch (error) {
                return { ...pending, error: error.message };
            }
        }

        // Check history
        const historical = this.transactionHistory.get(key);
        if (historical) {
            return historical;
        }

        // Try to fetch from blockchain
        try {
            const receipt = await walletService.getTransactionReceipt(networkName, txHash);
            if (receipt) {
                const status = receipt.status === 1 ? 'confirmed' : 'failed';
                return {
                    hash: txHash,
                    network: networkName,
                    status,
                    receipt,
                    blockNumber: receipt.blockNumber,
                    gasUsed: receipt.gasUsed.toString()
                };
            }
            return { hash: txHash, network: networkName, status: 'not_found' };
        } catch (error) {
            return { hash: txHash, network: networkName, status: 'error', error: error.message };
        }
    }

    /**
     * Monitor pending transactions
     */
    async monitorPendingTransactions() {
        const updates = [];
        
        for (const [key, tx] of this.pendingTransactions.entries()) {
            try {
                const status = await this.getTransactionStatus(tx.network, tx.hash);
                if (status.status !== 'pending') {
                    updates.push(status);
                }
            } catch (error) {
                console.error(`Failed to monitor transaction ${tx.hash}:`, error.message);
            }
        }
        
        return updates;
    }

    /**
     * Retry failed transaction
     */
    async retryTransaction(networkName, originalTxHash, options = {}) {
        const key = `${networkName}:${originalTxHash}`;
        const tx = this.transactionHistory.get(key) || this.pendingTransactions.get(key);
        
        if (!tx || !tx.metadata) {
            throw new Error('Original transaction not found or missing metadata');
        }

        const { bumpGasPrice = true, gasMultiplier = 1.1 } = options;
        let txRequest = { ...tx.metadata.request };

        if (bumpGasPrice) {
            if (txRequest.maxFeePerGas) {
                txRequest.maxFeePerGas = BigInt(Math.floor(Number(txRequest.maxFeePerGas) * gasMultiplier));
                txRequest.maxPriorityFeePerGas = BigInt(Math.floor(Number(txRequest.maxPriorityFeePerGas) * gasMultiplier));
            } else if (txRequest.gasPrice) {
                txRequest.gasPrice = BigInt(Math.floor(Number(txRequest.gasPrice) * gasMultiplier));
            }
        }

        return await this.executeTransaction(networkName, txRequest, options);
    }

    /**
     * Cancel pending transaction (by sending 0 ETH to self with higher gas)
     */
    async cancelTransaction(networkName, txHash, gasMultiplier = 1.5) {
        const key = `${networkName}:${txHash}`;
        const tx = this.pendingTransactions.get(key);
        
        if (!tx) {
            throw new Error('Transaction not found in pending list');
        }

        const wallet = walletService.getServerWallet(networkName);
        const nonce = tx.metadata.request.nonce;
        
        if (!nonce) {
            throw new Error('Cannot cancel transaction without nonce');
        }

        // Create cancellation transaction (0 ETH to self with same nonce)
        const cancelTx = {
            to: await wallet.getAddress(),
            value: 0,
            nonce,
            gasLimit: 21000
        };

        // Use higher gas price
        if (tx.metadata.request.maxFeePerGas) {
            cancelTx.maxFeePerGas = BigInt(Math.floor(Number(tx.metadata.request.maxFeePerGas) * gasMultiplier));
            cancelTx.maxPriorityFeePerGas = BigInt(Math.floor(Number(tx.metadata.request.maxPriorityFeePerGas) * gasMultiplier));
        } else if (tx.metadata.request.gasPrice) {
            cancelTx.gasPrice = BigInt(Math.floor(Number(tx.metadata.request.gasPrice) * gasMultiplier));
        }

        return await this.executeTransaction(networkName, cancelTx, { waitForConfirmation: true });
    }

    /**
     * Get transaction history
     */
    getTransactionHistory(networkName = null, limit = 50) {
        let transactions = Array.from(this.transactionHistory.values());
        
        if (networkName) {
            transactions = transactions.filter(tx => tx.network === networkName);
        }
        
        return transactions
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);
    }

    /**
     * Get pending transactions
     */
    getPendingTransactions(networkName = null) {
        let transactions = Array.from(this.pendingTransactions.values());
        
        if (networkName) {
            transactions = transactions.filter(tx => tx.network === networkName);
        }
        
        return transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    /**
     * Clear old transaction history
     */
    clearOldHistory(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days default
        const cutoff = new Date(Date.now() - maxAge);
        let cleared = 0;
        
        for (const [key, tx] of this.transactionHistory.entries()) {
            if (new Date(tx.createdAt) < cutoff) {
                this.transactionHistory.delete(key);
                cleared++;
            }
        }
        
        console.log(`🗑️ Cleared ${cleared} old transactions from history`);
        return cleared;
    }

    /**
     * Get service statistics
     */
    getStats() {
        const pending = this.pendingTransactions.size;
        const historical = this.transactionHistory.size;
        
        const networkStats = {};
        for (const tx of [...this.pendingTransactions.values(), ...this.transactionHistory.values()]) {
            if (!networkStats[tx.network]) {
                networkStats[tx.network] = { pending: 0, confirmed: 0, failed: 0 };
            }
            
            if (tx.status === 'pending') {
                networkStats[tx.network].pending++;
            } else if (tx.status === 'confirmed') {
                networkStats[tx.network].confirmed++;
            } else if (tx.status === 'failed') {
                networkStats[tx.network].failed++;
            }
        }
        
        return {
            totalPending: pending,
            totalHistorical: historical,
            networkStats,
            timestamp: new Date()
        };
    }
}

// Create singleton instance
const transactionService = new TransactionService();

export default transactionService;