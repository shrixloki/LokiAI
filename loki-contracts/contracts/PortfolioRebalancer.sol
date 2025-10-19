// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title PortfolioRebalancer
 * @dev Smart contract for LokiAI Portfolio Rebalancing Agent
 * Automatically rebalances portfolios to maintain target allocations
 */
contract PortfolioRebalancer is Ownable, ReentrancyGuard {
    
    // Events
    event PortfolioRebalanced(
        address indexed user,
        uint256 totalValue,
        uint256 rebalanceAmount,
        uint256 gasCost,
        uint256 timestamp
    );
    
    event AllocationUpdated(
        address indexed user,
        address indexed token,
        uint256 oldAllocation,
        uint256 newAllocation,
        uint256 timestamp
    );
    
    event RebalanceTriggered(
        address indexed user,
        string reason,
        uint256 deviation,
        uint256 threshold,
        uint256 timestamp
    );
    
    event StrategyCreated(
        address indexed user,
        string strategyName,
        uint256 strategyId,
        uint256 timestamp
    );
    
    // Structs
    struct Allocation {
        address token;
        uint256 targetPercentage; // in basis points (10000 = 100%)
        uint256 currentPercentage;
        uint256 currentValue;
        uint256 deviation;
    }
    
    struct RebalanceStrategy {
        string name;
        uint256 rebalanceThreshold; // in basis points
        uint256 minRebalanceAmount;
        bool autoRebalance;
        uint256 lastRebalance;
        bool active;
    }
    
    struct Portfolio {
        Allocation[] allocations;
        uint256 totalValue;
        uint256 strategyId;
        uint256 lastRebalance;
        uint256 rebalanceCount;
    }
    
    struct RebalanceAction {
        address tokenFrom;
        address tokenTo;
        uint256 amount;
        string action; // "BUY" or "SELL"
    }
    
    // State variables
    mapping(address => Portfolio) public userPortfolios;
    mapping(address => RebalanceStrategy) public userStrategies;
    mapping(uint256 => RebalanceStrategy) public strategies;
    mapping(address => RebalanceAction[]) public pendingRebalances;
    
    uint256 public nextStrategyId = 1;
    uint256 public totalRebalances;
    uint256 public totalValueRebalanced;
    uint256 public defaultRebalanceThreshold = 500; // 5%
    uint256 public minRebalanceAmount = 1e16; // 0.01 ETH
    uint256 public performanceFee = 75; // 0.75% in basis points
    
    address public feeRecipient;
    
    // Predefined strategies
    string[] public availableStrategies = [
        "Conservative",
        "Balanced",
        "Aggressive",
        "DeFi Focus",
        "Stablecoin Heavy"
    ];
    
    constructor(address _feeRecipient) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
        
        // Initialize default strategies
        _initializeDefaultStrategies();
    }
    
    /**
     * @dev Rebalance user's portfolio
     * @param user The user address to rebalance
     * @return rebalanced Whether rebalancing was performed
     * @return totalValue The total portfolio value
     */
    function rebalancePortfolio(address user) external nonReentrant returns (bool rebalanced, uint256 totalValue) {
        require(user != address(0), "Invalid user address");
        
        Portfolio storage portfolio = userPortfolios[user];
        require(portfolio.allocations.length > 0, "No portfolio found");
        
        // Calculate current allocations and deviations
        _updateCurrentAllocations(user);
        
        // Check if rebalancing is needed
        (bool needsRebalance, uint256 maxDeviation, string memory reason) = _checkRebalanceNeeded(user);
        
        if (!needsRebalance) {
            return (false, portfolio.totalValue);
        }
        
        // Execute rebalancing
        RebalanceAction[] memory actions = _calculateRebalanceActions(user);
        uint256 rebalanceAmount = _executeRebalanceActions(user, actions);
        
        // Update portfolio state
        portfolio.lastRebalance = block.timestamp;
        portfolio.rebalanceCount++;
        
        // Update global metrics
        totalRebalances++;
        totalValueRebalanced += rebalanceAmount;
        
        emit RebalanceTriggered(user, reason, maxDeviation, defaultRebalanceThreshold, block.timestamp);
        emit PortfolioRebalanced(user, portfolio.totalValue, rebalanceAmount, 0, block.timestamp);
        
        return (true, portfolio.totalValue);
    }
    
    /**
     * @dev Create a custom rebalancing strategy for user
     * @param user The user address
     * @param strategyName Name of the strategy
     * @param allocations Array of target allocations
     * @param rebalanceThreshold Threshold for triggering rebalance
     * @param autoRebalance Whether to auto-rebalance
     */
    function createStrategy(
        address user,
        string memory strategyName,
        Allocation[] memory allocations,
        uint256 rebalanceThreshold,
        bool autoRebalance
    ) external returns (uint256 strategyId) {
        require(user != address(0), "Invalid user address");
        require(allocations.length > 0, "No allocations provided");
        require(rebalanceThreshold <= 5000, "Threshold too high"); // Max 50%
        
        // Validate allocations sum to 100%
        uint256 totalAllocation = 0;
        for (uint i = 0; i < allocations.length; i++) {
            totalAllocation += allocations[i].targetPercentage;
        }
        require(totalAllocation == 10000, "Allocations must sum to 100%");
        
        strategyId = nextStrategyId++;
        
        // Create strategy
        strategies[strategyId] = RebalanceStrategy({
            name: strategyName,
            rebalanceThreshold: rebalanceThreshold,
            minRebalanceAmount: minRebalanceAmount,
            autoRebalance: autoRebalance,
            lastRebalance: 0,
            active: true
        });
        
        // Create portfolio
        Portfolio storage portfolio = userPortfolios[user];
        portfolio.strategyId = strategyId;
        portfolio.lastRebalance = block.timestamp;
        portfolio.rebalanceCount = 0;
        
        // Set allocations
        delete portfolio.allocations;
        for (uint i = 0; i < allocations.length; i++) {
            portfolio.allocations.push(allocations[i]);
        }
        
        emit StrategyCreated(user, strategyName, strategyId, block.timestamp);
        
        return strategyId;
    }
    
    /**
     * @dev Update current allocations and calculate deviations
     */
    function _updateCurrentAllocations(address user) internal {
        Portfolio storage portfolio = userPortfolios[user];
        uint256 totalValue = 0;
        
        // Calculate total portfolio value (mock implementation)
        for (uint i = 0; i < portfolio.allocations.length; i++) {
            // Mock current value calculation
            uint256 currentValue = _getMockTokenValue(portfolio.allocations[i].token);
            portfolio.allocations[i].currentValue = currentValue;
            totalValue += currentValue;
        }
        
        portfolio.totalValue = totalValue;
        
        // Calculate current percentages and deviations
        if (totalValue > 0) {
            for (uint i = 0; i < portfolio.allocations.length; i++) {
                uint256 currentPercentage = (portfolio.allocations[i].currentValue * 10000) / totalValue;
                portfolio.allocations[i].currentPercentage = currentPercentage;
                
                // Calculate deviation
                uint256 target = portfolio.allocations[i].targetPercentage;
                uint256 deviation = currentPercentage > target ? 
                    currentPercentage - target : 
                    target - currentPercentage;
                portfolio.allocations[i].deviation = deviation;
            }
        }
    }
    
    /**
     * @dev Check if rebalancing is needed
     */
    function _checkRebalanceNeeded(address user) internal view returns (bool needed, uint256 maxDeviation, string memory reason) {
        Portfolio storage portfolio = userPortfolios[user];
        RebalanceStrategy storage strategy = strategies[portfolio.strategyId];
        
        if (!strategy.active) {
            return (false, 0, "Strategy inactive");
        }
        
        // Check time-based rebalancing (monthly)
        if (block.timestamp - portfolio.lastRebalance > 30 days) {
            return (true, 0, "Monthly rebalance");
        }
        
        // Check deviation-based rebalancing
        maxDeviation = 0;
        for (uint i = 0; i < portfolio.allocations.length; i++) {
            if (portfolio.allocations[i].deviation > maxDeviation) {
                maxDeviation = portfolio.allocations[i].deviation;
            }
        }
        
        if (maxDeviation >= strategy.rebalanceThreshold) {
            return (true, maxDeviation, "Deviation threshold exceeded");
        }
        
        // Check minimum rebalance amount
        if (portfolio.totalValue < strategy.minRebalanceAmount) {
            return (false, maxDeviation, "Below minimum rebalance amount");
        }
        
        return (false, maxDeviation, "No rebalancing needed");
    }
    
    /**
     * @dev Calculate rebalance actions needed
     */
    function _calculateRebalanceActions(address user) internal view returns (RebalanceAction[] memory) {
        Portfolio storage portfolio = userPortfolios[user];
        RebalanceAction[] memory actions = new RebalanceAction[](portfolio.allocations.length * 2);
        uint256 actionCount = 0;
        
        for (uint i = 0; i < portfolio.allocations.length; i++) {
            Allocation storage allocation = portfolio.allocations[i];
            
            if (allocation.currentPercentage > allocation.targetPercentage) {
                // Need to sell some of this token
                uint256 excessValue = ((allocation.currentPercentage - allocation.targetPercentage) * portfolio.totalValue) / 10000;
                
                actions[actionCount] = RebalanceAction({
                    tokenFrom: allocation.token,
                    tokenTo: address(0), // Will be determined later
                    amount: excessValue,
                    action: "SELL"
                });
                actionCount++;
            } else if (allocation.currentPercentage < allocation.targetPercentage) {
                // Need to buy more of this token
                uint256 deficitValue = ((allocation.targetPercentage - allocation.currentPercentage) * portfolio.totalValue) / 10000;
                
                actions[actionCount] = RebalanceAction({
                    tokenFrom: address(0), // Will be determined later
                    tokenTo: allocation.token,
                    amount: deficitValue,
                    action: "BUY"
                });
                actionCount++;
            }
        }
        
        // Resize array to actual count
        RebalanceAction[] memory finalActions = new RebalanceAction[](actionCount);
        for (uint i = 0; i < actionCount; i++) {
            finalActions[i] = actions[i];
        }
        
        return finalActions;
    }
    
    /**
     * @dev Execute rebalance actions (mock implementation)
     */
    function _executeRebalanceActions(address user, RebalanceAction[] memory actions) internal returns (uint256 totalAmount) {
        totalAmount = 0;
        
        for (uint i = 0; i < actions.length; i++) {
            // Mock execution - in real implementation, would interact with DEXs
            totalAmount += actions[i].amount;
            
            // Store pending action for tracking
            pendingRebalances[user].push(actions[i]);
        }
        
        return totalAmount;
    }
    
    /**
     * @dev Get mock token value (for testing)
     */
    function _getMockTokenValue(address token) internal view returns (uint256) {
        // Mock value calculation with some variance
        uint256 baseValue = 1000e18; // 1000 tokens worth
        uint256 variance = uint256(keccak256(abi.encodePacked(token, block.timestamp))) % 200e18;
        return baseValue + variance;
    }
    
    /**
     * @dev Initialize default strategies
     */
    function _initializeDefaultStrategies() internal {
        // Conservative Strategy
        strategies[1] = RebalanceStrategy({
            name: "Conservative",
            rebalanceThreshold: 1000, // 10%
            minRebalanceAmount: 1e17, // 0.1 ETH
            autoRebalance: true,
            lastRebalance: 0,
            active: true
        });
        
        // Balanced Strategy
        strategies[2] = RebalanceStrategy({
            name: "Balanced",
            rebalanceThreshold: 500, // 5%
            minRebalanceAmount: 5e16, // 0.05 ETH
            autoRebalance: true,
            lastRebalance: 0,
            active: true
        });
        
        // Aggressive Strategy
        strategies[3] = RebalanceStrategy({
            name: "Aggressive",
            rebalanceThreshold: 250, // 2.5%
            minRebalanceAmount: 1e16, // 0.01 ETH
            autoRebalance: true,
            lastRebalance: 0,
            active: true
        });
        
        nextStrategyId = 4;
    }
    
    /**
     * @dev Update allocation for user
     */
    function updateAllocation(
        address user,
        address token,
        uint256 newTargetPercentage
    ) external {
        Portfolio storage portfolio = userPortfolios[user];
        
        for (uint i = 0; i < portfolio.allocations.length; i++) {
            if (portfolio.allocations[i].token == token) {
                uint256 oldAllocation = portfolio.allocations[i].targetPercentage;
                portfolio.allocations[i].targetPercentage = newTargetPercentage;
                
                emit AllocationUpdated(user, token, oldAllocation, newTargetPercentage, block.timestamp);
                break;
            }
        }
    }
    
    /**
     * @dev Get user portfolio
     */
    function getUserPortfolio(address user) external view returns (
        Allocation[] memory allocations,
        uint256 totalValue,
        uint256 strategyId,
        uint256 lastRebalance,
        uint256 rebalanceCount
    ) {
        Portfolio storage portfolio = userPortfolios[user];
        return (
            portfolio.allocations,
            portfolio.totalValue,
            portfolio.strategyId,
            portfolio.lastRebalance,
            portfolio.rebalanceCount
        );
    }
    
    /**
     * @dev Get strategy details
     */
    function getStrategy(uint256 strategyId) external view returns (RebalanceStrategy memory) {
        return strategies[strategyId];
    }
    
    /**
     * @dev Get available strategies
     */
    function getAvailableStrategies() external view returns (string[] memory) {
        return availableStrategies;
    }
    
    /**
     * @dev Update default rebalance threshold
     */
    function updateDefaultThreshold(uint256 _threshold) external onlyOwner {
        require(_threshold <= 5000, "Threshold too high");
        defaultRebalanceThreshold = _threshold;
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
        uint256 _totalRebalances,
        uint256 _totalValueRebalanced,
        uint256 _activeStrategies,
        uint256 _totalUsers
    ) {
        // Count active strategies (simplified)
        uint256 activeStrategies = 3; // Default strategies
        uint256 totalUsers = 0; // Would need proper counting
        
        return (totalRebalances, totalValueRebalanced, activeStrategies, totalUsers);
    }
}