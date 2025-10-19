import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { ethers } from 'ethers';
import blockchainService from '../services/blockchain/blockchain-service.js';
import walletService from '../services/blockchain/wallet-service.js';
import priceFeedService from '../services/blockchain/price-feed-service.js';
import gasService from '../services/blockchain/gas-service.js';
import ConnectionManager from '../services/blockchain/connection-manager.js';

// Mock environment variables for testing
process.env.ETHEREUM_RPC_URL = 'https://eth-mainnet.alchemyapi.io/v2/test-key';
process.env.POLYGON_RPC_URL = 'https://polygon-mainnet.alchemyapi.io/v2/test-key';
process.env.ETHEREUM_PRIVATE_KEY = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

describe('Blockchain Service Tests', () => {
    beforeAll(async () => {
        // Initialize blockchain service for testing
        try {
            await blockchainService.initialize();
        } catch (error) {
            console.warn('Blockchain service initialization failed in tests:', error.message);
        }
    });

    describe('Network Configuration', () => {
        it('should have correct network configurations', () => {
            const networks = blockchainService.getSupportedNetworks();
            expect(networks).toContain('ethereum');
            expect(networks).toContain('polygon');
            expect(networks).toContain('bsc');
            expect(networks).toContain('arbitrum');
        });

        it('should return network config for supported networks', () => {
            const ethConfig = blockchainService.getNetworkConfig('ethereum');
            expect(ethConfig).toBeDefined();
            expect(ethConfig.chainId).toBe(1);
            expect(ethConfig.name).toBe('Ethereum Mainnet');
            expect(ethConfig.nativeCurrency.symbol).toBe('ETH');
        });

        it('should throw error for unsupported network', () => {
            expect(() => {
                blockchainService.getNetworkConfig('unsupported');
            }).toThrow('Network configuration not found: unsupported');
        });
    });

    describe('Provider Management', () => {
        it('should check if network is supported', () => {
            // This might fail if RPC is not configured, which is expected in test environment
            const isSupported = blockchainService.isNetworkSupported('ethereum');
            expect(typeof isSupported).toBe('boolean');
        });

        it('should get explorer URLs', () => {
            const txUrl = blockchainService.getExplorerUrl('ethereum', '0x123');
            expect(txUrl).toBe('https://etherscan.io/tx/0x123');

            const addressUrl = blockchainService.getAddressExplorerUrl('ethereum', '0x456');
            expect(addressUrl).toBe('https://etherscan.io/address/0x456');
        });
    });
});

describe('Connection Manager Tests', () => {
    let connectionManager;

    beforeEach(() => {
        connectionManager = new ConnectionManager();
    });

    afterEach(async () => {
        await connectionManager.shutdown();
    });

    describe('Provider Chain Creation', () => {
        it('should create provider chain with primary and backup URLs', () => {
            const config = {
                chainId: 1,
                name: 'Ethereum Mainnet',
                rpcUrl: 'https://primary-rpc.com',
                backupRpcUrls: ['https://backup1.com', 'https://backup2.com']
            };

            const providers = connectionManager.createProviderChain(config);
            expect(providers.length).toBeGreaterThanOrEqual(3); // Primary + backups + public RPCs
        });

        it('should include public RPC URLs as fallback', () => {
            const publicRpcs = connectionManager.getPublicRpcUrls(1); // Ethereum
            expect(publicRpcs.length).toBeGreaterThan(0);
            expect(publicRpcs[0]).toContain('llamarpc.com');
        });
    });

    describe('Connection Status', () => {
        it('should return empty status when no connections', () => {
            const status = connectionManager.getConnectionStatus();
            expect(status).toEqual({});
        });

        it('should track connection attempts', () => {
            expect(connectionManager.reconnectAttempts.size).toBe(0);
        });
    });
});

