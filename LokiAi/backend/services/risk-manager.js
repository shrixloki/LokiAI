/**
 * Risk Manager Service
 * 
 * Monitors portfolio risk and provides risk management recommendations
 */

import fetch from 'node-fetch';

// Risk management configuration
const RISK_CONFIG = {
    MAX_POSITION_SIZE: 0.25,        // 25% max single position
    MAX_PORTFOLIO_VOLATILITY: 0.30, // 30% max portfolio volatility
    MAX_CORRELATION: 0.70,          // 70% max correlation between assets
    STOP_LOSS_THRESHOLD: -0.15,     // 15% stop loss
    TAKE_PROFIT_THRESHOLD: 0.50,    // 50% take profit
    VaR_CONFIDENCE: 0.95            // 95% Value at Risk confidence
};

// Risk scoring weights
const RISK_WEIGHTS = {
    VOLATILITY: 0.30,
    CORRELATION: 0.25,
    CONCENTRATION: 0.25,
    LIQUIDITY: 0.20
};

/**
 * Calculate portfolio volatility
 */
function calculatePortfolioVolatility(positions) {
    // Simplified volatility calculation
    // In production, this would use historical price data
    
    let weightedVolatility = 0;
    let totalWeight = 0;
    
    positions.forEach(position => {
        const weight = position.allocation;
        const volatility = getAssetVolatility(position.symbol);
        
        weightedVolatility += weight * volatility;
        totalWeight += weight;
    });
    
    return totalWeight > 0 ? weightedVolatility / totalWeight : 0;
}

/**
 * Get asset volatility (mock data)
 */
function getAssetVolatility(symbol) {
    const volatilities = {
        'ETH': 0.65,
        'BTC': 0.55,
        'WBTC': 0.55,
        'USDC': 0.02,
        'USDT': 0.02,
        'DAI': 0.03,
        'UNI': 0.85,
        'AAVE': 0.90,
        'COMP': 0.95,
        'SUSHI': 1.10,
        'CRV': 1.05
    };
    
    return volatilities[symbol] || 0.80; // Default high volatility for unknown tokens
}

/**
 * Calculate position concentration risk
 */
function calculateConcentrationRisk(positions) {
    const concentrationRisks = [];
    
    positions.forEach(position => {
        const risk = {
            symbol: position.symbol,
            allocation: position.allocation,
            riskLevel: 'LOW',
            recommendation: null
        };
        
        if (position.allocation > RISK_CONFIG.MAX_POSITION_SIZE) {
            risk.riskLevel = 'HIGH';
            risk.recommendation = `Reduce ${position.symbol} position from ${(position.allocation * 100).toFixed(1)}% to max ${(RISK_CONFIG.MAX_POSITION_SIZE * 100).toFixed(1)}%`;
        } else if (position.allocation > RISK_CONFIG.MAX_POSITION_SIZE * 0.8) {
            risk.riskLevel = 'MEDIUM';
            risk.recommendation = `Monitor ${position.symbol} position size`;
        }
        
        concentrationRisks.push(risk);
    });
    
    return concentrationRisks;
}

/**
 * Calculate correlation risk
 */
function calculateCorrelationRisk(positions) {
    // Simplified correlation matrix
    const correlations = {
        'ETH-BTC': 0.65,
        'ETH-WBTC': 0.65,
        'BTC-WBTC': 0.95,
        'UNI-AAVE': 0.75,
        'AAVE-COMP': 0.80,
        'USDC-USDT': 0.95,
        'USDC-DAI': 0.85
    };
    
    const correlationRisks = [];
    
    for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
            const pair = `${positions[i].symbol}-${positions[j].symbol}`;
            const reversePair = `${positions[j].symbol}-${positions[i].symbol}`;
            
            const correlation = correlations[pair] || correlations[reversePair] || 0.30;
            
            if (correlation > RISK_CONFIG.MAX_CORRELATION) {
                correlationRisks.push({
                    pair: [positions[i].symbol, positions[j].symbol],
                    correlation: correlation,
                    riskLevel: 'HIGH',
                    recommendation: `High correlation (${(correlation * 100).toFixed(1)}%) between ${positions[i].symbol} and ${positions[j].symbol}. Consider diversification.`
                });
            }
        }
    }
    
    return correlationRisks;
}

