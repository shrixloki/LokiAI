/**
 * MongoDB Service - Database layer for persistent storage of agent data
 * Handles agent configurations, trading history, analytics, and user data
 */

export interface DatabaseConfig {
  connectionString: string
  databaseName: string
  collections: {
    agents: string
    trades: string
    marketData: string
    users: string
    analytics: string
    logs: string
  }
}

export interface AgentDocument {
  _id?: string
  agentId: string
  userId: string
  type: 'yield' | 'arbitrage' | 'portfolio' | 'risk'
  name: string
  description: string
  enabled: boolean
  chainId: number
  parameters: any
  performance: any
  createdAt: Date
  updatedAt: Date
}

export interface TradeDocument {
  _id?: string
  agentId: string
  userId: string
  type: string
  symbol: string
  amount: number
  price: number
  side: 'buy' | 'sell'
  status: 'pending' | 'completed' | 'failed'
  transactionHash?: string
  gasUsed?: number
  profit?: number
  timestamp: Date
  marketConditions?: any
}

export interface MarketDataDocument {
  _id?: string
  symbol: string
  price: number
  volume: number
  change24h: number
  source: string
  timestamp: Date
  ohlcv?: {
    open: number
    high: number
    low: number
    close: number
    volume: number
  }
}

export interface UserDocument {
  _id?: string
  userId: string
  walletAddress: string
  email?: string
  preferences: {
    riskTolerance: number
    autoExecute: boolean
    notifications: boolean
  }
  subscription: {
    plan: 'free' | 'pro' | 'enterprise'
    expiresAt?: Date
  }
  createdAt: Date
  lastLoginAt: Date
}

export interface AnalyticsDocument {
  _id?: string
  userId?: string
  agentId?: string
  metric: string
  value: number
  metadata?: any
  timestamp: Date
}

/**
 * MongoDB Database Service
 */
export class MongoDBService {
  private client: any = null
  private db: any = null
  private isConnected = false

  private readonly config: DatabaseConfig = {
    connectionString: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    databaseName: 'loki_ai_agents',
    collections: {
      agents: 'agents',
      trades: 'trades',
      marketData: 'market_data',
      users: 'users',
      analytics: 'analytics',
      logs: 'logs'
    }
  }

  constructor() {
    this.setupIndexes()
  }