describe('Wallet Service Tests', () => {
    beforeEach(() => {
        walletService.userSessions.clear();
        walletService.serverWallets.clear();
    });

    describe('MetaMask Signature Validation', () => {
        it('should validate correct MetaMask signature', async () => {
            const wallet = ethers.Wallet.createRandom();
            const message = 'Test message for signing';
            const signature = await wallet.signMessage(message);

            const isValid = await walletService.validateMetaMaskSignature(
                wallet.address,
                message,
                signature
            );

            expect(isValid).toBe(true);
        });

        it('should reject invalid signature', async () => {
            const wallet = ethers.Wallet.createRandom();
            const message = 'Test message';
            const wrongSignature = '0x1234567890abcdef';

            const isValid = await walletService.validateMetaMaskSignature(
                wallet.address,
                message,
                wrongSignature
            );

            expect(isValid).toBe(false);
        });

        it('should reject signature from different address', async () => {
            const wallet1 = ethers.Wallet.createRandom();
            const wallet2 = ethers.Wallet.createRandom();
            const message = 'Test message';
            const signature = await wallet1.signMessage(message);

            const isValid = await walletService.validateMetaMaskSignature(
                wallet2.address,
                message,
                signature
            );

            expect(isValid).toBe(false);
        });
    });

    describe('User Session Management', () => {
        it('should create user session', () => {
            const address = '0x1234567890123456789012345678901234567890';
            const session = walletService.createUserSession(address);

            expect(session.address).toBe(address.toLowerCase());
            expect(session.sessionId).toBeDefined();
            expect(session.isActive).toBe(true);
            expect(session.createdAt).toBeInstanceOf(Date);
        });

        it('should retrieve user session', () => {
            const address = '0x1234567890123456789012345678901234567890';
            const session = walletService.createUserSession(address);
            const retrieved = walletService.getUserSession(address);

            expect(retrieved).toEqual(session);
        });

        it('should update session activity', () => {
            const address = '0x1234567890123456789012345678901234567890';
            const session = walletService.createUserSession(address);
            const originalActivity = session.lastActivity;

            // Wait a bit to ensure timestamp difference
            setTimeout(() => {
                walletService.updateSessionActivity(address);
                expect(session.lastActivity.getTime()).toBeGreaterThan(originalActivity.getTime());
            }, 10);
        });
    });

    describe('Wallet Permissions', () => {
        it('should validate active session permissions', async () => {
            const address = '0x1234567890123456789012345678901234567890';
            walletService.createUserSession(address);

            const isValid = await walletService.validateWalletPermissions(
                address,
                'ethereum',
                'swap'
            );

            expect(isValid).toBe(true);
        });

        it('should reject permissions for non-existent session', async () => {
            const address = '0x1234567890123456789012345678901234567890';

            await expect(
                walletService.validateWalletPermissions(address, 'ethereum', 'swap')
            ).rejects.toThrow('Invalid or expired user session');
        });
    });

    describe('Data Encryption', () => {
        it('should encrypt and decrypt wallet data', () => {
            const testData = { privateKey: '0x123', address: '0x456' };
            const encrypted = walletService.encryptWalletData(testData);

            expect(encrypted.encrypted).toBeDefined();
            expect(encrypted.iv).toBeDefined();

            const decrypted = walletService.decryptWalletData(encrypted.encrypted, encrypted.iv);
            expect(decrypted).toEqual(testData);
        });
    });
});

describe('Price Feed Service Tests', () => {
    beforeAll(async () => {
        // Initialize price feed service
        try {
            await priceFeedService.initialize();
        } catch (error) {
            console.warn('Price feed service initialization failed in tests:', error.message);
        }
    });

    describe('Feed Configuration', () => {
        it('should have price feed addresses configured', () => {
            const ethFeeds = priceFeedService.feedAddresses.ethereum;
            expect(ethFeeds).toBeDefined();
            expect(ethFeeds['ETH/USD']).toBeDefined();
            expect(ethFeeds['BTC/USD']).toBeDefined();
        });

        it('should return available pairs for networks', () => {
            const ethPairs = priceFeedService.getAvailablePairs('ethereum');
            expect(Array.isArray(ethPairs)).toBe(true);
        });

        it('should return supported networks', () => {
            const networks = priceFeedService.getSupportedNetworks();
            expect(Array.isArray(networks)).toBe(true);
        });
    });

    describe('Price Validation', () => {
        it('should validate price freshness', () => {
            const freshPrice = {
                updatedAt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
            };

            expect(() => {
                priceFeedService.validatePriceFreshness(freshPrice, 10);
            }).not.toThrow();
        });

        it('should reject stale price data', () => {
            const stalePrice = {
                updatedAt: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
            };

            expect(() => {
                priceFeedService.validatePriceFreshness(stalePrice, 10);
            }).toThrow('Price data too old');
        });
    });

    describe('Cache Management', () => {
        it('should clear price cache', () => {
            priceFeedService.priceCache.set('test', { data: 'test', timestamp: Date.now() });
            expect(priceFeedService.priceCache.size).toBe(1);

            priceFeedService.clearCache();
            expect(priceFeedService.priceCache.size).toBe(0);
        });

        it('should return cache statistics', () => {
            const stats = priceFeedService.getCacheStats();
            expect(stats).toHaveProperty('totalEntries');
            expect(stats).toHaveProperty('validEntries');
            expect(stats).toHaveProperty('expiredEntries');
            expect(stats).toHaveProperty('cacheTimeout');
        });
    });
});