/**
 * Calculate Value at Risk (VaR)
 */
function calculateVaR(positions, portfolioValue, confidence = RISK_CONFIG.VaR_CONFIDENCE) {
    const portfolioVolatility = calculatePortfolioVolatility(positions);
    
    // Z-score for 95% confidence level
    const zScore = confidence === 0.95 ? 1.645 : 2.326; // 95% or 99%
    
    // Daily VaR calculation
    const dailyVaR = portfolioValue * portfolioVolatility * zScore / Math.sqrt(252); // 252 trading days
    
    return {
        dailyVaR: dailyVaR,
        weeklyVaR: dailyVaR * Math.sqrt(7),
        monthlyVaR: dailyVaR * Math.sqrt(30),
        confidence: confidence * 100
    };
}

/**
 * Generate risk alerts
 */
function generateRiskAlerts(riskAnalysis) {
    const alerts = [];
    
    // Portfolio volatility alert
    if (riskAnalysis.portfolioVolatility > RISK_CONFIG.MAX_PORTFOLIO_VOLATILITY) {
        alerts.push({
            type: 'HIGH_VOLATILITY',
            severity: 'HIGH',
            message: `Portfolio volatility (${(riskAnalysis.portfolioVolatility * 100).toFixed(1)}%) exceeds maximum threshold (${(RISK_CONFIG.MAX_PORTFOLIO_VOLATILITY * 100).toFixed(1)}%)`,
            recommendation: 'Consider adding stable assets or reducing high-volatility positions'
        });
    }
    
    // Concentration risk alerts
    riskAnalysis.concentrationRisks.forEach(risk => {
        if (risk.riskLevel === 'HIGH') {
            alerts.push({
                type: 'CONCENTRATION_RISK',
                severity: 'HIGH',
                message: `Over-concentrated in ${risk.symbol} (${(risk.allocation * 100).toFixed(1)}%)`,
                recommendation: risk.recommendation
            });
        }
    });
    
    // Correlation risk alerts
    riskAnalysis.correlationRisks.forEach(risk => {
        if (risk.riskLevel === 'HIGH') {
            alerts.push({
                type: 'CORRELATION_RISK',
                severity: 'MEDIUM',
                message: risk.recommendation,
                recommendation: 'Diversify into uncorrelated assets'
            });
        }
    });
    
    // VaR alert
    if (riskAnalysis.var.dailyVaR > portfolioValue * 0.05) { // 5% daily VaR threshold
        alerts.push({
            type: 'HIGH_VAR',
            severity: 'MEDIUM',
            message: `High daily Value at Risk: $${riskAnalysis.var.dailyVaR.toFixed(0)}`,
            recommendation: 'Consider reducing portfolio risk through diversification'
        });
    }
    
    return alerts;
}

/**
 * Calculate overall risk score
 */
