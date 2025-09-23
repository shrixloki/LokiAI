/**
 * Loki AI Service - Main integration service that orchestrates all AI agents and systems
 * Provides a unified interface for the complete AI trading platform
 */

import { EventEmitter } from 'events'
import { marketDataService } from './data-pipeline/market-data-service'
import { featureEngineeringService } from './data-pipeline/feature-engineering'
import { yieldOptimizerModel } from './ml-models/yield-optimizer-model'
import { arbitrageBotModel } from './ml-models/arbitrage-bot-model'
import { smartContractsService } from './blockchain/smart-contracts'
import { agentOrchestrator } from './agents/agent-orchestrator'
import { mongoDBService } from './database/mongodb-service'

export interface LokiAIConfig {
  enabledFeatures: {
    yieldOptimization: boolean
    arbitrageTrading: boolean
    portfolioRebalancing: boolean
    riskManagement: boolean
    realTimeMonitoring: boolean
    biometricSecurity: boolean
  }
  defaultChains: number[]
  maxConcurrentAgents: number
  autoStart: boolean
}

export interface SystemStatus {
  isRunning: boolean
  connectedChains: number[]
  activeAgents: number
  totalAgents: number
  dataStreamStatus: 'connected' | 'disconnected' | 'error'
  databaseStatus: 'connected' | 'disconnected' | 'error'
  lastUpdate: number
  performance: {
    totalProfit: number
    totalTrades: number
    successRate: number
    avgLatency: number
  }
}

export interface DeploymentResult {
  success: boolean
  agentId?: string
  transactionHash?: string
  error?: string
  estimatedCosts?: {
    deployment: number
    monthly: number
  }
}

/**
 * Main Loki AI Service - Orchestrates the entire AI trading platform
 */
export class LokiAIService extends EventEmitter {
  private config: LokiAIConfig
  private isInitialized = false
  private systemStatus: SystemStatus = {
    isRunning: false,
    connectedChains: [],
    activeAgents: 0,
    totalAgents: 0,
    dataStreamStatus: 'disconnected',
    databaseStatus: 'disconnected',
    lastUpdate: 0,
    performance: {
      totalProfit: 0,
      totalTrades: 0,
      successRate: 0,
      avgLatency: 0
    }
  }

  constructor(config: LokiAIConfig) {
    super()
    this.config = config
    this.setupEventHandlers()
  }