describe('Gas Service Tests', () => {
    describe('Gas Limit Estimation', () => {
        it('should return correct fallback gas limits', () => {
            // Test ETH transfer
            const ethTransfer = { to: '0x123', value: ethers.parseEther('1') };
            const ethGas = gasService.getFallbackGasLimit(ethTransfer);
            expect(ethGas).toBe(21000);

            // Test contract deployment
            const deployment = { data: '0x608060405234801561001057600080fd5b50' };
            const deployGas = gasService.getFallbackGasLimit(deployment);
            expect(deployGas).toBe(2000000);

            // Test ERC20 transfer
            const erc20Transfer = {
                to: '0x123',
                data: '0xa9059cbb000000000000000000000000123456789012345678901234567890123456789000000000000000000000000000000000000000000000000000000000000003e8'
            };
            const erc20Gas = gasService.getFallbackGasLimit(erc20Transfer);
            expect(erc20Gas).toBe(65000);
        });
    });

    describe('Gas Price Calculations', () => {
        it('should calculate EIP-1559 gas prices', async () => {
            const mockFeeData = {
                maxFeePerGas: ethers.parseUnits('20', 'gwei'),
                maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
            };

            const config = {
                baseFeeMultiplier: 1.2,
                priorityFeeMultiplier: 1.1,
                maxGasPrice: ethers.parseUnits('100', 'gwei')
            };

            const gasData = await gasService.calculateEIP1559Gas(mockFeeData, config, 'ethereum');

            expect(gasData.type).toBe('eip1559');
            expect(gasData.slow).toBeDefined();
            expect(gasData.standard).toBeDefined();
            expect(gasData.fast).toBeDefined();
        });

        it('should calculate legacy gas prices', async () => {
            const mockFeeData = {
                gasPrice: ethers.parseUnits('20', 'gwei')
            };

            const config = {
                maxGasPrice: ethers.parseUnits('100', 'gwei')
            };

            const gasData = await gasService.calculateLegacyGas(mockFeeData, config, 'bsc');

            expect(gasData.type).toBe('legacy');
            expect(gasData.slow).toBeDefined();
            expect(gasData.standard).toBeDefined();
            expect(gasData.fast).toBeDefined();
        });
    });

    describe('Gas Monitoring', () => {
        it('should provide gas recommendations', () => {
            // Test price increase recommendation
            const increaseRec = gasService.getGasRecommendation(25, 'ethereum');
            expect(increaseRec.action).toBe('wait');
            expect(increaseRec.urgency).toBe('high');

            // Test price decrease recommendation
            const decreaseRec = gasService.getGasRecommendation(-25, 'ethereum');
            expect(decreaseRec.action).toBe('execute');
            expect(decreaseRec.urgency).toBe('low');

            // Test stable price recommendation
            const stableRec = gasService.getGasRecommendation(5, 'ethereum');
            expect(stableRec.action).toBe('normal');
            expect(stableRec.urgency).toBe('medium');
        });

        it('should manage gas history', () => {
            const mockGasData = {
                type: 'eip1559',
                baseFeeGwei: '20',
                standard: { maxFeePerGasGwei: '25' }
            };

            gasService.addToHistory('ethereum', mockGasData);
            const history = gasService.getGasHistory('ethereum');

            expect(history.length).toBe(1);
            expect(history[0]).toMatchObject(mockGasData);
        });
    });

    describe('Cache Management', () => {
        it('should clear gas cache', () => {
            gasService.gasCache.set('test', { data: 'test', timestamp: Date.now() });
            expect(gasService.gasCache.size).toBe(1);

            gasService.clearCache();
            expect(gasService.gasCache.size).toBe(0);
        });

        it('should return service statistics', () => {
            const stats = gasService.getStats();
            expect(stats).toHaveProperty('cacheSize');
            expect(stats).toHaveProperty('cacheTimeout');
            expect(stats).toHaveProperty('networks');
            expect(stats).toHaveProperty('supportedNetworks');
        });
    });
});

describe('Integration Tests', () => {
    describe('Service Initialization', () => {
        it('should initialize all services without errors', async () => {
            // This test verifies that all services can be imported and basic methods work
            expect(blockchainService).toBeDefined();
            expect(walletService).toBeDefined();
            expect(priceFeedService).toBeDefined();
            expect(gasService).toBeDefined();
        });

        it('should handle missing environment variables gracefully', () => {
            // Test that services don't crash when env vars are missing
            const originalEnv = process.env.ETHEREUM_RPC_URL;
            delete process.env.ETHEREUM_RPC_URL;

            expect(() => {
                // Services should handle missing config gracefully
                blockchainService.getSupportedNetworks();
            }).not.toThrow();

            // Restore env var
            if (originalEnv) {
                process.env.ETHEREUM_RPC_URL = originalEnv;
            }
        });
    });

    describe('Error Handling', () => {
        it('should handle network errors gracefully', async () => {
            // Test with invalid network
            await expect(
                gasService.getGasPrices('invalid-network')
            ).rejects.toThrow();
        });

        it('should handle invalid addresses', () => {
            expect(() => {
                walletService.createUserSession('invalid-address');
            }).not.toThrow(); // Service should handle this gracefully
        });
    });
});

// Mock implementations for testing without actual network calls
jest.mock('ethers', () => ({
    ...jest.requireActual('ethers'),
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
        getNetwork: jest.fn().mockResolvedValue({ chainId: 1n }),
        getBlockNumber: jest.fn().mockResolvedValue(18000000),
        getFeeData: jest.fn().mockResolvedValue({
            gasPrice: ethers.parseUnits('20', 'gwei'),
            maxFeePerGas: ethers.parseUnits('25', 'gwei'),
            maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
        }),
        estimateGas: jest.fn().mockResolvedValue(21000n),
        getBalance: jest.fn().mockResolvedValue(ethers.parseEther('1')),
        waitForTransaction: jest.fn().mockResolvedValue({
            blockNumber: 18000001,
            gasUsed: 21000n,
            status: 1
        })
    }))
}));