// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RiskManager
 * @dev Smart contract for LokiAI Risk Management Agent
 * Monitors and manages portfolio risk across DeFi positions
 */
contract RiskManager is Ownable, ReentrancyGuard {
    
    // Events
    event RiskAssessed(
        address indexed user,
        uint256 riskScore,
        string riskLevel,
        uint256 portfolioValue,
        uint256 timestamp
    );
    
    event RiskAlert(
        address indexed user,
        string alertType,
        uint256 currentRisk,
        uint256 threshold,
        string recommendation,
        uint256 timestamp
    );
    
    event PositionLiquidated(
        address indexed user,
        address indexed token,
        uint256 amount,
        string reason,
        uint256 timestamp
    );
    
    event RiskParametersUpdated(
        uint256 maxRiskScore,
        uint256 liquidationThreshold,
        uint256 warningThreshold
    );
    
    // Structs
    struct RiskAssessment {
        uint256 riskScore;
        string riskLevel;
        uint256 portfolioValue;
        uint256 volatilityScore;
        uint256 concentrationRisk;
        uint256 liquidityRisk;
        uint256 timestamp;
    }
    
    struct Position {
        address token;
        uint256 amount;
        uint256 value;
        string protocol;
        uint256 entryTime;
        uint256 riskWeight;
    }
    
    struct RiskMetrics {
        uint256 totalValue;
        uint256 riskScore;
        uint256 diversificationScore;
        uint256 liquidityScore;
        uint256 volatilityScore;
        uint256 protocolRiskScore;
    }
    
    // State variables
    mapping(address => RiskAssessment) public userRiskAssessments;
    mapping(address => Position[]) public userPositions;
    mapping(address => RiskMetrics) public userRiskMetrics;
    mapping(address => bool) public riskAlerts;
    
    // Risk parameters
    uint256 public maxRiskScore = 800; // Max risk score (0-1000)
    uint256 public liquidationThreshold = 900; // Auto-liquidation threshold
    uint256 public warningThreshold = 700; // Warning threshold
    uint256 public maxConcentration = 300; // Max 30% in single asset
    uint256 public minLiquidity = 100; // Min liquidity score
    
    // Protocol risk weights (0-1000)
    mapping(string => uint256) public protocolRiskWeights;
    mapping(address => uint256) public tokenRiskWeights;
    
    uint256 public totalAssessments;
    uint256 public totalAlertsIssued;
    uint256 public totalLiquidations;
    
    address public emergencyManager;
    
    constructor(address _emergencyManager) Ownable(msg.sender) {
        emergencyManager = _emergencyManager;
        
        // Initialize protocol risk weights
        protocolRiskWeights["Aave"] = 200; // Low risk
        protocolRiskWeights["Compound"] = 250; // Low-medium risk
        protocolRiskWeights["Uniswap"] = 400; // Medium risk
        protocolRiskWeights["Curve"] = 300; // Medium-low risk
        protocolRiskWeights["Sushiswap"] = 450; // Medium-high risk
        protocolRiskWeights["Unknown"] = 800; // High risk
    }
    
    /**
     * @dev Evaluate risk for a user's portfolio
     * @param user The user address to assess
     * @return riskScore The calculated risk score (0-1000)
     * @return riskLevel The risk level string
     */
    function evaluateRisk(address user) external returns (uint256 riskScore, string memory riskLevel) {
        require(user != address(0), "Invalid user address");
        
        // Calculate comprehensive risk metrics
        RiskMetrics memory metrics = _calculateRiskMetrics(user);
        
        // Determine overall risk score
        riskScore = _calculateOverallRiskScore(metrics);
        riskLevel = _getRiskLevel(riskScore);
        
        // Store assessment
        userRiskAssessments[user] = RiskAssessment({
            riskScore: riskScore,
            riskLevel: riskLevel,
            portfolioValue: metrics.totalValue,
            volatilityScore: metrics.volatilityScore,
            concentrationRisk: _calculateConcentrationRisk(user),
            liquidityRisk: _calculateLiquidityRisk(user),
            timestamp: block.timestamp
        });
        
        userRiskMetrics[user] = metrics;
        totalAssessments++;
        
        // Check for risk alerts
        _checkRiskAlerts(user, riskScore);
        
        emit RiskAssessed(user, riskScore, riskLevel, metrics.totalValue, block.timestamp);
        
        return (riskScore, riskLevel);
    }
    
    /**
     * @dev Calculate comprehensive risk metrics
     */
    function _calculateRiskMetrics(address user) internal view returns (RiskMetrics memory) {
        Position[] memory positions = userPositions[user];
        
        if (positions.length == 0) {
            return RiskMetrics({
                totalValue: 0,
                riskScore: 0,
                diversificationScore: 1000,
                liquidityScore: 1000,
                volatilityScore: 0,
                protocolRiskScore: 0
            });
        }
        
        uint256 totalValue = 0;
        uint256 weightedRisk = 0;
        uint256 protocolRisk = 0;
        
        // Calculate position-weighted risks
        for (uint i = 0; i < positions.length; i++) {
            Position memory pos = positions[i];
            totalValue += pos.value;
            
            // Token risk
            uint256 tokenRisk = tokenRiskWeights[pos.token];
            if (tokenRisk == 0) tokenRisk = 500; // Default medium risk
            
            // Protocol risk
            uint256 protocolWeight = protocolRiskWeights[pos.protocol];
            if (protocolWeight == 0) protocolWeight = 800; // Default high risk
            
            weightedRisk += (pos.value * tokenRisk) / 1000;
            protocolRisk += (pos.value * protocolWeight) / 1000;
        }
        
        // Normalize by total value
        if (totalValue > 0) {
            weightedRisk = (weightedRisk * 1000) / totalValue;
            protocolRisk = (protocolRisk * 1000) / totalValue;
        }
        
        return RiskMetrics({
            totalValue: totalValue,
            riskScore: weightedRisk,
            diversificationScore: _calculateDiversificationScore(positions),
            liquidityScore: _calculateLiquidityScore(positions),
            volatilityScore: _calculateVolatilityScore(positions),
            protocolRiskScore: protocolRisk
        });
    }
    
    /**
     * @dev Calculate overall risk score from metrics
     */
    function _calculateOverallRiskScore(RiskMetrics memory metrics) internal pure returns (uint256) {
        // Weighted combination of risk factors
        uint256 riskScore = (
            metrics.riskScore * 30 +
            (1000 - metrics.diversificationScore) * 25 +
            (1000 - metrics.liquidityScore) * 20 +
            metrics.volatilityScore * 15 +
            metrics.protocolRiskScore * 10
        ) / 100;
        
        return riskScore > 1000 ? 1000 : riskScore;
    }
    
    /**
     * @dev Calculate diversification score
     */
    function _calculateDiversificationScore(Position[] memory positions) internal pure returns (uint256) {
        if (positions.length <= 1) return 0;
        
        // Simple diversification based on number of positions and concentration
        uint256 baseScore = positions.length * 100;
        if (baseScore > 800) baseScore = 800;
        
        // Bonus for having positions across different protocols
        uint256 protocolCount = 1; // Simplified - would need proper counting
        uint256 protocolBonus = protocolCount * 50;
        
        uint256 totalScore = baseScore + protocolBonus;
        return totalScore > 1000 ? 1000 : totalScore;
    }
    
    /**
     * @dev Calculate liquidity score
     */
    function _calculateLiquidityScore(Position[] memory positions) internal pure returns (uint256) {
        // Mock liquidity calculation
        // In real implementation, would check DEX liquidity, trading volumes, etc.
        uint256 totalLiquidity = 0;
        
        for (uint i = 0; i < positions.length; i++) {
            // Mock: larger positions assumed to have better liquidity
            uint256 positionLiquidity = positions[i].value > 1000e18 ? 800 : 600;
            totalLiquidity += positionLiquidity;
        }
        
        return positions.length > 0 ? totalLiquidity / positions.length : 1000;
    }
    
    /**
     * @dev Calculate volatility score
     */
    function _calculateVolatilityScore(Position[] memory positions) internal view returns (uint256) {
        // Mock volatility calculation based on token types and time
        uint256 totalVolatility = 0;
        
        for (uint i = 0; i < positions.length; i++) {
            // Mock: newer positions are more volatile
            uint256 timeScore = block.timestamp - positions[i].entryTime;
            uint256 volatility = timeScore < 86400 ? 600 : 300; // Higher if < 1 day
            totalVolatility += volatility;
        }
        
        return positions.length > 0 ? totalVolatility / positions.length : 0;
    }
    
    /**
     * @dev Calculate concentration risk
     */
    function _calculateConcentrationRisk(address user) internal view returns (uint256) {
        Position[] memory positions = userPositions[user];
        if (positions.length == 0) return 0;
        
        uint256 totalValue = 0;
        uint256 maxPositionValue = 0;
        
        for (uint i = 0; i < positions.length; i++) {
            totalValue += positions[i].value;
            if (positions[i].value > maxPositionValue) {
                maxPositionValue = positions[i].value;
            }
        }
        
        if (totalValue == 0) return 0;
        
        uint256 concentration = (maxPositionValue * 1000) / totalValue;
        return concentration > maxConcentration ? concentration - maxConcentration : 0;
    }
    
    /**
     * @dev Calculate liquidity risk
     */
    function _calculateLiquidityRisk(address user) internal view returns (uint256) {
        Position[] memory positions = userPositions[user];
        if (positions.length == 0) return 0;
        
        uint256 totalRisk = 0;
        
        for (uint i = 0; i < positions.length; i++) {
            // Mock liquidity risk calculation
            uint256 positionRisk = positions[i].value < 1000e18 ? 400 : 200;
            totalRisk += positionRisk;
        }
        
        return totalRisk / positions.length;
    }
    
    /**
     * @dev Get risk level string from score
     */
    function _getRiskLevel(uint256 riskScore) internal pure returns (string memory) {
        if (riskScore <= 200) return "Very Low";
        if (riskScore <= 400) return "Low";
        if (riskScore <= 600) return "Medium";
        if (riskScore <= 800) return "High";
        return "Very High";
    }
    
    /**
     * @dev Check and issue risk alerts
     */
    function _checkRiskAlerts(address user, uint256 riskScore) internal {
        if (riskScore >= liquidationThreshold) {
            _issueLiquidationAlert(user, riskScore);
        } else if (riskScore >= warningThreshold) {
            _issueWarningAlert(user, riskScore);
        }
    }
    
    /**
     * @dev Issue liquidation alert
     */
    function _issueLiquidationAlert(address user, uint256 riskScore) internal {
        riskAlerts[user] = true;
        totalAlertsIssued++;
        
        emit RiskAlert(
            user,
            "LIQUIDATION_REQUIRED",
            riskScore,
            liquidationThreshold,
            "Immediate position reduction required",
            block.timestamp
        );
    }
    
    /**
     * @dev Issue warning alert
     */
    function _issueWarningAlert(address user, uint256 riskScore) internal {
        totalAlertsIssued++;
        
        emit RiskAlert(
            user,
            "HIGH_RISK_WARNING",
            riskScore,
            warningThreshold,
            "Consider reducing position sizes",
            block.timestamp
        );
    }
    
    /**
     * @dev Add position for user (called by other contracts)
     */
    function addPosition(
        address user,
        address token,
        uint256 amount,
        uint256 value,
        string memory protocol
    ) external {
        userPositions[user].push(Position({
            token: token,
            amount: amount,
            value: value,
            protocol: protocol,
            entryTime: block.timestamp,
            riskWeight: tokenRiskWeights[token] > 0 ? tokenRiskWeights[token] : 500
        }));
    }
    
    /**
     * @dev Update risk parameters
     */
    function updateRiskParameters(
        uint256 _maxRiskScore,
        uint256 _liquidationThreshold,
        uint256 _warningThreshold
    ) external onlyOwner {
        require(_maxRiskScore <= 1000, "Invalid max risk score");
        require(_liquidationThreshold <= 1000, "Invalid liquidation threshold");
        require(_warningThreshold <= 1000, "Invalid warning threshold");
        require(_warningThreshold < _liquidationThreshold, "Warning must be less than liquidation");
        
        maxRiskScore = _maxRiskScore;
        liquidationThreshold = _liquidationThreshold;
        warningThreshold = _warningThreshold;
        
        emit RiskParametersUpdated(_maxRiskScore, _liquidationThreshold, _warningThreshold);
    }
    
    /**
     * @dev Update protocol risk weight
     */
    function updateProtocolRiskWeight(string memory protocol, uint256 weight) external onlyOwner {
        require(weight <= 1000, "Weight cannot exceed 1000");
        protocolRiskWeights[protocol] = weight;
    }
    
    /**
     * @dev Update token risk weight
     */
    function updateTokenRiskWeight(address token, uint256 weight) external onlyOwner {
        require(weight <= 1000, "Weight cannot exceed 1000");
        tokenRiskWeights[token] = weight;
    }
    
    /**
     * @dev Get user risk assessment
     */
    function getUserRiskAssessment(address user) external view returns (RiskAssessment memory) {
        return userRiskAssessments[user];
    }
    
    /**
     * @dev Get user positions
     */
    function getUserPositions(address user) external view returns (Position[] memory) {
        return userPositions[user];
    }
    
    /**
     * @dev Get contract statistics
     */
    function getStats() external view returns (
        uint256 _totalAssessments,
        uint256 _totalAlerts,
        uint256 _totalLiquidations,
        uint256 _activeAlerts
    ) {
        // Count active alerts (simplified)
        uint256 activeAlerts = 0; // Would need proper counting in real implementation
        
        return (totalAssessments, totalAlertsIssued, totalLiquidations, activeAlerts);
    }
}