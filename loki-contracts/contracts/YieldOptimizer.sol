// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title YieldOptimizer
 * @dev Smart contract for LokiAI Yield Optimization Agent
 * Finds and executes optimal yield farming strategies across DeFi protocols
 */
contract YieldOptimizer is Ownable, ReentrancyGuard {
    
    // Events
    event YieldOptimized(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 apy,
        string protocol,
        uint256 timestamp
    );
    
    event StrategyExecuted(
        address indexed user,
        string strategy,
        uint256 inputAmount,
        uint256 outputAmount,
        uint256 timestamp
    );
    
    event ProtocolAdded(string protocol, address protocolAddress, bool active);
    event ProtocolUpdated(string protocol, bool active);
    
    // Structs
    struct YieldStrategy {
        string name;
        address protocol;
        uint256 apy;
        uint256 tvl;
        uint256 riskScore;
        bool active;
    }
    
    struct UserPosition {
        address token;
        uint256 amount;
        string protocol;
        uint256 entryTime;
        uint256 expectedApy;
    }
    
    // State variables
    mapping(string => YieldStrategy) public strategies;
    mapping(address => UserPosition[]) public userPositions;
    mapping(string => address) public protocolAddresses;
    
    string[] public availableStrategies;
    uint256 public totalValueLocked;
    uint256 public totalUsersServed;
    uint256 public performanceFee = 100; // 1% in basis points
    
    address public feeRecipient;
    
    constructor(address _feeRecipient) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
        
        // Initialize with mock strategies
        _addStrategy("Aave USDC", address(0x1), 450, 1000000e6, 2, true); // 4.5% APY
        _addStrategy("Compound ETH", address(0x2), 380, 500000e18, 3, true); // 3.8% APY
        _addStrategy("Curve 3Pool", address(0x3), 520, 2000000e18, 1, true); // 5.2% APY
    }
    
    /**
     * @dev Execute yield optimization for a user
     * @param user The user address to optimize for
     * @param token The token to optimize
     * @param amount The amount to optimize
     * @return apy The achieved APY
     * @return protocol The selected protocol
     */
    function executeOptimization(
        address user,
        address token,
        uint256 amount
    ) external nonReentrant returns (uint256 apy, string memory protocol) {
        require(user != address(0), "Invalid user address");
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        
        // Find best strategy (mock implementation)
        (apy, protocol) = _findBestStrategy(token, amount);
        
        // Execute strategy (mock implementation)
        _executeStrategy(user, token, amount, protocol);
        
        // Update user position
        userPositions[user].push(UserPosition({
            token: token,
            amount: amount,
            protocol: protocol,
            entryTime: block.timestamp,
            expectedApy: apy
        }));
        
        // Update metrics
        totalValueLocked += amount;
        totalUsersServed++;
        
        emit YieldOptimized(user, token, amount, apy, protocol, block.timestamp);
        
        return (apy, protocol);
    }
    
    /**
     * @dev Find the best yield strategy for given parameters
     * @param token The token to find strategy for
     * @param amount The amount to invest
     * @return bestApy The best APY found
     * @return bestProtocol The protocol offering best APY
     */
    function _findBestStrategy(
        address token,
        uint256 amount
    ) internal view returns (uint256 bestApy, string memory bestProtocol) {
        bestApy = 0;
        bestProtocol = "";
        
        // Mock strategy selection logic
        for (uint i = 0; i < availableStrategies.length; i++) {
            string memory strategyName = availableStrategies[i];
            YieldStrategy memory strategy = strategies[strategyName];
            
            if (strategy.active && strategy.apy > bestApy) {
                // Add some randomness based on block data
                uint256 adjustedApy = strategy.apy + (block.timestamp % 100);
                if (adjustedApy > bestApy) {
                    bestApy = adjustedApy;
                    bestProtocol = strategyName;
                }
            }
        }
        
        // Ensure minimum APY
        if (bestApy == 0) {
            bestApy = 300 + (block.timestamp % 200); // 3-5% fallback
            bestProtocol = "Default Strategy";
        }
    }
    
    /**
     * @dev Execute the selected strategy (mock implementation)
     */
    function _executeStrategy(
        address user,
        address token,
        uint256 amount,
        string memory protocol
    ) internal {
        // Mock execution - in real implementation, this would interact with actual DeFi protocols
        
        emit StrategyExecuted(
            user,
            protocol,
            amount,
            amount, // Mock 1:1 for now
            block.timestamp
        );
    }
    
    /**
     * @dev Add a new yield strategy
     */
    function addStrategy(
        string memory name,
        address protocol,
        uint256 apy,
        uint256 tvl,
        uint256 riskScore
    ) external onlyOwner {
        _addStrategy(name, protocol, apy, tvl, riskScore, true);
    }
    
    function _addStrategy(
        string memory name,
        address protocol,
        uint256 apy,
        uint256 tvl,
        uint256 riskScore,
        bool active
    ) internal {
        strategies[name] = YieldStrategy({
            name: name,
            protocol: protocol,
            apy: apy,
            tvl: tvl,
            riskScore: riskScore,
            active: active
        });
        
        availableStrategies.push(name);
        protocolAddresses[name] = protocol;
        
        emit ProtocolAdded(name, protocol, active);
    }
    
    /**
     * @dev Update strategy status
     */
    function updateStrategy(string memory name, bool active) external onlyOwner {
        require(bytes(strategies[name].name).length > 0, "Strategy does not exist");
        strategies[name].active = active;
        
        emit ProtocolUpdated(name, active);
    }
    
    /**
     * @dev Get user positions
     */
    function getUserPositions(address user) external view returns (UserPosition[] memory) {
        return userPositions[user];
    }
    
    /**
     * @dev Get all available strategies
     */
    function getAvailableStrategies() external view returns (string[] memory) {
        return availableStrategies;
    }
    
    /**
     * @dev Get strategy details
     */
    function getStrategy(string memory name) external view returns (YieldStrategy memory) {
        return strategies[name];
    }
    
    /**
     * @dev Update performance fee
     */
    function updatePerformanceFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee cannot exceed 10%");
        performanceFee = _fee;
    }
    
    /**
     * @dev Update fee recipient
     */
    function updateFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @dev Get contract statistics
     */
    function getStats() external view returns (
        uint256 _totalValueLocked,
        uint256 _totalUsersServed,
        uint256 _activeStrategies
    ) {
        uint256 activeCount = 0;
        for (uint i = 0; i < availableStrategies.length; i++) {
            if (strategies[availableStrategies[i]].active) {
                activeCount++;
            }
        }
        
        return (totalValueLocked, totalUsersServed, activeCount);
    }
}