  /**
   * Connect to MongoDB
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('MongoDB already connected')
      return
    }

    try {
      // In a real implementation, you would use the MongoDB driver
      // For demo purposes, we'll simulate the connection
      console.log('🔌 Connecting to MongoDB...')
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock MongoDB client and database
      this.client = {
        close: () => Promise.resolve(),
        db: (name: string) => ({
          collection: (collectionName: string) => new MockCollection(collectionName)
        })
      }
      
      this.db = this.client.db(this.config.databaseName)
      this.isConnected = true

      console.log('✅ Connected to MongoDB successfully')
      
      // Create indexes
      await this.createIndexes()
      
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error)
      throw error
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return
    }

    try {
      await this.client?.close()
      this.isConnected = false
      console.log('✅ Disconnected from MongoDB')
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error)
    }
  }

  /**
   * Agent CRUD operations
   */
  async createAgent(agent: Omit<AgentDocument, '_id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const collection = this.db.collection(this.config.collections.agents)
    
    const document: AgentDocument = {
      ...agent,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await collection.insertOne(document)
    console.log(`📝 Created agent: ${agent.agentId}`)
    
    return result.insertedId
  }

  async getAgent(agentId: string): Promise<AgentDocument | null> {
    const collection = this.db.collection(this.config.collections.agents)
    return await collection.findOne({ agentId })
  }

  async getUserAgents(userId: string): Promise<AgentDocument[]> {
    const collection = this.db.collection(this.config.collections.agents)
    return await collection.find({ userId }).toArray()
  }

  async updateAgent(agentId: string, updates: Partial<AgentDocument>): Promise<boolean> {
    const collection = this.db.collection(this.config.collections.agents)
    
    const result = await collection.updateOne(
      { agentId },
      { 
        $set: { 
          ...updates, 
          updatedAt: new Date() 
        } 
      }
    )

    return result.modifiedCount > 0
  }

  async deleteAgent(agentId: string): Promise<boolean> {
    const collection = this.db.collection(this.config.collections.agents)
    const result = await collection.deleteOne({ agentId })
    
    if (result.deletedCount > 0) {
      console.log(`🗑️ Deleted agent: ${agentId}`)
    }
    
    return result.deletedCount > 0
  }

  /**
   * Trade operations
   */
  async recordTrade(trade: Omit<TradeDocument, '_id' | 'timestamp'>): Promise<string> {
    const collection = this.db.collection(this.config.collections.trades)
    
    const document: TradeDocument = {
      ...trade,
      timestamp: new Date()
    }

    const result = await collection.insertOne(document)
    console.log(`💰 Recorded trade: ${trade.symbol} ${trade.side} ${trade.amount}`)
    
    return result.insertedId
  }

  async getAgentTrades(agentId: string, limit: number = 100): Promise<TradeDocument[]> {
    const collection = this.db.collection(this.config.collections.trades)
    
    return await collection
      .find({ agentId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()
  }

  async getUserTrades(userId: string, limit: number = 100): Promise<TradeDocument[]> {
    const collection = this.db.collection(this.config.collections.trades)
    
    return await collection
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()
  }

  async getTradesBySymbol(symbol: string, limit: number = 100): Promise<TradeDocument[]> {
    const collection = this.db.collection(this.config.collections.trades)
    
    return await collection
      .find({ symbol })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()
  }

  /**
   * Market data operations
   */
  async storeMarketData(data: Omit<MarketDataDocument, '_id' | 'timestamp'>): Promise<string> {
    const collection = this.db.collection(this.config.collections.marketData)
    
    const document: MarketDataDocument = {
      ...data,
      timestamp: new Date()
    }

    const result = await collection.insertOne(document)
    return result.insertedId
  }

  async getMarketData(symbol: string, limit: number = 1000): Promise<MarketDataDocument[]> {
    const collection = this.db.collection(this.config.collections.marketData)
    
    return await collection
      .find({ symbol })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()
  }

  async getLatestMarketData(symbol: string): Promise<MarketDataDocument | null> {
    const collection = this.db.collection(this.config.collections.marketData)
    
    return await collection
      .findOne({ symbol }, { sort: { timestamp: -1 } })
  }

  /**
   * User operations
   */
  async createUser(user: Omit<UserDocument, '_id' | 'createdAt' | 'lastLoginAt'>): Promise<string> {
    const collection = this.db.collection(this.config.collections.users)
    
    const document: UserDocument = {
      ...user,
      createdAt: new Date(),
      lastLoginAt: new Date()
    }

    const result = await collection.insertOne(document)
    console.log(`👤 Created user: ${user.userId}`)
    
    return result.insertedId
  }

  async getUser(userId: string): Promise<UserDocument | null> {
    const collection = this.db.collection(this.config.collections.users)
    return await collection.findOne({ userId })
  }

  async getUserByWallet(walletAddress: string): Promise<UserDocument | null> {
    const collection = this.db.collection(this.config.collections.users)
    return await collection.findOne({ walletAddress })
  }

  async updateUser(userId: string, updates: Partial<UserDocument>): Promise<boolean> {
    const collection = this.db.collection(this.config.collections.users)
    
    const result = await collection.updateOne(
      { userId },
      { $set: updates }
    )

    return result.modifiedCount > 0
  }

  async updateLastLogin(userId: string): Promise<void> {
    const collection = this.db.collection(this.config.collections.users)
    
    await collection.updateOne(
      { userId },
      { $set: { lastLoginAt: new Date() } }
    )
  }

  /**
   * Analytics operations
   */
  async recordAnalytics(analytics: Omit<AnalyticsDocument, '_id' | 'timestamp'>): Promise<string> {
    const collection = this.db.collection(this.config.collections.analytics)
    
    const document: AnalyticsDocument = {
      ...analytics,
      timestamp: new Date()
    }

    const result = await collection.insertOne(document)
    return result.insertedId
  }

  async getAnalytics(
    filters: {
      userId?: string
      agentId?: string
      metric?: string
      startDate?: Date
      endDate?: Date
    },
    limit: number = 1000
  ): Promise<AnalyticsDocument[]> {
    const collection = this.db.collection(this.config.collections.analytics)
    
    const query: any = {}
    
    if (filters.userId) query.userId = filters.userId
    if (filters.agentId) query.agentId = filters.agentId
    if (filters.metric) query.metric = filters.metric
    
    if (filters.startDate || filters.endDate) {
      query.timestamp = {}
      if (filters.startDate) query.timestamp.$gte = filters.startDate
      if (filters.endDate) query.timestamp.$lte = filters.endDate
    }

    return await collection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()
  }

  /**
   * Aggregation queries for analytics
   */
  async getAgentPerformanceStats(agentId: string): Promise<any> {
    const collection = this.db.collection(this.config.collections.trades)
    
    // Simulate aggregation pipeline
    const trades = await collection.find({ agentId }).toArray()
    
    const stats = {
      totalTrades: trades.length,
      successfulTrades: trades.filter((t: TradeDocument) => t.status === 'completed').length,
      totalProfit: trades.reduce((sum: number, t: TradeDocument) => sum + (t.profit || 0), 0),
      averageProfit: 0,
      winRate: 0
    }

    if (stats.totalTrades > 0) {
      stats.averageProfit = stats.totalProfit / stats.totalTrades
      stats.winRate = (stats.successfulTrades / stats.totalTrades) * 100
    }

    return stats
  }

  async getUserPortfolioValue(userId: string): Promise<number> {
    const collection = this.db.collection(this.config.collections.trades)
    
    const trades = await collection.find({ userId, status: 'completed' }).toArray()
    
    // Calculate portfolio value based on completed trades
    let portfolioValue = 0
    const positions: { [symbol: string]: number } = {}

    for (const trade of trades) {
      const multiplier = trade.side === 'buy' ? 1 : -1
      positions[trade.symbol] = (positions[trade.symbol] || 0) + (trade.amount * multiplier)
    }

    // In a real implementation, you would multiply by current prices
    for (const [symbol, amount] of Object.entries(positions)) {
      portfolioValue += amount * 1000 // Mock price
    }

    return portfolioValue
  }

  async getMarketDataStats(symbol: string, days: number = 30): Promise<any> {
    const collection = this.db.collection(this.config.collections.marketData)
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const data = await collection
      .find({ 
        symbol, 
        timestamp: { $gte: startDate } 
      })
      .sort({ timestamp: 1 })
      .toArray()

    if (data.length === 0) {
      return null
    }

    const prices = data.map((d: MarketDataDocument) => d.price)
    const volumes = data.map((d: MarketDataDocument) => d.volume)

    return {
      symbol,
      period: days,
      dataPoints: data.length,
      priceStats: {
        min: Math.min(...prices),
        max: Math.max(...prices),
        average: prices.reduce((sum, p) => sum + p, 0) / prices.length,
        current: prices[prices.length - 1],
        change: ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100
      },
      volumeStats: {
        min: Math.min(...volumes),
        max: Math.max(...volumes),
        average: volumes.reduce((sum, v) => sum + v, 0) / volumes.length,
        total: volumes.reduce((sum, v) => sum + v, 0)
      }
    }
  }

  /**
   * Cleanup operations
   */
  async cleanupOldData(days: number = 90): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const collections = [
      this.config.collections.marketData,
      this.config.collections.analytics,
      this.config.collections.logs
    ]

    for (const collectionName of collections) {
      const collection = this.db.collection(collectionName)
      const result = await collection.deleteMany({
        timestamp: { $lt: cutoffDate }
      })
      
      console.log(`🧹 Cleaned up ${result.deletedCount} old records from ${collectionName}`)
    }
  }

  /**
   * Setup database indexes
   */
  private async setupIndexes(): Promise<void> {
    // This would be called during initialization
    console.log('📋 Setting up database indexes...')
  }

  /**
   * Create database indexes for performance
   */
  private async createIndexes(): Promise<void> {
    try {
      // Agents collection indexes
      const agentsCollection = this.db.collection(this.config.collections.agents)
      await agentsCollection.createIndex({ agentId: 1 }, { unique: true })
      await agentsCollection.createIndex({ userId: 1 })
      await agentsCollection.createIndex({ type: 1 })

      // Trades collection indexes
      const tradesCollection = this.db.collection(this.config.collections.trades)
      await tradesCollection.createIndex({ agentId: 1 })
      await tradesCollection.createIndex({ userId: 1 })
      await tradesCollection.createIndex({ symbol: 1 })
      await tradesCollection.createIndex({ timestamp: -1 })

      // Market data collection indexes
      const marketDataCollection = this.db.collection(this.config.collections.marketData)
      await marketDataCollection.createIndex({ symbol: 1, timestamp: -1 })
      await marketDataCollection.createIndex({ source: 1 })

      // Users collection indexes
      const usersCollection = this.db.collection(this.config.collections.users)
      await usersCollection.createIndex({ userId: 1 }, { unique: true })
      await usersCollection.createIndex({ walletAddress: 1 }, { unique: true })

      // Analytics collection indexes
      const analyticsCollection = this.db.collection(this.config.collections.analytics)
      await analyticsCollection.createIndex({ userId: 1, timestamp: -1 })
      await analyticsCollection.createIndex({ agentId: 1, timestamp: -1 })
      await analyticsCollection.createIndex({ metric: 1, timestamp: -1 })

      console.log('✅ Database indexes created successfully')
    } catch (error) {
      console.error('❌ Failed to create database indexes:', error)
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false
      }

      // Simple ping to verify connection
      await this.db.collection('health').findOne({})
      return true
    } catch (error) {
      console.error('Database health check failed:', error)
      return false
    }
  }
}

/**
 * Mock MongoDB Collection for demo purposes
 */
class MockCollection {
  private data: Map<string, any> = new Map()
  private counter = 0

