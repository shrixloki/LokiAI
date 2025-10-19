/**
 * Contract Registry - Manages contract addresses and ABIs across multiple networks
 * Provides centralized access to DeFi protocol contracts
 */
class ContractRegistry {
    constructor() {
        this.contracts = new Map();
        this.initializeContracts();
    }

    /**
     * Initialize contract addresses for all supported protocols and networks
     */
    initializeContracts() {
        // Ethereum Mainnet Contracts
        this.contracts.set('ethereum', {
            // Uniswap V2
            uniswapV2Router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
            uniswapV2Factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
            
            // Uniswap V3
            uniswapV3Router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
            uniswapV3Factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
            uniswapV3Quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
            
            // SushiSwap
            sushiswapRouter: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
            sushiswapFactory: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
            
            // Aave V3
            aavePool: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
            aavePoolDataProvider: '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3',
            aaveOracle: '0x54586bE62E3c3580375aE3723C145253060Ca0C2',
            
            // Curve
            curveRegistry: '0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5',
            curveAddressProvider: '0x0000000022D53366457F9d5E68Ec105046FC4383',
            
            // Compound V3
            compoundComet: '0xc3d688B66703497DAA19211EEdff47f25384cdc3', // USDC market
            
            // Common ERC20 Tokens
            tokens: {
                WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                USDC: '0xA0b86a33E6441c8C06DD2b7c94b7E0e8b8b8b8b8',
                USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
                WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
                UNI: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
                LINK: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
                AAVE: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'
            }
        });

        // Polygon Mainnet Contracts
        this.contracts.set('polygon', {
            // Uniswap V3
            uniswapV3Router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
            uniswapV3Factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
            uniswapV3Quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
            
            // SushiSwap
            sushiswapRouter: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
            sushiswapFactory: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
            
            // QuickSwap
            quickswapRouter: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
            quickswapFactory: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
            
            // Aave V3
            aavePool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
            aavePoolDataProvider: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
            
            // Curve
            curveRegistry: '0x094d12e5b541784701FD8d65F11fc0598FBC6332',
            
            // Tokens
            tokens: {
                WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
                WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
                USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
                USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
                DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
                WBTC: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6'
            }
        });

        // BSC Mainnet Contracts
        this.contracts.set('bsc', {
            // PancakeSwap V2
            pancakeswapV2Router: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
            pancakeswapV2Factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
            
            // PancakeSwap V3
            pancakeswapV3Router: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4',
            pancakeswapV3Factory: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
            
            // Venus Protocol
            venusComptroller: '0xfD36E2c2a6789Db23113685031d7F16329158384',
            
            // Tokens
            tokens: {
                WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
                BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
                USDT: '0x55d398326f99059fF775485246999027B3197955',
                USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
                ETH: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
                BTC: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
                CAKE: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82'
            }
        });

        // Arbitrum One Contracts
        this.contracts.set('arbitrum', {
            // Uniswap V3
            uniswapV3Router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
            uniswapV3Factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
            uniswapV3Quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
            
            // SushiSwap
            sushiswapRouter: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
            sushiswapFactory: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
            
            // Aave V3
            aavePool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
            aavePoolDataProvider: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
            
            // Curve
            curveRegistry: '0x445FE580eF8d70FF569aB36e80c647af338db351',
            
            // Tokens
            tokens: {
                WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
                USDC: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
                USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
                DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
                WBTC: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
                ARB: '0x912CE59144191C1204E64559FE8253a0e49E6548'
            }
        });
    }

    /**
     * Get contract address for a specific protocol on a network
     */
    getContractAddress(networkName, contractName) {
        const networkContracts = this.contracts.get(networkName);
        if (!networkContracts) {
            throw new Error(`Network not supported: ${networkName}`);
        }

        const address = networkContracts[contractName];
        if (!address) {
            throw new Error(`Contract ${contractName} not found on ${networkName}`);
        }

        return address;
    }