function calculateRiskScore(riskAnalysis) {
    let score = 0;
    
    // Volatility component (0-100)
    const volatilityScore = Math.min(100, (riskAnalysis.portfolioVolatility / RISK_CONFIG.MAX_PORTFOLIO_VOLATILITY) * 100);
    score += volatilityScore * RISK_WEIGHTS.VOLATILITY;
    
    // Concentration component (0-100)
    const maxConcentration = Math.max(...riskAnalysis.concentrationRisks.map(r => r.allocation));
    const concentrationScore = Math.min(100, (maxConcentration / RISK_CONFIG.MAX_POSITION_SIZE) * 100);
    score += concentrationScore * RISK_WEIGHTS.CONCENTRATION;
    
    // Correlation component (0-100)
    const maxCorrelation = riskAnalysis.correlationRisks.length > 0 ? 
        Math.max(...riskAnalysis.correlationRisks.map(r => r.correlation)) : 0.3;
    const correlationScore = Math.min(100, (maxCorrelation / RISK_CONFIG.MAX_CORRELATION) * 100);
    score += correlationScore * RISK_WEIGHTS.CORRELATION;
    
    // Liquidity component (simplified)
    const liquidityScore = 30; // Assume moderate liquidity
    score += liquidityScore * RISK_WEIGHTS.LIQUIDITY;
    
    return Math.min(100, Math.max(0, score));
}

/**
 * Execute risk manager for a wallet
 */
export async function runRiskManager(walletAddress, config = {}) {
    console.log(`🛡️ Running risk manager for wallet: ${walletAddress}`);
    
    const startTime = Date.now();
    const results = {
        success: true,
        agentType: 'risk-manager',
        walletAddress,
        riskScore: 0,
        riskLevel: 'LOW',
        alerts: 0,
        recommendations: 0,
        portfolioVolatility: 0,
        var: null,
        executionTime: 0,
        timestamp: new Date()
    };
    
    try {
        // Mock portfolio positions for analysis
        const positions = [
            { symbol: 'ETH', allocation: 0.45, value: 22500 },
            { symbol: 'WBTC', allocation: 0.30, value: 15000 },
            { symbol: 'USDC', allocation: 0.15, value: 7500 },
            { symbol: 'UNI', allocation: 0.10, value: 5000 }
        ];
        
        const portfolioValue = positions.reduce((sum, pos) => sum + pos.value, 0);
        
        // 1. Calculate portfolio volatility
        const portfolioVolatility = calculatePortfolioVolatility(positions);
        results.portfolioVolatility = portfolioVolatility;
        
        // 2. Analyze concentration risk
        const concentrationRisks = calculateConcentrationRisk(positions);
        
        // 3. Analyze correlation risk
        const correlationRisks = calculateCorrelationRisk(positions);
        
        // 4. Calculate Value at Risk
        const var_ = calculateVaR(positions, portfolioValue);
        results.var = var_;
        
        // 5. Compile risk analysis
        const riskAnalysis = {
            portfolioVolatility,
            concentrationRisks,
            correlationRisks,
            var: var_,
            portfolioValue
        };
        
        // 6. Generate risk alerts
        const alerts = generateRiskAlerts(riskAnalysis);
        results.alerts = alerts.length;
        results.recommendations = alerts.filter(a => a.recommendation).length;
        
        // 7. Calculate overall risk score
        const riskScore = calculateRiskScore(riskAnalysis);
        results.riskScore = riskScore;
        
        // 8. Determine risk level
        if (riskScore < 30) {
            results.riskLevel = 'LOW';
        } else if (riskScore < 70) {
            results.riskLevel = 'MEDIUM';
        } else {
            results.riskLevel = 'HIGH';
        }
        
        results.executionTime = Date.now() - startTime;
        
        console.log(`✅ Risk manager completed: ${results.riskLevel} risk (${results.riskScore.toFixed(1)}/100), ${results.alerts} alerts`);
        return results;
        
    } catch (error) {
        console.error('❌ Risk manager execution failed:', error);
        results.success = false;
        results.error = error.message;
        results.executionTime = Date.now() - startTime;
        return results;
    }
}

/**
 * Get risk manager performance metrics
 */
export async function getRiskManagerMetrics(walletAddress, timeframe = '30d') {
    // In production, fetch from database
    return {
        avgRiskScore: 45.2,
        riskReduction: 23.8,
        alertsGenerated: 15,
        recommendationsFollowed: 12,
        portfolioProtection: 8.4, // % losses prevented
        maxDrawdownPrevented: 12.7,
        timeframe
    };
}