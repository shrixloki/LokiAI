import { ethers } from 'ethers';
import smartContractsService from '../blockchain/smart-contracts-service.js';
import blockchainService from '../blockchain/blockchain-service.js';

/**
 * Production Risk Manager Agent
 * Real blockchain risk assessment with deployed smart contracts
 */
class RiskManagerProduction {
    constructor() {
        this.agentId = 'risk-manager-production';
        this.name = 'Risk Manager (Production)';
        this.isActive = false;
        this.riskAssessments = new Map();
        this.alerts = new Map();
        this.executionInterval = null;
        
        // Production configuration
        this.config = {
            executionInterval: parseInt(process.env.RISK_MANAGER_INTERVAL) || 45000,
            maxRiskScore: 800, // 0-1000 scale
            warningThreshold: 700,
            liquidationThreshold: 900,
            autoAssess: true,
            alertCooldown: 300000 // 5 minutes between alerts
        };

        // Risk thresholds
        this.riskThresholds = {
            veryLow: 200,
            low: 400,
            medium: 600,
            high: 800,
            veryHigh: 1000
        };

        // Users to monitor
        this.monitoredUsers = new Set();
    }

    /**
     * Initialize production risk manager
     */
    async initialize() {
        console.log('🚀 Initializing Production Risk Manager...');
        
        try {
            await blockchainService.initialize();
            await smartContractsService.initialize();
            
            if (!smartContractsService.isReady()) {
                throw new Error('Smart contracts service not ready');
            }
            
            console.log('✅ Production Risk Manager initialized');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize Production Risk Manager:', error);
            return false;
        }
    }

    /**
     * Start production risk manager
     */
    async start() {
        if (this.isActive) {
            console.log('⚠️ Production Risk Manager already running');
            return;
        }

        console.log('🟢 Starting Production Risk Manager...');
        this.isActive = true;

        // Start execution loop
        this.executionInterval = setInterval(async () => {
            try {
                await this.executeRiskAssessmentCycle();
            } catch (error) {
                console.error('❌ Risk assessment cycle error:', error);
            }
        }, this.config.executionInterval);

        console.log(`✅ Production Risk Manager started (${this.config.executionInterval}ms interval)`);
    }

    /**
     * Execute risk assessment cycle
     */
    async executeRiskAssessmentCycle() {
        if (!this.isActive) return;

        try {
            console.log('🔍 Executing risk assessment cycle...');
            
            // Assess risk for all monitored users
            for (const userAddress of this.monitoredUsers) {
                try {
                    await this.assessUserRisk(userAddress);
                    await this.delay(1000); // Prevent rate limiting
                } catch (error) {
                    console.error(`❌ Risk assessment failed for ${userAddress}:`, error.message);
                }
            }
            
            // Check for risk alerts
            await this.checkRiskAlerts();
            
            this.lastExecution = Date.now();
            
        } catch (error) {
            console.error('❌ Risk assessment cycle failed:', error);
        }
    }

