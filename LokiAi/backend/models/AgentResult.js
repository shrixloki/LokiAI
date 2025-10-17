/**
 * Agent Result Model
 * 
 * Stores AI agent execution results and performance metrics
 */

import mongoose from 'mongoose';

const AgentResultSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  agentType: {
    type: String,
    required: true,
    enum: ['arbitrage', 'yield-optimizer', 'portfolio-rebalancer', 'risk-manager']
  },
  executionId: {
    type: String,
    required: true,
    unique: true
  },
  success: {
    type: Boolean,
    required: true,
    default: false
  },
  pnl: {
    type: Number,
    default: 0
  },
  apy: {
    type: Number,
    default: 0
  },
  transactions: {
    type: Number,
    default: 0
  },
  gasUsed: {
    type: Number,
    default: 0
  },
  opportunities: {
    type: Number,
    default: 0
  },
  executionTime: {
    type: Number, // milliseconds
    default: 0
  },
  bestOpportunity: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  trades: [{
    pair: String,
    profit: Number,
    gasCost: Number,
    timestamp: Date
  }],
  error: {
    type: String,
    default: null
  },
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metadata: {
    chain: String,
    dex: String,
    strategy: String,
    riskLevel: String
  }
}, {
  timestamps: true
});

// Indexes for performance
AgentResultSchema.index({ walletAddress: 1, agentType: 1 });
AgentResultSchema.index({ createdAt: -1 });
AgentResultSchema.index({ success: 1 });

// Virtual for profit calculation
AgentResultSchema.virtual('netProfit').get(function() {
  return this.pnl - (this.gasUsed * 0.000000001 * 2000); // Estimate gas cost in USD
});

// Static method to get agent performance summary
AgentResultSchema.statics.getPerformanceSummary = async function(walletAddress, agentType, timeframe = '24h') {
  const timeframeHours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720; // 30d
  const startDate = new Date(Date.now() - timeframeHours * 60 * 60 * 1000);
  
  const results = await this.aggregate([
    {
      $match: {
        walletAddress: walletAddress.toLowerCase(),
        agentType,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalTrades: { $sum: '$transactions' },
        totalPnl: { $sum: '$pnl' },
        avgPnl: { $avg: '$pnl' },
        successfulTrades: {
          $sum: { $cond: [{ $gt: ['$pnl', 0] }, 1, 0] }
        },
        totalExecutions: { $sum: 1 },
        totalOpportunities: { $sum: '$opportunities' },
        avgExecutionTime: { $avg: '$executionTime' },
        bestTrade: { $max: '$pnl' },
        worstTrade: { $min: '$pnl' }
      }
    }
  ]);
  
  if (results.length === 0) {
    return {
      totalTrades: 0,
      totalPnl: 0,
      avgPnl: 0,
      winRate: 0,
      totalExecutions: 0,
      totalOpportunities: 0,
      avgExecutionTime: 0,
      bestTrade: 0,
      worstTrade: 0
    };
  }
  
  const summary = results[0];
  summary.winRate = summary.totalExecutions > 0 
    ? (summary.successfulTrades / summary.totalExecutions) * 100 
    : 0;
  
  return summary;
};

// Static method to save agent execution result
AgentResultSchema.statics.saveExecution = async function(walletAddress, agentType, result) {
  const executionId = `${walletAddress}-${agentType}-${Date.now()}`;
  
  const agentResult = new this({
    walletAddress: walletAddress.toLowerCase(),
    agentType,
    executionId,
    success: result.success,
    pnl: result.pnl || 0,
    apy: result.apy || result.bestAPY || 0,
    transactions: result.transactions || result.executedTrades || 0,
    gasUsed: result.gasUsed || 0,
    opportunities: result.opportunities || 0,
    executionTime: result.executionTime || 0,
    bestOpportunity: result.bestOpportunity || null,
    trades: result.trades || [],
    error: result.error || null,
    config: result.config || {},
    metadata: {
      chain: result.chain || 'ethereum',
      dex: result.dex || 'multiple',
      strategy: result.strategy || agentType,
      riskLevel: result.riskLevel || 'medium'
    }
  });
  
  return await agentResult.save();
};

export default mongoose.model('AgentResult', AgentResultSchema);