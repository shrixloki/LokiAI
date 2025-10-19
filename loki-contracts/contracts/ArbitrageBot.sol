// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ArbitrageBot
 * @dev Smart contract for LokiAI Arbitrage Trading Agent
 * Identifies and executes arbitrage opportunities across DEXs
 */
contract ArbitrageBot is Ownable, ReentrancyGuard {
    
    // Events
    event ArbitrageExecuted(
        address indexed executor,
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountIn,
        uint256 amountOut,
        uint256 profit,
        string dexA,
        string dexB,
        uint256 timestamp
    );
    
    event OpportunityDetected(
        address indexed tokenA,
        address indexed tokenB,
        uint256 priceA,
        uint256 priceB,
        uint256 profitPotential,
        string dexA,
        string dexB,
        uint256 timestamp
    );
    
    event DexAdded(string name, address router, bool active);
    event DexUpdated(string name, bool active);
    
    // Structs
    struct ArbitrageOpportunity {
        address tokenA;
        address tokenB;
        uint256 priceA;
        uint256 priceB;
        uint256 profitPotential;
        string dexA;
        string dexB;
        uint256 timestamp;
        bool executed;
    }
    
    struct DexInfo {
        string name;
        address router;
        uint256 fee; // in basis points
        bool active;
    }
    
    struct TradeResult {
        uint256 amountIn;
        uint256 amountOut;
        uint256 profit;
        uint256 gasUsed;
        bool success;
    }
    
    // State variables
    mapping(string => DexInfo) public dexes;
    mapping(bytes32 => ArbitrageOpportunity) public opportunities;
    mapping(address => uint256) public userProfits;
    
    string[] public availableDexes;
    bytes32[] public opportunityIds;
    
    uint256 public totalArbitrageVolume;
    uint256 public totalProfitGenerated;
    uint256 public totalTradesExecuted;
    uint256 public performanceFee = 50; // 0.5% in basis points
    uint256 public minProfitThreshold = 1e16; // 0.01 ETH minimum profit
    
    address public feeRecipient;
    
    constructor(address _feeRecipient) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
        
        // Initialize with mock DEXs
        _addDex("Uniswap V2", address(0x10), 30, true);
        _addDex("Sushiswap", address(0x20), 30, true);
        _addDex("PancakeSwap", address(0x30), 25, true);
        _addDex("Curve", address(0x40), 4, true);
    }
    
    /**
     * @dev Execute arbitrage between two DEXs
     * @param tokenA First token in the pair
     * @param tokenB Second token in the pair
     * @param amount Amount to arbitrage
     * @param dexA Source DEX
     * @param dexB Target DEX
     * @return profit The profit generated
     */
    function executeArbitrage(
        address tokenA,
        address tokenB,
        uint256 amount,
        string memory dexA,
        string memory dexB
    ) external nonReentrant returns (uint256 profit) {
        require(tokenA != address(0) && tokenB != address(0), "Invalid token addresses");
        require(amount > 0, "Amount must be greater than 0");
        require(dexes[dexA].active && dexes[dexB].active, "DEX not active");
        
        // Calculate potential profit (mock implementation)
        uint256 priceA = _getPrice(tokenA, tokenB, dexA);
        uint256 priceB = _getPrice(tokenA, tokenB, dexB);
        
        require(priceA != priceB, "No arbitrage opportunity");
        
        // Execute arbitrage (mock implementation)
        TradeResult memory result = _executeArbitrageTrade(tokenA, tokenB, amount, dexA, dexB);
        
        require(result.success, "Arbitrage execution failed");
        require(result.profit >= minProfitThreshold, "Profit below threshold");
        
        // Update metrics
        totalArbitrageVolume += amount;
        totalProfitGenerated += result.profit;
        totalTradesExecuted++;
        userProfits[msg.sender] += result.profit;
        
        emit ArbitrageExecuted(
            msg.sender,
            tokenA,
            tokenB,
            result.amountIn,
            result.amountOut,
            result.profit,
            dexA,
            dexB,
            block.timestamp
        );
        
        return result.profit;
    }
    
    /**
     * @dev Detect arbitrage opportunities (mock implementation)
     * @param tokenA First token
     * @param tokenB Second token
     * @return hasOpportunity Whether opportunity exists
     * @return profitPotential Potential profit amount
     */
    function detectOpportunity(
        address tokenA,
        address tokenB
    ) external returns (bool hasOpportunity, uint256 profitPotential) {
        require(tokenA != address(0) && tokenB != address(0), "Invalid token addresses");
        
        uint256 bestBuyPrice = type(uint256).max;
        uint256 bestSellPrice = 0;
        string memory buyDex = "";
        string memory sellDex = "";
        
        // Check prices across all active DEXs
        for (uint i = 0; i < availableDexes.length; i++) {
            string memory dexName = availableDexes[i];
            if (!dexes[dexName].active) continue;
            
            uint256 price = _getPrice(tokenA, tokenB, dexName);
            
            if (price < bestBuyPrice) {
                bestBuyPrice = price;
                buyDex = dexName;
            }
            
            if (price > bestSellPrice) {
                bestSellPrice = price;
                sellDex = dexName;
            }
        }
        
        // Calculate profit potential
        if (bestSellPrice > bestBuyPrice) {
            profitPotential = bestSellPrice - bestBuyPrice;
            hasOpportunity = profitPotential >= minProfitThreshold;
            
            if (hasOpportunity) {
                // Store opportunity
                bytes32 opportunityId = keccak256(abi.encodePacked(
                    tokenA, tokenB, block.timestamp, block.number
                ));
                
                opportunities[opportunityId] = ArbitrageOpportunity({
                    tokenA: tokenA,
                    tokenB: tokenB,
                    priceA: bestBuyPrice,
                    priceB: bestSellPrice,
                    profitPotential: profitPotential,
                    dexA: buyDex,
                    dexB: sellDex,
                    timestamp: block.timestamp,
                    executed: false
                });
                
                opportunityIds.push(opportunityId);
                
                emit OpportunityDetected(
                    tokenA,
                    tokenB,
                    bestBuyPrice,
                    bestSellPrice,
                    profitPotential,
                    buyDex,
                    sellDex,
                    block.timestamp
                );
            }
        }
        
        return (hasOpportunity, profitPotential);
    }
    
    /**
     * @dev Get mock price for token pair on specific DEX
     */
    function _getPrice(
        address tokenA,
        address tokenB,
        string memory dexName
    ) internal view returns (uint256) {
        // Mock price calculation with some variance
        uint256 basePrice = 1e18; // 1:1 base ratio
        
        // Add DEX-specific variance
        bytes32 dexHash = keccak256(abi.encodePacked(dexName));
        uint256 dexVariance = uint256(dexHash) % 1000; // 0-0.1% variance
        
        // Add token-specific variance
        bytes32 tokenHash = keccak256(abi.encodePacked(tokenA, tokenB));
        uint256 tokenVariance = uint256(tokenHash) % 2000; // 0-0.2% variance
        
        // Add time-based variance
        uint256 timeVariance = (block.timestamp % 500); // 0-0.05% variance
        
        return basePrice + dexVariance + tokenVariance + timeVariance;
    }
    
    /**
     * @dev Execute arbitrage trade (mock implementation)
     */
    function _executeArbitrageTrade(
        address tokenA,
        address tokenB,
        uint256 amount,
        string memory dexA,
        string memory dexB
    ) internal returns (TradeResult memory) {
        // Mock execution logic
        uint256 priceA = _getPrice(tokenA, tokenB, dexA);
        uint256 priceB = _getPrice(tokenA, tokenB, dexB);
        
        uint256 amountOut = (amount * priceB) / priceA;
        uint256 profit = amountOut > amount ? amountOut - amount : 0;
        
        // Deduct fees
        uint256 feeA = (amount * dexes[dexA].fee) / 10000;
        uint256 feeB = (amountOut * dexes[dexB].fee) / 10000;
        profit = profit > (feeA + feeB) ? profit - feeA - feeB : 0;
        
        return TradeResult({
            amountIn: amount,
            amountOut: amountOut,
            profit: profit,
            gasUsed: 150000, // Mock gas usage
            success: profit >= minProfitThreshold
        });
    }
    
    /**
     * @dev Add a new DEX
     */
    function addDex(
        string memory name,
        address router,
        uint256 fee
    ) external onlyOwner {
        _addDex(name, router, fee, true);
    }
    
    function _addDex(
        string memory name,
        address router,
        uint256 fee,
        bool active
    ) internal {
        require(router != address(0), "Invalid router address");
        require(fee <= 1000, "Fee too high"); // Max 10%
        
        dexes[name] = DexInfo({
            name: name,
            router: router,
            fee: fee,
            active: active
        });
        
        availableDexes.push(name);
        
        emit DexAdded(name, router, active);
    }
    
    /**
     * @dev Update DEX status
     */
    function updateDex(string memory name, bool active) external onlyOwner {
        require(bytes(dexes[name].name).length > 0, "DEX does not exist");
        dexes[name].active = active;
        
        emit DexUpdated(name, active);
    }
    
    /**
     * @dev Get available DEXs
     */
    function getAvailableDexes() external view returns (string[] memory) {
        return availableDexes;
    }
    
    /**
     * @dev Get DEX info
     */
    function getDexInfo(string memory name) external view returns (DexInfo memory) {
        return dexes[name];
    }
    
    /**
     * @dev Get recent opportunities
     */
    function getRecentOpportunities(uint256 count) external view returns (ArbitrageOpportunity[] memory) {
        uint256 length = opportunityIds.length;
        uint256 returnCount = count > length ? length : count;
        
        ArbitrageOpportunity[] memory recent = new ArbitrageOpportunity[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            bytes32 id = opportunityIds[length - 1 - i];
            recent[i] = opportunities[id];
        }
        
        return recent;
    }
    
    /**
     * @dev Update minimum profit threshold
     */
    function updateMinProfitThreshold(uint256 _threshold) external onlyOwner {
        minProfitThreshold = _threshold;
    }
    
    /**
     * @dev Update performance fee
     */
    function updatePerformanceFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee cannot exceed 10%");
        performanceFee = _fee;
    }
    
    /**
     * @dev Get contract statistics
     */
    function getStats() external view returns (
        uint256 _totalVolume,
        uint256 _totalProfit,
        uint256 _totalTrades,
        uint256 _activeDexes
    ) {
        uint256 activeCount = 0;
        for (uint i = 0; i < availableDexes.length; i++) {
            if (dexes[availableDexes[i]].active) {
                activeCount++;
            }
        }
        
        return (totalArbitrageVolume, totalProfitGenerated, totalTradesExecuted, activeCount);
    }
}