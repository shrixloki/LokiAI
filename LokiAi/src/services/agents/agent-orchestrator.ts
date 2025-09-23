/**
 * AI Agent Orchestrator - Central coordination system for all AI trading agents
 * Manages agent lifecycle, decision making, and execution coordination
 */

import { EventEmitter } from 'events'
import { marketDataService, MarketData } from '../data-pipeline/market-data-service'
import { featureEngineeringService, MLFeatures } from '../data-pipeline/feature-engineering'
import { yieldOptimizerModel, YieldAction, YieldState } from '../ml-models/yield-optimizer-model'
import { arbitrageBotModel, ArbitrageAction, ArbitrageOpportunity } from '../ml-models/arbitrage-bot-model'
import { smartContractsService, TransactionResult } from '../blockchain/smart-contracts'

export interface AgentConfig {
  id: string
  type: 'yield' | 'arbitrage' | 'portfolio' | 'risk'
  name: string
  description: string
  enabled: boolean
  chainId: number
  parameters: {
    maxInvestment: number
    riskTolerance: number
    minProfitThreshold: number
    gasLimit: number
    autoExecute: boolean
  }
  performance: {
    totalTrades: number
    successfulTrades: number
    totalProfit: number
    totalLoss: number
    averageReturn: number
    sharpeRatio: number
    maxDrawdown: number
  }
}

export interface AgentDecision {
  agentId: string
  agentType: string
  decision: 'execute' | 'monitor' | 'skip' | 'emergency_stop'
  action: YieldAction | ArbitrageAction | any
  confidence: number
  reasoning: string
  timestamp: number
  marketConditions: MLFeatures
}

export interface AgentExecution {
  agentId: string
  decisionId: string
  transactionHash: string
  status: 'pending' | 'confirmed' | 'failed'
  result?: TransactionResult
  profit?: number
  gasUsed?: number
  timestamp: number
}

/**
 * Central AI Agent Orchestration System
 */
export class AgentOrchestrator extends EventEmitter {
  private agents: Map<string, AgentConfig> = new Map()
  private activeDecisions: Map<string, AgentDecision> = new Map()
  private executionHistory: AgentExecution[] = []
  private isRunning = false
  private orchestrationInterval: NodeJS.Timeout | null = null

  // Performance tracking
  private performanceMetrics = {
    totalAgents: 0,
    activeAgents: 0,
    totalDecisions: 0,
    executedActions: 0,
    totalProfit: 0,
    successRate: 0,
    averageLatency: 0
  }

  constructor() {
    super()
    this.setupEventHandlers()
  }

  /**
   * Start the agent orchestration system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Agent orchestrator is already running')
      return
    }

    console.log('🚀 Starting AI Agent Orchestrator...')
    this.isRunning = true

    try {
      // Start market data service
      await marketDataService.start()

      // Initialize smart contracts for all chains
      await this.initializeContracts()

      // Start orchestration loop
      this.startOrchestrationLoop()

      console.log('✅ AI Agent Orchestrator started successfully')
      this.emit('started')
    } catch (error) {
      console.error('❌ Failed to start Agent Orchestrator:', error)
      this.emit('error', error)
      throw error
    }
  }

  /**
   * Stop the orchestration system
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping AI Agent Orchestrator...')
    this.isRunning = false

    // Stop orchestration loop
    if (this.orchestrationInterval) {
      clearInterval(this.orchestrationInterval)
      this.orchestrationInterval = null
    }

    // Stop market data service
    await marketDataService.stop()

    console.log('✅ AI Agent Orchestrator stopped')
    this.emit('stopped')
  }

  /**
   * Register a new AI agent
   */
  registerAgent(config: Omit<AgentConfig, 'performance'>): string {
    const agentId = `agent_${config.type}_${Date.now()}`
    
    const fullConfig: AgentConfig = {
      ...config,
      id: agentId,
      performance: {
        totalTrades: 0,
        successfulTrades: 0,
        totalProfit: 0,
        totalLoss: 0,
        averageReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0
      }
    }

    this.agents.set(agentId, fullConfig)
    this.performanceMetrics.totalAgents++
    
    if (fullConfig.enabled) {
      this.performanceMetrics.activeAgents++
    }

    console.log(`🤖 Registered ${config.type} agent: ${agentId}`)
    this.emit('agentRegistered', fullConfig)

    return agentId
  }