  /**
   * Initialize the complete Loki AI system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Loki AI system already initialized')
      return
    }

    console.log('🚀 Initializing Loki AI Trading Platform...')

    try {
      // Step 1: Initialize database
      console.log('📊 Connecting to database...')
      await mongoDBService.connect()
      this.systemStatus.databaseStatus = 'connected'

      // Step 2: Initialize market data streams
      console.log('📡 Starting market data streams...')
      await marketDataService.start()
      this.systemStatus.dataStreamStatus = 'connected'

      // Step 3: Initialize blockchain connections
      console.log('⛓️ Connecting to blockchains...')
      for (const chainId of this.config.defaultChains) {
        try {
          await smartContractsService.initializeContracts(chainId)
          this.systemStatus.connectedChains.push(chainId)
        } catch (error) {
          console.error(`Failed to connect to chain ${chainId}:`, error)
        }
      }

      // Step 4: Start agent orchestrator
      if (this.config.autoStart) {
        console.log('🤖 Starting AI agent orchestrator...')
        await agentOrchestrator.start()
      }

      this.isInitialized = true
      this.systemStatus.isRunning = true
      this.systemStatus.lastUpdate = Date.now()

      console.log('✅ Loki AI system initialized successfully!')
      this.emit('initialized', this.systemStatus)

      // Start monitoring loop
      this.startMonitoring()

    } catch (error) {
      console.error('❌ Failed to initialize Loki AI system:', error)
      this.emit('error', error)
      throw error
    }
  }

  /**
   * Deploy a new AI trading agent
   */
  async deployAgent(agentConfig: {
    type: 'yield' | 'arbitrage' | 'portfolio' | 'risk'
    name: string
    description: string
    chainId: number
    parameters: any
  }): Promise<DeploymentResult> {
    try {
      console.log(`🚀 Deploying ${agentConfig.type} agent: ${agentConfig.name}`)

      // Validate configuration
      if (!this.isInitialized) {
        throw new Error('Loki AI system not initialized')
      }

      if (!this.systemStatus.connectedChains.includes(agentConfig.chainId)) {
        throw new Error(`Chain ${agentConfig.chainId} not connected`)
      }

      // Register agent with orchestrator
      const agentId = agentOrchestrator.registerAgent({
        type: agentConfig.type,
        name: agentConfig.name,
        description: agentConfig.description,
        enabled: true,
        chainId: agentConfig.chainId,
        parameters: {
          maxInvestment: agentConfig.parameters.maxInvestment || 10000,
          riskTolerance: agentConfig.parameters.riskTolerance || 0.3,
          minProfitThreshold: agentConfig.parameters.minProfitThreshold || 0.005,
          gasLimit: agentConfig.parameters.gasLimit || 300000,
          autoExecute: agentConfig.parameters.autoExecute || false
        }
      })

      // Deploy smart contract (if needed)
      let transactionHash: string | undefined
      try {
        transactionHash = await smartContractsService.deployAgentContract(
          agentConfig.chainId,
          agentConfig.type,
          []
        )
      } catch (error) {
        console.warn('Smart contract deployment failed, using existing contracts:', error)
      }

      // Store in database
      await mongoDBService.createAgent({
        agentId,
        userId: 'current_user', // Would come from auth context
        type: agentConfig.type,
        name: agentConfig.name,
        description: agentConfig.description,
        enabled: true,
        chainId: agentConfig.chainId,
        parameters: agentConfig.parameters,
        performance: {
          totalTrades: 0,
          successfulTrades: 0,
          totalProfit: 0,
          totalLoss: 0,
          averageReturn: 0,
          sharpeRatio: 0,
          maxDrawdown: 0
        }
      })

      this.systemStatus.totalAgents++
      this.systemStatus.activeAgents++

      console.log(`✅ Agent deployed successfully: ${agentId}`)
      this.emit('agentDeployed', { agentId, agentConfig })

      return {
        success: true,
        agentId,
        transactionHash,
        estimatedCosts: {
          deployment: 25, // USD
          monthly: 50 // USD
        }
      }

    } catch (error) {
      console.error('Failed to deploy agent:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get real-time system status
   */
  getSystemStatus(): SystemStatus {
    return { ...this.systemStatus }
  }

  /**
   * Get all deployed agents
   */
  async getAgents(userId?: string): Promise<any[]> {
    try {
      if (userId) {
        return await mongoDBService.getUserAgents(userId)
      } else {
        return agentOrchestrator.getAgents()
      }
    } catch (error) {
      console.error('Failed to get agents:', error)
      return []
    }
  }

  /**
   * Get agent performance analytics
   */
  async getAgentAnalytics(agentId: string): Promise<any> {
    try {
      const [agent, trades, performance] = await Promise.all([
        mongoDBService.getAgent(agentId),
        mongoDBService.getAgentTrades(agentId, 100),
        mongoDBService.getAgentPerformanceStats(agentId)
      ])

      return {
        agent,
        trades,
        performance,
        analytics: {
          profitTrend: this.calculateProfitTrend(trades),
          riskMetrics: this.calculateRiskMetrics(trades),
          efficiency: this.calculateEfficiency(trades)
        }
      }
    } catch (error) {
      console.error('Failed to get agent analytics:', error)
      return null
    }
  }

  /**
   * Get market insights and opportunities
   */
  async getMarketInsights(): Promise<any> {
    try {
      const marketData = await marketDataService.getMarketData('BTCUSDT')
      const ohlcvData = await marketDataService.getOHLCVData('BTCUSDT')
      
      if (ohlcvData.length === 0) {
        return { error: 'No market data available' }
      }

      const features = featureEngineeringService.generateFeatures(ohlcvData, marketData)
      
      // Get opportunities from different agents
      const [yieldOpportunities, arbitrageOpportunities] = await Promise.all([
        yieldOptimizerModel.analyzeYieldOpportunities(features),
        arbitrageBotModel.detectArbitrageOpportunities(features)
      ])

      return {
        marketConditions: {
          sentiment: features.sentiment.fearGreedIndex,
          volatility: features.quantitative.volatility,
          trend: features.quantitative.trendStrength,
          rsi: features.technical.rsi
        },
        opportunities: {
          yield: yieldOpportunities.slice(0, 5),
          arbitrage: arbitrageOpportunities.slice(0, 5)
        },
        recommendations: this.generateRecommendations(features)
      }
    } catch (error) {
      console.error('Failed to get market insights:', error)
      return { error: 'Failed to analyze market conditions' }
    }
  }

  /**
   * Execute emergency stop for all agents
   */
  async emergencyStop(): Promise<void> {
    console.log('🚨 EMERGENCY STOP ACTIVATED')
    
    try {
      await agentOrchestrator.emergencyStopAll()
      this.systemStatus.activeAgents = 0
      
      console.log('✅ All agents stopped successfully')
      this.emit('emergencyStop')
    } catch (error) {
      console.error('Failed to execute emergency stop:', error)
      this.emit('error', error)
    }
  }

  /**
   * Shutdown the entire system
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Loki AI system...')

    try {
      // Stop agent orchestrator
      await agentOrchestrator.stop()

      // Stop market data streams
      await marketDataService.stop()

      // Disconnect from database
      await mongoDBService.disconnect()

      this.systemStatus.isRunning = false
      this.systemStatus.dataStreamStatus = 'disconnected'
      this.systemStatus.databaseStatus = 'disconnected'

      console.log('✅ Loki AI system shutdown complete')
      this.emit('shutdown')
    } catch (error) {
      console.error('Error during shutdown:', error)
      this.emit('error', error)
    }
  }

  /**
   * Get system health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    services: Record<string, boolean>
    uptime: number
  }> {
    const services = {
      database: await mongoDBService.healthCheck(),
      marketData: marketDataService.isRunning,
      orchestrator: agentOrchestrator.isRunning,
      blockchain: this.systemStatus.connectedChains.length > 0
    }

    const healthyServices = Object.values(services).filter(Boolean).length
    const totalServices = Object.keys(services).length

    let status: 'healthy' | 'degraded' | 'unhealthy'
    if (healthyServices === totalServices) {
      status = 'healthy'
    } else if (healthyServices >= totalServices * 0.5) {
      status = 'degraded'
    } else {
      status = 'unhealthy'
    }

    return {
      status,
      services,
      uptime: Date.now() - this.systemStatus.lastUpdate
    }
  }

  /**
   * Start system monitoring
   */
  private startMonitoring(): void {
    setInterval(async () => {
      try {
        // Update performance metrics
        const agents = agentOrchestrator.getAgents()
        const metrics = agentOrchestrator.getPerformanceMetrics()

        this.systemStatus.totalAgents = agents.length
        this.systemStatus.activeAgents = agents.filter(a => a.enabled).length
        this.systemStatus.performance = {
          totalProfit: agents.reduce((sum, a) => sum + a.performance.totalProfit, 0),
          totalTrades: agents.reduce((sum, a) => sum + a.performance.totalTrades, 0),
          successRate: metrics.successRate,
          avgLatency: metrics.averageLatency
        }
        this.systemStatus.lastUpdate = Date.now()

        this.emit('statusUpdate', this.systemStatus)
      } catch (error) {
        console.error('Monitoring error:', error)
      }
    }, 10000) // Update every 10 seconds
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Market data events
    marketDataService.on('error', (error) => {
      this.systemStatus.dataStreamStatus = 'error'
      this.emit('error', error)
    })

    // Agent orchestrator events
    agentOrchestrator.on('agentDecision', (decision) => {
      this.emit('agentDecision', decision)
    })

    agentOrchestrator.on('actionExecuted', (execution) => {
      this.emit('actionExecuted', execution)
    })

    agentOrchestrator.on('error', (error) => {
      this.emit('error', error)
    })
  }

  /**
   * Calculate profit trend from trades
   */
  private calculateProfitTrend(trades: any[]): number[] {
    const dailyProfits = new Map<string, number>()
    
    trades.forEach(trade => {
      const date = new Date(trade.timestamp).toDateString()
      dailyProfits.set(date, (dailyProfits.get(date) || 0) + (trade.profit || 0))
    })

    return Array.from(dailyProfits.values()).slice(-30) // Last 30 days
  }

  /**
   * Calculate risk metrics
   */
  private calculateRiskMetrics(trades: any[]): any {
    const profits = trades.map(t => t.profit || 0)
    const returns = profits.map((p, i) => i > 0 ? (p - profits[i-1]) / Math.abs(profits[i-1] || 1) : 0)
    
    const volatility = this.calculateVolatility(returns)
    const sharpeRatio = this.calculateSharpeRatio(returns)
    const maxDrawdown = this.calculateMaxDrawdown(profits)

    return { volatility, sharpeRatio, maxDrawdown }
  }

  /**
   * Calculate efficiency metrics
   */
  private calculateEfficiency(trades: any[]): any {
    const successfulTrades = trades.filter(t => t.status === 'completed' && (t.profit || 0) > 0)
    const avgProfit = trades.reduce((sum, t) => sum + (t.profit || 0), 0) / trades.length
    const avgGasUsed = trades.reduce((sum, t) => sum + (t.gasUsed || 0), 0) / trades.length

    return {
      winRate: (successfulTrades.length / trades.length) * 100,
      avgProfit,
      avgGasUsed,
      profitPerGas: avgGasUsed > 0 ? avgProfit / avgGasUsed : 0
    }
  }

  /**
   * Generate market recommendations
   */
  private generateRecommendations(features: any): string[] {
    const recommendations = []
    
    if (features.technical.rsi > 70) {
      recommendations.push('Market appears overbought - consider taking profits')
    } else if (features.technical.rsi < 30) {
      recommendations.push('Market appears oversold - potential buying opportunity')
    }

    if (features.quantitative.volatility > 0.05) {
      recommendations.push('High volatility detected - increase risk management')
    }

    if (features.sentiment.fearGreedIndex < 25) {
      recommendations.push('Extreme fear in market - contrarian opportunity')
    } else if (features.sentiment.fearGreedIndex > 75) {
      recommendations.push('Extreme greed in market - exercise caution')
    }

    return recommendations
  }

  /**
   * Utility functions for calculations
   */
  private calculateVolatility(returns: number[]): number {
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length
    return Math.sqrt(variance)
  }

  private calculateSharpeRatio(returns: number[], riskFreeRate = 0.02): number {
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const volatility = this.calculateVolatility(returns)
    return volatility > 0 ? (meanReturn - riskFreeRate) / volatility : 0
  }

  private calculateMaxDrawdown(profits: number[]): number {
    let maxDrawdown = 0
    let peak = profits[0] || 0

    for (const profit of profits) {
      if (profit > peak) {
        peak = profit
      }
      const drawdown = (peak - profit) / peak
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown
      }
    }

    return maxDrawdown * 100 // Return as percentage
  }
}

// Default configuration
const defaultConfig: LokiAIConfig = {
  enabledFeatures: {
    yieldOptimization: true,
    arbitrageTrading: true,
    portfolioRebalancing: true,
    riskManagement: true,
    realTimeMonitoring: true,
    biometricSecurity: true
  },
  defaultChains: [1, 137, 42161, 56], // Ethereum, Polygon, Arbitrum, BSC
  maxConcurrentAgents: 10,
  autoStart: true
}

// Export singleton instance
export const lokiAIService = new LokiAIService(defaultConfig)