    /**
     * Get token address
     */
    getTokenAddress(networkName, tokenSymbol) {
        const networkContracts = this.contracts.get(networkName);
        if (!networkContracts || !networkContracts.tokens) {
            throw new Error(`Network not supported: ${networkName}`);
        }

        const address = networkContracts.tokens[tokenSymbol];
        if (!address) {
            throw new Error(`Token ${tokenSymbol} not found on ${networkName}`);
        }

        return address;
    }

    /**
     * Get all contracts for a network
     */
    getNetworkContracts(networkName) {
        const contracts = this.contracts.get(networkName);
        if (!contracts) {
            throw new Error(`Network not supported: ${networkName}`);
        }
        return contracts;
    }

    /**
     * Get all available tokens for a network
     */
    getNetworkTokens(networkName) {
        const contracts = this.getNetworkContracts(networkName);
        return contracts.tokens || {};
    }

    /**
     * Check if contract exists on network
     */
    hasContract(networkName, contractName) {
        try {
            this.getContractAddress(networkName, contractName);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check if token exists on network
     */
    hasToken(networkName, tokenSymbol) {
        try {
            this.getTokenAddress(networkName, tokenSymbol);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get supported networks
     */
    getSupportedNetworks() {
        return Array.from(this.contracts.keys());
    }

    /**
     * Add or update contract address
     */
    setContractAddress(networkName, contractName, address) {
        if (!this.contracts.has(networkName)) {
            this.contracts.set(networkName, {});
        }
        
        const networkContracts = this.contracts.get(networkName);
        networkContracts[contractName] = address;
        
        console.log(`✅ Updated ${contractName} on ${networkName}: ${address}`);
    }

    /**
     * Add or update token address
     */
    setTokenAddress(networkName, tokenSymbol, address) {
        if (!this.contracts.has(networkName)) {
            this.contracts.set(networkName, { tokens: {} });
        }
        
        const networkContracts = this.contracts.get(networkName);
        if (!networkContracts.tokens) {
            networkContracts.tokens = {};
        }
        
        networkContracts.tokens[tokenSymbol] = address;
        
        console.log(`✅ Updated token ${tokenSymbol} on ${networkName}: ${address}`);
    }

    /**
     * Get contract registry summary
     */
    getSummary() {
        const summary = {};
        
        for (const [networkName, contracts] of this.contracts.entries()) {
            const contractCount = Object.keys(contracts).length - (contracts.tokens ? 1 : 0);
            const tokenCount = contracts.tokens ? Object.keys(contracts.tokens).length : 0;
            
            summary[networkName] = {
                contracts: contractCount,
                tokens: tokenCount,
                total: contractCount + tokenCount
            };
        }
        
        return summary;
    }

    /**
     * Validate contract addresses (basic format check)
     */
    validateAddresses() {
        const issues = [];
        
        for (const [networkName, contracts] of this.contracts.entries()) {
            for (const [contractName, address] of Object.entries(contracts)) {
                if (contractName === 'tokens') {
                    // Validate token addresses
                    for (const [tokenSymbol, tokenAddress] of Object.entries(address)) {
                        if (!this.isValidAddress(tokenAddress)) {
                            issues.push(`Invalid token address: ${networkName}.${tokenSymbol} = ${tokenAddress}`);
                        }
                    }
                } else {
                    // Validate contract addresses
                    if (!this.isValidAddress(address)) {
                        issues.push(`Invalid contract address: ${networkName}.${contractName} = ${address}`);
                    }
                }
            }
        }
        
        return issues;
    }

    /**
     * Basic address validation
     */
    isValidAddress(address) {
        return typeof address === 'string' && 
               address.startsWith('0x') && 
               address.length === 42 &&
               /^0x[a-fA-F0-9]{40}$/.test(address);
    }
}

// Create singleton instance
const contractRegistry = new ContractRegistry();

export default contractRegistry;