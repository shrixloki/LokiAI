/**
 * Curve Registry ABI
 * Interface for Curve Registry contract
 */
export const CURVE_REGISTRY_ABI = [
    {
        "inputs": [{"internalType": "address", "name": "_pool", "type": "address"}],
        "name": "get_pool_info",
        "outputs": [
            {"internalType": "uint256[4]", "name": "balances", "type": "uint256[4]"},
            {"internalType": "uint256[4]", "name": "underlying_balances", "type": "uint256[4]"},
            {"internalType": "uint256[4]", "name": "decimals", "type": "uint256[4]"},
            {"internalType": "uint256[4]", "name": "underlying_decimals", "type": "uint256[4]"},
            {"internalType": "address", "name": "lp_token", "type": "address"},
            {"internalType": "uint256", "name": "A", "type": "uint256"},
            {"internalType": "uint256", "name": "fee", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "_pool", "type": "address"}],
        "name": "get_coins",
        "outputs": [{"internalType": "address[8]", "name": "", "type": "address[8]"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "_pool", "type": "address"}],
        "name": "get_underlying_coins",
        "outputs": [{"internalType": "address[8]", "name": "", "type": "address[8]"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "_from", "type": "address"},
            {"internalType": "address", "name": "_to", "type": "address"}
        ],
        "name": "find_pool_for_coins",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "pool_count",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "_index", "type": "uint256"}],
        "name": "pool_list",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    }
];

/**
 * Curve Pool ABI (StableSwap)
 */
export const CURVE_POOL_ABI = [
    {
        "inputs": [
            {"internalType": "int128", "name": "i", "type": "int128"},
            {"internalType": "int128", "name": "j", "type": "int128"},
            {"internalType": "uint256", "name": "_dx", "type": "uint256"}
        ],
        "name": "get_dy",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "int128", "name": "i", "type": "int128"},
            {"internalType": "int128", "name": "j", "type": "int128"},
            {"internalType": "uint256", "name": "_dx", "type": "uint256"},
            {"internalType": "uint256", "name": "_min_dy", "type": "uint256"}
        ],
        "name": "exchange",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "int128", "name": "i", "type": "int128"},
            {"internalType": "int128", "name": "j", "type": "int128"},
            {"internalType": "uint256", "name": "_dx", "type": "uint256"},
            {"internalType": "uint256", "name": "_min_dy", "type": "uint256"}
        ],
        "name": "exchange_underlying",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256[2]", "name": "_amounts", "type": "uint256[2]"},
            {"internalType": "uint256", "name": "_min_mint_amount", "type": "uint256"}
        ],
        "name": "add_liquidity",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "_burn_amount", "type": "uint256"},
            {"internalType": "uint256[2]", "name": "_min_amounts", "type": "uint256[2]"}
        ],
        "name": "remove_liquidity",
        "outputs": [{"internalType": "uint256[2]", "name": "", "type": "uint256[2]"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "_burn_amount", "type": "uint256"},
            {"internalType": "int128", "name": "i", "type": "int128"},
            {"internalType": "uint256", "name": "_min_received", "type": "uint256"}
        ],
        "name": "remove_liquidity_one_coin",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "i", "type": "uint256"}],
        "name": "balances",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "i", "type": "uint256"}],
        "name": "coins",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "A",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "fee",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "admin_fee",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
];

/**
 * Curve Gauge ABI (for staking LP tokens)
 */
export const CURVE_GAUGE_ABI = [
    {
        "inputs": [{"internalType": "uint256", "name": "_value", "type": "uint256"}],
        "name": "deposit",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "_value", "type": "uint256"},
            {"internalType": "address", "name": "_addr", "type": "address"}
        ],
        "name": "deposit",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "_value", "type": "uint256"}],
        "name": "withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "_addr", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "_addr", "type": "address"}],
        "name": "claimable_tokens",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "claim_rewards",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "_addr", "type": "address"}],
        "name": "claim_rewards",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

/**
 * Curve LP Token ABI
 */
export const CURVE_LP_TOKEN_ABI = [
    {
        "inputs": [{"internalType": "address", "name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "_spender", "type": "address"},
            {"internalType": "uint256", "name": "_value", "type": "uint256"}
        ],
        "name": "approve",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "_to", "type": "address"},
            {"internalType": "uint256", "name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

export default {
    CURVE_REGISTRY_ABI,
    CURVE_POOL_ABI,
    CURVE_GAUGE_ABI,
    CURVE_LP_TOKEN_ABI
};