    /**
     * Assess risk for specific user
     */
    async assessUserRisk(userAddress) {
        try {
            console.log(`🔍 Assessing risk for: ${userAddress}`);
            
            const result = await smartContractsService.evaluateRisk(userAddress);
            
            if (result.success) {
                const assessment = {
                    userAddress,
                    riskScore: parseInt(result.riskScore),
                    riskLevel: result.riskLevel,
                    portfolioValue: result.portfolioValue,
                    timestamp: Date.now(),
                    txHash: result.txHash,
                    blockNumber: result.blockNumber,
                    explorerUrl: result.explorerUrl
                };
                
                // Store assessment
                this.riskAssessments.set(userAddress, assessment);
                
                console.log(`✅ Risk assessed: ${userAddress} - ${result.riskLevel} (${result.riskScore})`);
                
                // Check if alert is needed
                await this.checkUserRiskAlert(assessment);
                
                // Send notification for high risk
                if (assessment.riskScore >= this.config.warningThreshold) {
                    await this.sendNotification('warning', {
                        type: 'HIGH_RISK_DETECTED',
                        user: userAddress,
                        riskLevel: result.riskLevel,
                        riskScore: result.riskScore,
                        portfolioValue: result.portfolioValue,
                        txHash: result.txHash,
                        explorerUrl: result.explorerUrl
                    });
                }
                
                return assessment;
                
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error(`❌ Risk assessment failed for ${userAddress}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Add user to monitoring list
     */
    addUserToMonitoring(userAddress) {
        this.monitoredUsers.add(userAddress);
        console.log(`👤 Added user to risk monitoring: ${userAddress}`);
        
        // Perform immediate assessment
        if (this.isActive) {
            setTimeout(() => this.assessUserRisk(userAddress), 1000);
        }
    }

    /**
     * Remove user from monitoring list
     */
    removeUserFromMonitoring(userAddress) {
        this.monitoredUsers.delete(userAddress);
        this.riskAssessments.delete(userAddress);
        console.log(`👤 Removed user from risk monitoring: ${userAddress}`);
    }

    /**
     * Check user risk alert
     */
    async checkUserRiskAlert(assessment) {
        try {
            const { userAddress, riskScore, riskLevel } = assessment;
            const alertKey = `${userAddress}-${Date.now()}`;
            
            // Check for liquidation threshold
            if (riskScore >= this.config.liquidationThreshold) {
                const alert = {
                    id: alertKey,
                    type: 'LIQUIDATION_REQUIRED',
                    severity: 'critical',
                    userAddress,
                    riskScore,
                    riskLevel,
                    message: 'Immediate position reduction required',
                    timestamp: Date.now(),
                    resolved: false
                };
                
                this.alerts.set(alertKey, alert);
                
                await this.sendNotification('error', {
                    type: 'LIQUIDATION_ALERT',
                    user: userAddress,
                    riskLevel,
                    riskScore,
                    message: alert.message
                });
                
                console.log(`🚨 LIQUIDATION ALERT: ${userAddress} - Risk Score: ${riskScore}`);
                
            } else if (riskScore >= this.config.warningThreshold) {
                const alert = {
                    id: alertKey,
                    type: 'HIGH_RISK_WARNING',
                    severity: 'warning',
                    userAddress,
                    riskScore,
                    riskLevel,
                    message: 'Consider reducing position sizes',
                    timestamp: Date.now(),
                    resolved: false
                };
                
                this.alerts.set(alertKey, alert);
                
                console.log(`⚠️ HIGH RISK WARNING: ${userAddress} - Risk Score: ${riskScore}`);
            }
            
        } catch (error) {
            console.error('❌ Error checking user risk alert:', error);
        }
    }

    /**
     * Check for risk alerts across all users
     */
    async checkRiskAlerts() {
        try {
            const now = Date.now();
            let activeAlerts = 0;
            
            for (const [userAddress, assessment] of this.riskAssessments) {
                // Check if assessment is recent (within last 10 minutes)
                if (now - assessment.timestamp < 600000) {
                    if (assessment.riskScore >= this.config.warningThreshold) {
                        activeAlerts++;
                    }
                }
            }
            
            if (activeAlerts > 0) {
                console.log(`⚠️ Active risk alerts: ${activeAlerts}`);
            }
            
        } catch (error) {
            console.error('❌ Error checking risk alerts:', error);
        }
    }

    /**
     * Get user risk assessment
     */
    getUserRiskAssessment(userAddress) {
        return this.riskAssessments.get(userAddress) || null;
    }

    /**
     * Get all risk assessments
     */
    getAllRiskAssessments() {
        return Array.from(this.riskAssessments.values());
    }

    /**
     * Get active alerts
     */
    getActiveAlerts() {
        return Array.from(this.alerts.values())
            .filter(alert => !alert.resolved)
            .sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Resolve alert
     */
    resolveAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.resolved = true;
            alert.resolvedAt = Date.now();
            console.log(`✅ Alert resolved: ${alertId}`);
        }
    }

    /**
     * Get risk statistics
     */
    async getRiskStatistics() {
        try {
            const stats = await smartContractsService.getContractStats();
            const riskStats = stats.RiskManager;
            
            if (riskStats && riskStats.available) {
                return {
                    totalAssessments: riskStats.stats[0]?.toString() || '0',
                    totalAlerts: riskStats.stats[1]?.toString() || '0',
                    totalLiquidations: riskStats.stats[2]?.toString() || '0',
                    activeAlerts: riskStats.stats[3]?.toString() || '0',
                    localAssessments: this.riskAssessments.size,
                    localAlerts: this.alerts.size,
                    monitoredUsers: this.monitoredUsers.size
                };
            }
            
            return {
                totalAssessments: '0',
                totalAlerts: '0',
                totalLiquidations: '0',
                activeAlerts: '0',
                localAssessments: this.riskAssessments.size,
                localAlerts: this.alerts.size,
                monitoredUsers: this.monitoredUsers.size
            };
            
        } catch (error) {
            console.error('❌ Failed to get risk statistics:', error);
            return {
                error: error.message,
                localAssessments: this.riskAssessments.size,
                localAlerts: this.alerts.size,
                monitoredUsers: this.monitoredUsers.size
            };
        }
    }

    /**
     * Get portfolio risk breakdown
     */
    async getPortfolioRiskBreakdown(userAddress) {
        try {
            const userData = await smartContractsService.getUserData(userAddress);
            const assessment = this.riskAssessments.get(userAddress);
            
            if (!userData || !assessment) {
                return { error: 'No data available for user' };
            }
            
            return {
                userAddress,
                riskScore: assessment.riskScore,
                riskLevel: assessment.riskLevel,
                portfolioValue: assessment.portfolioValue,
                positions: userData.yieldPositions || [],
                riskAssessment: userData.riskAssessment || {},
                portfolio: userData.portfolio || {},
                lastAssessment: assessment.timestamp,
                recommendations: this.generateRiskRecommendations(assessment)
            };
            
        } catch (error) {
            console.error('❌ Failed to get portfolio risk breakdown:', error);
            return { error: error.message };
        }
    }

    /**
     * Generate risk recommendations
     */
    generateRiskRecommendations(assessment) {
        const recommendations = [];
        const { riskScore, riskLevel } = assessment;
        
        if (riskScore >= this.config.liquidationThreshold) {
            recommendations.push({
                priority: 'critical',
                action: 'Immediate liquidation required',
                reason: 'Risk score exceeds liquidation threshold',
                impact: 'Prevent further losses'
            });
        } else if (riskScore >= this.config.warningThreshold) {
            recommendations.push({
                priority: 'high',
                action: 'Reduce position sizes',
                reason: 'Risk score above warning threshold',
                impact: 'Lower portfolio risk'
            });
        }
        
        if (riskScore >= this.riskThresholds.medium) {
            recommendations.push({
                priority: 'medium',
                action: 'Diversify across protocols',
                reason: 'Concentration risk detected',
                impact: 'Improve risk distribution'
            });
        }
        
        if (riskLevel === 'High' || riskLevel === 'Very High') {
            recommendations.push({
                priority: 'medium',
                action: 'Consider stable yield strategies',
                reason: 'Current strategies too risky',
                impact: 'Reduce volatility exposure'
            });
        }
        
        return recommendations;
    }

    /**
     * Manual risk assessment
     */
    async performManualRiskAssessment(userAddress) {
        try {
            console.log(`🎯 Manual risk assessment for: ${userAddress}`);
            
            // Add to monitoring if not already there
            this.addUserToMonitoring(userAddress);
            
            // Perform assessment
            const result = await this.assessUserRisk(userAddress);
            
            if (result && !result.error) {
                await this.sendNotification('info', {
                    type: 'MANUAL_RISK_ASSESSMENT',
                    user: userAddress,
                    riskLevel: result.riskLevel,
                    riskScore: result.riskScore,
                    portfolioValue: result.portfolioValue
                });
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Manual risk assessment failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send notification
     */
    async sendNotification(type, data) {
        try {
            const message = this.formatNotificationMessage(type, data);
            
            console.log(`📡 ${type.toUpperCase()}: ${message}`);
            
            if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
                await this.sendTelegramNotification(message);
            }
            
            if (process.env.DISCORD_WEBHOOK_URL) {
                await this.sendDiscordNotification(message, type);
            }
            
        } catch (error) {
            console.error('❌ Failed to send notification:', error);
        }
    }

    /**
     * Format notification message
     */
    formatNotificationMessage(type, data) {
        switch (data.type) {
            case 'HIGH_RISK_DETECTED':
                return `⚠️ High Risk Detected: ${data.user} | Level: ${data.riskLevel} (${data.riskScore}) | Portfolio: ${data.portfolioValue} | TX: ${data.txHash}`;
            case 'LIQUIDATION_ALERT':
                return `🚨 LIQUIDATION ALERT: ${data.user} | Risk: ${data.riskLevel} (${data.riskScore}) | ${data.message}`;
            case 'MANUAL_RISK_ASSESSMENT':
                return `🎯 Manual Risk Assessment: ${data.user} | Level: ${data.riskLevel} (${data.riskScore}) | Portfolio: ${data.portfolioValue}`;
            default:
                return `📡 ${data.type}: ${JSON.stringify(data)}`;
        }
    }

    /**
     * Send Telegram notification
     */
    async sendTelegramNotification(message) {
        try {
            const fetch = (await import('node-fetch')).default;
            const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
            
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: process.env.TELEGRAM_CHAT_ID,
                    text: `🤖 LokiAI Risk Manager\n\n${message}`,
                    parse_mode: 'HTML'
                })
            });
            
        } catch (error) {
            console.error('❌ Telegram notification failed:', error);
        }
    }

    /**
     * Send Discord notification
     */
    async sendDiscordNotification(message, type) {
        try {
            const fetch = (await import('node-fetch')).default;
            const colors = {
                success: 0x00ff00,
                warning: 0xffaa00,
                error: 0xff0000,
                info: 0x0099ff
            };

            await fetch(process.env.DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    embeds: [{
                        title: '🤖 LokiAI Risk Manager',
                        description: message,
                        color: colors[type] || colors.info,
                        timestamp: new Date().toISOString(),
                        footer: { text: 'LokiAI Blockchain System' }
                    }]
                })
            });
            
        } catch (error) {
            console.error('❌ Discord notification failed:', error);
        }
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get agent status
     */
    getStatus() {
        return {
            agentId: this.agentId,
            name: this.name,
            isActive: this.isActive,
            executionInterval: this.config.executionInterval,
            contractsConnected: smartContractsService.isReady(),
            networkStatus: 'Connected to Sepolia Testnet',
            lastExecution: this.lastExecution || null,
            monitoredUsers: this.monitoredUsers.size,
            riskAssessments: this.riskAssessments.size,
            activeAlerts: this.getActiveAlerts().length,
            config: this.config
        };
    }

    /**
     * Stop agent
     */
    async stop() {
        console.log('🔴 Stopping Production Risk Manager...');
        
        this.isActive = false;
        
        if (this.executionInterval) {
            clearInterval(this.executionInterval);
            this.executionInterval = null;
        }
        
        console.log('✅ Production Risk Manager stopped');
    }
}

// Create singleton instance
const riskManagerProduction = new RiskManagerProduction();

export default riskManagerProduction;