  constructor(private name: string) {}

  async insertOne(document: any): Promise<{ insertedId: string }> {
    const id = `mock_${this.name}_${++this.counter}`
    this.data.set(id, { ...document, _id: id })
    return { insertedId: id }
  }

  async findOne(query: any, options?: any): Promise<any> {
    for (const [id, doc] of this.data.entries()) {
      if (this.matchesQuery(doc, query)) {
        return doc
      }
    }
    return null
  }

  async find(query: any): Promise<{ toArray: () => Promise<any[]>, sort: (s: any) => any, limit: (l: number) => any }> {
    const results = Array.from(this.data.values()).filter(doc => this.matchesQuery(doc, query))
    
    return {
      toArray: async () => results,
      sort: (sortSpec: any) => ({
        toArray: async () => results,
        limit: (limit: number) => ({
          toArray: async () => results.slice(0, limit)
        })
      }),
      limit: (limit: number) => ({
        toArray: async () => results.slice(0, limit)
      })
    }
  }

  async updateOne(query: any, update: any): Promise<{ modifiedCount: number }> {
    for (const [id, doc] of this.data.entries()) {
      if (this.matchesQuery(doc, query)) {
        Object.assign(doc, update.$set || update)
        return { modifiedCount: 1 }
      }
    }
    return { modifiedCount: 0 }
  }

  async deleteOne(query: any): Promise<{ deletedCount: number }> {
    for (const [id, doc] of this.data.entries()) {
      if (this.matchesQuery(doc, query)) {
        this.data.delete(id)
        return { deletedCount: 1 }
      }
    }
    return { deletedCount: 0 }
  }

  async deleteMany(query: any): Promise<{ deletedCount: number }> {
    let deletedCount = 0
    for (const [id, doc] of this.data.entries()) {
      if (this.matchesQuery(doc, query)) {
        this.data.delete(id)
        deletedCount++
      }
    }
    return { deletedCount }
  }

  async createIndex(spec: any, options?: any): Promise<void> {
    // Mock index creation
    console.log(`📋 Created index on ${this.name}:`, spec)
  }

  private matchesQuery(document: any, query: any): boolean {
    for (const [key, value] of Object.entries(query)) {
      if (document[key] !== value) {
        return false
      }
    }
    return true
  }
}

// Export singleton instance
export const mongoDBService = new MongoDBService()