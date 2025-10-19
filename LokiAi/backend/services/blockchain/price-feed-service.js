import { ethers } from 'ethers';
import blockchainService from './blockchain-service.js';

/**
 * Chainlink Price Feed Service
 * Provides real-time price data using Chainlink oracle feeds across multiple networks
 */
class PriceFeedService {
    constructor() {
        this.priceFeeds = new Map();
        this.priceCache = new Map();
        this.cacheTimeout = 60000; // 1 minute cache
        this.isInitialized = false;
        
        // Chainlink Price Feed ABI (minimal interface)
        this.priceFeedABI = [
            {
                "inputs": [],
                "name": "latestRoundData",
                "outputs": [
                    { "internalType": "uint80", "name": "roundId", "type": "uint80" },
                    { "internalType": "int256", "name": "answer", "type": "int256" },
                    { "internalType": "uint256", "name": "startedAt", "type": "uint256" },
                    { "internalType": "uint256", "name": "updatedAt", "type": "uint256" },
                    { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "decimals",
                "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "description",
                "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
                "stateMutability": "view",
                "type": "function"
            }
        ];

        // Chainlink price feed addresses by network and pair
        this.feedAddresses = {
            ethereum: {
                'ETH/USD': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
                'BTC/USD': '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
                'USDC/USD': '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
                'USDT/USD': '0x3E7d1eAB13ad0104d2750B8863b489D65364e32D',
                'DAI/USD': '0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9',
                'LINK/USD': '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c',
                'UNI/USD': '0x553303d460EE0afB37EdFf9bE42922D8FF63220e',
                'AAVE/USD': '0x547a514d5e3769680Ce22B2361c10Ea13619e8a9',
                'MATIC/USD': '0x7bAC85A8a13A4BcD8abb3eB7d6b4d632c5a57676'
            },
            polygon: {
                'MATIC/USD': '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0',
                'ETH/USD': '0xF9680D99D6C9589e2a93a78A04A279e509205945',
                'BTC/USD': '0xc907E116054Ad103354f2D350FD2514433D57F6f',
                'USDC/USD': '0xfE4A8cc5b5B2366C1B58Bea3858e81843581b2F7',
                'USDT/USD': '0x0A6513e40db6EB1b165753AD52E80663aeA50545',
                'DAI/USD': '0x4746DeC9e833A82EC7C2C1356372CcF2cfcD2F3D',
                'LINK/USD': '0xd9FFdb71EbE7496cC440152d43986Aae0AB76665',
                'UNI/USD': '0xdf0Fb4e4F928d2dCB76f438575fDD8682386e13C',
                'AAVE/USD': '0x72484B12719E23115761D5DA1646945632979bB6'
            },
            bsc: {
                'BNB/USD': '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE',
                'ETH/USD': '0x9ef1B8c0E4F7dc8bF5719Ea496883DC6401d5b2e',
                'BTC/USD': '0x264990fbd0A4796A3E3d8E37C4d5F87a3aCa5Ebf',
                'USDC/USD': '0x51597f405303C4377E36123cBc172b13269EA163',
                'USDT/USD': '0xB97Ad0E74fa7d920791E90258A6E2085088b4320',
                'DAI/USD': '0x132d3C0B1D2cEa0BC552588063bdBb210FDeecfA',
                'LINK/USD': '0xca236E327F629f9Fc2c30A4E95775EbF0B89fac8',
                'UNI/USD': '0xb57f259E7C24e56a1dA00F66b55A5640d9f9E7e4',
                'CAKE/USD': '0xB6064eD41d4f67e353768aA239cA86f4F73665a1'
            },
            arbitrum: {
                'ETH/USD': '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612',
                'BTC/USD': '0x6ce185860a4963106506C203335A2910413708e9',
                'USDC/USD': '0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3',
                'USDT/USD': '0x3f3f5dF88dC9F13eac63DF89EC16ef6e7E25DdE7',
                'DAI/USD': '0xc5C8E77B397E531B8EC06BFb0048328B30E9eCfB',
                'LINK/USD': '0x86E53CF1B870786351Da77A57575e79CB55812CB',
                'UNI/USD': '0x9C917083fDb403ab5ADbEC26Ee294f6EcAda2720',
                'AAVE/USD': '0xaD1d5344AaDE45F43E596773Bcc4c423EAbdD034'
            }
        };
    }

    /**
     * Initialize price feed contracts for all networks
     */
    async initialize() {
        if (this.isInitialized) return;

        console.log('📊 Initializing Chainlink price feeds...');

        for (const [networkName, feeds] of Object.entries(this.feedAddresses)) {
            try {
                await this.initializeNetworkFeeds(networkName, feeds);
            } catch (error) {
                console.error(`❌ Failed to initialize price feeds for ${networkName}:`, error.message);
            }
        }

        this.isInitialized = true;
        console.log('✅ Chainlink price feeds initialized');
    }

    /**
     * Initialize price feeds for a specific network
     */
    async initializeNetworkFeeds(networkName, feeds) {
        if (!blockchainService.isNetworkSupported(networkName)) {
            console.warn(`⚠️ Network ${networkName} not supported, skipping price feeds`);
            return;
        }

        const provider = blockchainService.getProvider(networkName);
        const networkFeeds = new Map();

        for (const [pair, address] of Object.entries(feeds)) {
            try {
                const contract = new ethers.Contract(address, this.priceFeedABI, provider);
                
                // Test the contract by getting description and decimals
                const [description, decimals] = await Promise.all([
                    contract.description(),
                    contract.decimals()
                ]);

                networkFeeds.set(pair, {
                    contract,
                    address,
                    description,
                    decimals: Number(decimals),
                    pair
                });

                console.log(`✅ Price feed initialized: ${networkName}/${pair} (${description})`);

            } catch (error) {
                console.error(`❌ Failed to initialize ${networkName}/${pair}:`, error.message);
            }
        }

        this.priceFeeds.set(networkName, networkFeeds);
    }

    /**
     * Get latest price for a trading pair on a specific network
     */
    async getPrice(networkName, pair) {
        const cacheKey = `${networkName}:${pair}`;
        
        // Check cache first
        const cached = this.priceCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const networkFeeds = this.priceFeeds.get(networkName);
            if (!networkFeeds) {
                throw new Error(`No price feeds available for network: ${networkName}`);
            }

            const feedInfo = networkFeeds.get(pair);
            if (!feedInfo) {
                throw new Error(`Price feed not available for pair: ${pair} on ${networkName}`);
            }

            const roundData = await feedInfo.contract.latestRoundData();
            
            const price = Number(roundData.answer) / Math.pow(10, feedInfo.decimals);
            const timestamp = Number(roundData.updatedAt) * 1000; // Convert to milliseconds
            
            const priceData = {
                pair,
                network: networkName,
                price,
                decimals: feedInfo.decimals,
                roundId: roundData.roundId.toString(),
                updatedAt: new Date(timestamp),
                description: feedInfo.description,
                address: feedInfo.address,
                raw: {
                    answer: roundData.answer.toString(),
                    roundId: roundData.roundId.toString(),
                    startedAt: roundData.startedAt.toString(),
                    updatedAt: roundData.updatedAt.toString(),
                    answeredInRound: roundData.answeredInRound.toString()
                }
            };

            // Cache the result
            this.priceCache.set(cacheKey, {
                data: priceData,
                timestamp: Date.now()
            });

            return priceData;

        } catch (error) {
            throw new Error(`Failed to get price for ${pair} on ${networkName}: ${error.message}`);
        }
    }

    /**
     * Get prices for multiple pairs on a network
     */
    async getPrices(networkName, pairs) {
        const results = {};
        
        await Promise.allSettled(
            pairs.map(async (pair) => {
                try {
                    results[pair] = await this.getPrice(networkName, pair);
                } catch (error) {
                    results[pair] = {
                        error: error.message,
                        pair,
                        network: networkName
                    };
                }
            })
        );

        return results;
    }

    /**
     * Get all available prices for a network
     */
    async getAllPrices(networkName) {
        const networkFeeds = this.priceFeeds.get(networkName);
        if (!networkFeeds) {
            throw new Error(`No price feeds available for network: ${networkName}`);
        }

        const pairs = Array.from(networkFeeds.keys());
        return await this.getPrices(networkName, pairs);
    }

    /**
     * Get price across multiple networks for comparison
     */
    async getCrossNetworkPrice(pair) {
        const results = {};
        const networks = Array.from(this.priceFeeds.keys());

        await Promise.allSettled(
            networks.map(async (networkName) => {
                try {
                    const networkFeeds = this.priceFeeds.get(networkName);
                    if (networkFeeds && networkFeeds.has(pair)) {
                        results[networkName] = await this.getPrice(networkName, pair);
                    }
                } catch (error) {
                    results[networkName] = {
                        error: error.message,
                        pair,
                        network: networkName
                    };
                }
            })
        );

        return results;
    }

    /**
     * Get aggregated price with validation and fallback
     */
    async getAggregatedPrice(pair, preferredNetwork = 'ethereum') {
        try {
            // Try preferred network first
            if (this.priceFeeds.has(preferredNetwork)) {
                const networkFeeds = this.priceFeeds.get(preferredNetwork);
                if (networkFeeds.has(pair)) {
                    return await this.getPrice(preferredNetwork, pair);
                }
            }

            // Fallback to any available network
            const crossNetworkPrices = await this.getCrossNetworkPrice(pair);
            
            // Find first successful price
            for (const [networkName, priceData] of Object.entries(crossNetworkPrices)) {
                if (!priceData.error) {
                    console.log(`📊 Using ${networkName} price feed for ${pair} (fallback)`);
                    return priceData;
                }
            }

            throw new Error(`No valid price feed found for ${pair} across all networks`);

        } catch (error) {
            throw new Error(`Failed to get aggregated price for ${pair}: ${error.message}`);
        }
    }

    /**
     * Validate price data freshness
     */
    validatePriceFreshness(priceData, maxAgeMinutes = 10) {
        const now = new Date();
        const priceAge = now - priceData.updatedAt;
        const maxAge = maxAgeMinutes * 60 * 1000; // Convert to milliseconds

        if (priceAge > maxAge) {
            throw new Error(`Price data too old: ${Math.round(priceAge / 60000)} minutes old`);
        }

        return true;
    }

    /**
     * Get price with validation
     */
    async getValidatedPrice(networkName, pair, maxAgeMinutes = 10) {
        const priceData = await this.getPrice(networkName, pair);
        this.validatePriceFreshness(priceData, maxAgeMinutes);
        return priceData;
    }

    /**
     * Calculate price difference between networks (for arbitrage)
     */
    async getPriceDifference(pair, network1, network2) {
        try {
            const [price1, price2] = await Promise.all([
                this.getPrice(network1, pair),
                this.getPrice(network2, pair)
            ]);

            const difference = price1.price - price2.price;
            const percentageDiff = (difference / price1.price) * 100;

            return {
                pair,
                network1: { name: network1, price: price1.price, updatedAt: price1.updatedAt },
                network2: { name: network2, price: price2.price, updatedAt: price2.updatedAt },
                difference,
                percentageDifference: percentageDiff,
                arbitrageOpportunity: Math.abs(percentageDiff) > 0.1, // 0.1% threshold
                timestamp: new Date()
            };

        } catch (error) {
            throw new Error(`Failed to calculate price difference for ${pair}: ${error.message}`);
        }
    }

    /**
     * Get available trading pairs for a network
     */
    getAvailablePairs(networkName) {
        const networkFeeds = this.priceFeeds.get(networkName);
        return networkFeeds ? Array.from(networkFeeds.keys()) : [];
    }

    /**
     * Get all supported networks
     */
    getSupportedNetworks() {
        return Array.from(this.priceFeeds.keys());
    }

    /**
     * Clear price cache
     */
    clearCache() {
        this.priceCache.clear();
        console.log('🗑️ Price cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        const now = Date.now();
        let validEntries = 0;
        let expiredEntries = 0;

        for (const [key, cached] of this.priceCache.entries()) {
            if (now - cached.timestamp < this.cacheTimeout) {
                validEntries++;
            } else {
                expiredEntries++;
            }
        }

        return {
            totalEntries: this.priceCache.size,
            validEntries,
            expiredEntries,
            cacheTimeout: this.cacheTimeout
        };
    }

    /**
     * Monitor price feeds health
     */
    async monitorPriceFeeds() {
        const healthReport = {};

        for (const [networkName, networkFeeds] of this.priceFeeds.entries()) {
            healthReport[networkName] = {};

            for (const [pair, feedInfo] of networkFeeds.entries()) {
                try {
                    const priceData = await this.getPrice(networkName, pair);
                    const age = Date.now() - priceData.updatedAt.getTime();
                    
                    healthReport[networkName][pair] = {
                        status: 'healthy',
                        price: priceData.price,
                        ageMinutes: Math.round(age / 60000),
                        lastUpdate: priceData.updatedAt
                    };

                } catch (error) {
                    healthReport[networkName][pair] = {
                        status: 'error',
                        error: error.message
                    };
                }
            }
        }

        return healthReport;
    }
}

// Create singleton instance
const priceFeedService = new PriceFeedService();

export default priceFeedService;