  /**
   * Update agent configuration
   */
  updateAgent(agentId: string, updates: Partial<AgentConfig>): boolean {
    const agent = this.agents.get(agentId)
    if (!agent) {
      console.error(`Agent ${agentId} not found`)
      return false
    }

    const wasEnabled = agent.enabled
    Object.assign(agent, updates)

    // Update active agents count
    if (wasEnabled !== agent.enabled) {
      this.performanceMetrics.activeAgents += agent.enabled ? 1 : -1
    }

    console.log(`🔧 Updated agent ${agentId}`)
    this.emit('agentUpdated', agent)

    return true
  }

  /**
   * Remove an agent
   */
  removeAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId)
    if (!agent) {
      return false
    }

    this.agents.delete(agentId)
    this.performanceMetrics.totalAgents--
    
    if (agent.enabled) {
      this.performanceMetrics.activeAgents--
    }

    console.log(`🗑️ Removed agent ${agentId}`)
    this.emit('agentRemoved', agentId)

    return true
  }

  /**
   * Get all registered agents
   */
  getAgents(): AgentConfig[] {
    return Array.from(this.agents.values())
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): AgentConfig | undefined {
    return this.agents.get(agentId)
  }

  /**
   * Get recent decisions
   */
  getRecentDecisions(limit: number = 50): AgentDecision[] {
    return Array.from(this.activeDecisions.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit: number = 100): AgentExecution[] {
    return this.executionHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): typeof this.performanceMetrics {
    return { ...this.performanceMetrics }
  }

  /**
   * Force agent decision (manual override)
   */
  async forceAgentDecision(agentId: string, action: any): Promise<boolean> {
    const agent = this.agents.get(agentId)
    if (!agent) {
      console.error(`Agent ${agentId} not found`)
      return false
    }

    try {
      const marketData = await marketDataService.getMarketData('BTCUSDT')
      const ohlcvData = await marketDataService.getOHLCVData('BTCUSDT')
      const features = featureEngineeringService.generateFeatures(ohlcvData, marketData)

      const decision: AgentDecision = {
        agentId,
        agentType: agent.type,
        decision: 'execute',
        action,
        confidence: 1.0,
        reasoning: 'Manual override',
        timestamp: Date.now(),
        marketConditions: features
      }

      await this.executeDecision(decision)
      return true
    } catch (error) {
      console.error('Failed to force agent decision:', error)
      return false
    }
  }

  /**
   * Emergency stop all agents
   */
  async emergencyStopAll(): Promise<void> {
    console.log('🚨 EMERGENCY STOP - Halting all agents')
    
    for (const agent of this.agents.values()) {
      if (agent.enabled) {
        agent.enabled = false
        
        // Execute emergency exit if risk manager
        if (agent.type === 'risk') {
          try {
            await smartContractsService.executeRiskAction(
              agent.chainId,
              'emergencyExit',
              { tokens: [], gasLimit: 500000 }
            )
          } catch (error) {
            console.error(`Failed emergency exit for agent ${agent.id}:`, error)
          }
        }
      }
    }

    this.performanceMetrics.activeAgents = 0
    this.emit('emergencyStop')
  }

  /**
   * Main orchestration loop
   */
  private startOrchestrationLoop(): void {
    this.orchestrationInterval = setInterval(async () => {
      try {
        await this.orchestrationCycle()
      } catch (error) {
        console.error('Error in orchestration cycle:', error)
        this.emit('error', error)
      }
    }, 10000) // Run every 10 seconds
  }

  /**
   * Single orchestration cycle
   */
  private async orchestrationCycle(): Promise<void> {
    const startTime = Date.now()

    try {
      // Get current market data
      const marketData = await marketDataService.getMarketData('BTCUSDT')
      const ohlcvData = await marketDataService.getOHLCVData('BTCUSDT')
      
      if (ohlcvData.length === 0) {
        console.log('⏳ Waiting for market data...')
        return
      }

      // Generate ML features
      const features = featureEngineeringService.generateFeatures(ohlcvData, marketData)

      // Process each active agent
      const activeAgents = Array.from(this.agents.values()).filter(agent => agent.enabled)
      
      for (const agent of activeAgents) {
        await this.processAgent(agent, features)
      }

      // Update performance metrics
      const latency = Date.now() - startTime
      this.performanceMetrics.averageLatency = 
        (this.performanceMetrics.averageLatency * 0.9) + (latency * 0.1)

      // Emit orchestration cycle complete
      this.emit('cycleComplete', {
        duration: latency,
        agentsProcessed: activeAgents.length,
        decisions: this.activeDecisions.size
      })

    } catch (error) {
      console.error('Orchestration cycle error:', error)
    }
  }

  /**
   * Process individual agent
   */
  private async processAgent(agent: AgentConfig, features: MLFeatures): Promise<void> {
    try {
      let decision: AgentDecision | null = null

      switch (agent.type) {
        case 'yield':
          decision = await this.processYieldAgent(agent, features)
          break
        case 'arbitrage':
          decision = await this.processArbitrageAgent(agent, features)
          break
        case 'portfolio':
          decision = await this.processPortfolioAgent(agent, features)
          break
        case 'risk':
          decision = await this.processRiskAgent(agent, features)
          break
      }

      if (decision) {
        this.activeDecisions.set(decision.agentId, decision)
        this.performanceMetrics.totalDecisions++

        // Execute if auto-execute is enabled and confidence is high
        if (agent.parameters.autoExecute && decision.confidence > 0.7) {
          await this.executeDecision(decision)
        }

        this.emit('agentDecision', decision)
      }

    } catch (error) {
      console.error(`Error processing ${agent.type} agent ${agent.id}:`, error)
    }
  }

  /**
   * Process yield optimization agent
   */
  private async processYieldAgent(agent: AgentConfig, features: MLFeatures): Promise<AgentDecision | null> {
    const state: YieldState = {
      currentPositions: [],
      availableCapital: agent.parameters.maxInvestment,
      marketConditions: features,
      gasPrice: 20,
      timestamp: Date.now()
    }

    const action = await yieldOptimizerModel.predictOptimalAction(state)
    
    if (action.confidence < 0.5) {
      return null
    }

    return {
      agentId: agent.id,
      agentType: agent.type,
      decision: action.confidence > 0.7 ? 'execute' : 'monitor',
      action,
      confidence: action.confidence,
      reasoning: `Yield optimization: ${action.type} with ${(action.expectedReturn * 100).toFixed(2)}% expected return`,
      timestamp: Date.now(),
      marketConditions: features
    }
  }

  /**
   * Process arbitrage agent
   */
  private async processArbitrageAgent(agent: AgentConfig, features: MLFeatures): Promise<AgentDecision | null> {
    const opportunities = await arbitrageBotModel.detectArbitrageOpportunities(features)
    
    if (opportunities.length === 0) {
      return null
    }

    const bestOpportunity = opportunities[0]
    const action = await arbitrageBotModel.predictOptimalAction(bestOpportunity, features)

    if (action.confidence < 0.5) {
      return null
    }

    return {
      agentId: agent.id,
      agentType: agent.type,
      decision: action.type === 'execute' ? 'execute' : action.type === 'monitor' ? 'monitor' : 'skip',
      action,
      confidence: action.confidence,
      reasoning: `Arbitrage opportunity: ${bestOpportunity.profitPercentage.toFixed(2)}% profit on ${bestOpportunity.tokenPair}`,
      timestamp: Date.now(),
      marketConditions: features
    }
  }

  /**
   * Process portfolio rebalancing agent
   */
  private async processPortfolioAgent(agent: AgentConfig, features: MLFeatures): Promise<AgentDecision | null> {
    // Simplified portfolio rebalancing logic
    const volatility = features.quantitative.volatility
    const trendStrength = features.quantitative.trendStrength

    // Rebalance if volatility is high or trend is strong
    if (volatility > 0.03 || Math.abs(trendStrength) > 0.7) {
      const action = {
        type: 'rebalance',
        tokens: ['ETH', 'BTC', 'USDC'],
        allocations: volatility > 0.05 ? [30, 30, 40] : [40, 40, 20], // More conservative in high volatility
        confidence: Math.min(0.9, 0.5 + volatility * 10)
      }

      return {
        agentId: agent.id,
        agentType: agent.type,
        decision: action.confidence > 0.7 ? 'execute' : 'monitor',
        action,
        confidence: action.confidence,
        reasoning: `Portfolio rebalancing due to ${volatility > 0.03 ? 'high volatility' : 'strong trend'}`,
        timestamp: Date.now(),
        marketConditions: features
      }
    }

    return null
  }

  /**
   * Process risk management agent
   */
  private async processRiskAgent(agent: AgentConfig, features: MLFeatures): Promise<AgentDecision | null> {
    const rsi = features.technical.rsi
    const volatility = features.quantitative.volatility
    const fearGreed = features.sentiment.fearGreedIndex

    // Risk assessment
    let riskLevel = 0
    if (rsi > 80 || rsi < 20) riskLevel += 0.3 // Overbought/oversold
    if (volatility > 0.05) riskLevel += 0.4 // High volatility
    if (fearGreed < 20 || fearGreed > 80) riskLevel += 0.3 // Extreme sentiment

    if (riskLevel > 0.7) {
      const action = {
        type: riskLevel > 0.9 ? 'emergencyExit' : 'setStopLoss',
        tokens: ['ETH', 'BTC'],
        percentage: Math.min(20, riskLevel * 30),
        confidence: Math.min(0.95, riskLevel)
      }

      return {
        agentId: agent.id,
        agentType: agent.type,
        decision: 'execute',
        action,
        confidence: action.confidence,
        reasoning: `High risk detected: RSI=${rsi.toFixed(1)}, Vol=${(volatility*100).toFixed(1)}%, F&G=${fearGreed.toFixed(0)}`,
        timestamp: Date.now(),
        marketConditions: features
      }
    }

    return null
  }

  /**
   * Execute agent decision
   */
  private async executeDecision(decision: AgentDecision): Promise<void> {
    const agent = this.agents.get(decision.agentId)
    if (!agent) {
      console.error(`Agent ${decision.agentId} not found for execution`)
      return
    }

    try {
      let result: TransactionResult

      switch (decision.agentType) {
        case 'yield':
          const yieldAction = decision.action as YieldAction
          result = await smartContractsService.executeYieldAction(
            agent.chainId,
            yieldAction.type,
            {
              protocol: yieldAction.protocol,
              amount: yieldAction.amount.toString(),
              gasLimit: agent.parameters.gasLimit
            }
          )
          break

        case 'arbitrage':
          const arbAction = decision.action as ArbitrageAction
          result = await smartContractsService.executeArbitrageAction(
            agent.chainId,
            'ETH', // Simplified
            'USDC',
            arbAction.amount.toString(),
            arbAction.route,
            agent.parameters.gasLimit
          )
          break

        case 'portfolio':
          result = await smartContractsService.executeRebalance(
            agent.chainId,
            decision.action.tokens,
            decision.action.allocations.map((a: number) => a.toString()),
            agent.parameters.gasLimit
          )
          break

        case 'risk':
          result = await smartContractsService.executeRiskAction(
            agent.chainId,
            decision.action.type,
            {
              tokens: decision.action.tokens,
              percentage: decision.action.percentage,
              gasLimit: agent.parameters.gasLimit
            }
          )
          break

        default:
          throw new Error(`Unknown agent type: ${decision.agentType}`)
      }

      // Record execution
      const execution: AgentExecution = {
        agentId: decision.agentId,
        decisionId: `${decision.agentId}_${decision.timestamp}`,
        transactionHash: result.hash,
        status: result.status,
        result,
        timestamp: Date.now()
      }

      this.executionHistory.push(execution)
      this.performanceMetrics.executedActions++

      // Update agent performance
      agent.performance.totalTrades++
      if (result.status === 'confirmed') {
        agent.performance.successfulTrades++
      }

      console.log(`⚡ Executed ${decision.agentType} action: ${result.hash}`)
      this.emit('actionExecuted', execution)

    } catch (error) {
      console.error(`Failed to execute decision for agent ${decision.agentId}:`, error)
    }
  }

  /**
   * Initialize smart contracts for all supported chains
   */
  private async initializeContracts(): Promise<void> {
    const supportedChains = smartContractsService.getSupportedChains()
    
    for (const chain of supportedChains) {
      try {
        await smartContractsService.initializeContracts(chain.chainId)
        console.log(`✅ Initialized contracts for ${chain.name}`)
      } catch (error) {
        console.error(`❌ Failed to initialize contracts for ${chain.name}:`, error)
      }
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Market data events
    marketDataService.on('marketData', (data: MarketData) => {
      this.emit('marketDataUpdate', data)
    })

    marketDataService.on('error', (error: Error) => {
      console.error('Market data service error:', error)
    })

    // Performance tracking
    this.on('actionExecuted', (execution: AgentExecution) => {
      if (execution.profit) {
        this.performanceMetrics.totalProfit += execution.profit
      }
      
      this.performanceMetrics.successRate = 
        this.performanceMetrics.executedActions > 0 
          ? (this.performanceMetrics.executedActions / this.performanceMetrics.totalDecisions) * 100
          : 0
    })
  }
}

// Export singleton instance
export const agentOrchestrator = new AgentOrchestrator()