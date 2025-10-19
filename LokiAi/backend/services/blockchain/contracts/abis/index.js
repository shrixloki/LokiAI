/**
 * ABI Index - Centralized export for all contract ABIs
 */

// Import all ABI modules
import { ERC20_ABI } from './erc20-abi.js';
import uniswapV2ABIs from './uniswap-v2-abi.js';
import uniswapV3ABIs from './uniswap-v3-abi.js';
import aaveABIs from './aave-abi.js';
import curveABIs from './curve-abi.js';

// LokiAI Smart Contract ABIs
import { YIELD_OPTIMIZER_ABI } from './yield-optimizer-abi.js';
import { ARBITRAGE_BOT_ABI } from './arbitrage-bot-abi.js';
import { RISK_MANAGER_ABI } from './risk-manager-abi.js';
import { PORTFOLIO_REBALANCER_ABI } from './portfolio-rebalancer-abi.js';

// Export individual ABIs
export { ERC20_ABI };

// LokiAI Smart Contract ABIs
export { YIELD_OPTIMIZER_ABI, ARBITRAGE_BOT_ABI, RISK_MANAGER_ABI, PORTFOLIO_REBALANCER_ABI };

// Uniswap V2
export const {
    UNISWAP_V2_ROUTER_ABI,
    UNISWAP_V2_FACTORY_ABI,
    UNISWAP_V2_PAIR_ABI
} = uniswapV2ABIs;

// Uniswap V3
export const {
    UNISWAP_V3_ROUTER_ABI,
    UNISWAP_V3_QUOTER_ABI,
    UNISWAP_V3_FACTORY_ABI,
    UNISWAP_V3_POOL_ABI
} = uniswapV3ABIs;

// Aave V3
export const {
    AAVE_V3_POOL_ABI,
    AAVE_V3_DATA_PROVIDER_ABI,
    AAVE_ATOKEN_ABI
} = aaveABIs;

// Curve
export const {
    CURVE_REGISTRY_ABI,
    CURVE_POOL_ABI,
    CURVE_GAUGE_ABI,
    CURVE_LP_TOKEN_ABI
} = curveABIs;

// Grouped exports for convenience
export const ABIS = {
    // Standard tokens
    ERC20: ERC20_ABI,
    
    // Uniswap V2
    UniswapV2Router: UNISWAP_V2_ROUTER_ABI,
    UniswapV2Factory: UNISWAP_V2_FACTORY_ABI,
    UniswapV2Pair: UNISWAP_V2_PAIR_ABI,
    
    // Uniswap V3
    UniswapV3Router: UNISWAP_V3_ROUTER_ABI,
    UniswapV3Quoter: UNISWAP_V3_QUOTER_ABI,
    UniswapV3Factory: UNISWAP_V3_FACTORY_ABI,
    UniswapV3Pool: UNISWAP_V3_POOL_ABI,
    
    // Aave V3
    AaveV3Pool: AAVE_V3_POOL_ABI,
    AaveV3DataProvider: AAVE_V3_DATA_PROVIDER_ABI,
    AaveAToken: AAVE_ATOKEN_ABI,
    
    // Curve
    CurveRegistry: CURVE_REGISTRY_ABI,
    CurvePool: CURVE_POOL_ABI,
    CurveGauge: CURVE_GAUGE_ABI,
    CurveLPToken: CURVE_LP_TOKEN_ABI,
    
    // LokiAI Smart Contracts
    YieldOptimizer: YIELD_OPTIMIZER_ABI,
    ArbitrageBot: ARBITRAGE_BOT_ABI,
    RiskManager: RISK_MANAGER_ABI,
    PortfolioRebalancer: PORTFOLIO_REBALANCER_ABI
};

// Protocol-specific exports
export const UNISWAP_ABIS = {
    V2: {
        Router: UNISWAP_V2_ROUTER_ABI,
        Factory: UNISWAP_V2_FACTORY_ABI,
        Pair: UNISWAP_V2_PAIR_ABI
    },
    V3: {
        Router: UNISWAP_V3_ROUTER_ABI,
        Quoter: UNISWAP_V3_QUOTER_ABI,
        Factory: UNISWAP_V3_FACTORY_ABI,
        Pool: UNISWAP_V3_POOL_ABI
    }
};

export const AAVE_ABIS = {
    Pool: AAVE_V3_POOL_ABI,
    DataProvider: AAVE_V3_DATA_PROVIDER_ABI,
    AToken: AAVE_ATOKEN_ABI
};

export const CURVE_ABIS = {
    Registry: CURVE_REGISTRY_ABI,
    Pool: CURVE_POOL_ABI,
    Gauge: CURVE_GAUGE_ABI,
    LPToken: CURVE_LP_TOKEN_ABI
};

// Helper function to get ABI by name
export function getABI(abiName) {
    const abi = ABIS[abiName];
    if (!abi) {
        throw new Error(`ABI not found: ${abiName}`);
    }
    return abi;
}

// Helper function to get all available ABI names
export function getAvailableABIs() {
    return Object.keys(ABIS);
}

// Default export
export default ABIS;