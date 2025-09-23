/**
 * Feature Engineering Service - Transform raw market data into ML-ready features
 * Handles technical indicators, market sentiment, and quantitative features
 */

import { MarketData, OHLCVData } from './market-data-service'

export interface TechnicalIndicators {
  sma: number[]
  ema: number[]
  rsi: number
  macd: {
    macd: number
    signal: number
    histogram: number
  }
  bollinger: {
    upper: number
    middle: number
    lower: number
  }
  stochastic: {
    k: number
    d: number
  }
  atr: number
  adx: number
}

export interface MarketSentiment {
  fearGreedIndex: number
  socialSentiment: number
  newsScore: number
  volumeProfile: number
  marketDominance: number
}

export interface QuantitativeFeatures {
  returns: number[]
  volatility: number
  sharpeRatio: number
  correlation: number[]
  momentum: number[]
  meanReversion: number
  trendStrength: number
  liquidityScore: number
}

export interface MLFeatures {
  technical: TechnicalIndicators
  sentiment: MarketSentiment
  quantitative: QuantitativeFeatures
  timestamp: number
  symbol: string
}

export class FeatureEngineeringService {
  /**
   * Generate comprehensive ML features from OHLCV data
   */
  generateFeatures(ohlcvData: OHLCVData[], marketData: MarketData[]): MLFeatures {
    if (ohlcvData.length === 0) {
      throw new Error('Insufficient OHLCV data for feature generation')
    }

    const symbol = ohlcvData[0].symbol
    const closes = ohlcvData.map(d => d.close)
    const highs = ohlcvData.map(d => d.high)
    const lows = ohlcvData.map(d => d.low)
    const volumes = ohlcvData.map(d => d.volume)

    return {
      technical: this.calculateTechnicalIndicators(ohlcvData),
      sentiment: this.calculateMarketSentiment(marketData),
      quantitative: this.calculateQuantitativeFeatures(ohlcvData),
      timestamp: Date.now(),
      symbol
    }
  }

  /**
   * Calculate technical indicators
   */
  private calculateTechnicalIndicators(data: OHLCVData[]): TechnicalIndicators {
    const closes = data.map(d => d.close)
    const highs = data.map(d => d.high)
    const lows = data.map(d => d.low)
    const volumes = data.map(d => d.volume)

    return {
      sma: this.calculateSMA(closes, [10, 20, 50]),
      ema: this.calculateEMA(closes, [12, 26]),
      rsi: this.calculateRSI(closes, 14),
      macd: this.calculateMACD(closes),
      bollinger: this.calculateBollingerBands(closes, 20, 2),
      stochastic: this.calculateStochastic(highs, lows, closes, 14),
      atr: this.calculateATR(highs, lows, closes, 14),
      adx: this.calculateADX(highs, lows, closes, 14)
    }
  }

  /**
   * Calculate market sentiment indicators
   */
  private calculateMarketSentiment(marketData: MarketData[]): MarketSentiment {
    if (marketData.length === 0) {
      return {
        fearGreedIndex: 50,
        socialSentiment: 0,
        newsScore: 0,
        volumeProfile: 0,
        marketDominance: 0
      }
    }

    const avgChange = marketData.reduce((sum, d) => sum + d.change24h, 0) / marketData.length
    const avgVolume = marketData.reduce((sum, d) => sum + d.volume24h, 0) / marketData.length

    return {
      fearGreedIndex: this.calculateFearGreedIndex(avgChange),
      socialSentiment: this.calculateSocialSentiment(marketData),
      newsScore: this.calculateNewsScore(marketData),
      volumeProfile: this.calculateVolumeProfile(avgVolume),
      marketDominance: this.calculateMarketDominance(marketData)
    }
  }

  /**
   * Calculate quantitative features
   */
  private calculateQuantitativeFeatures(data: OHLCVData[]): QuantitativeFeatures {
    const closes = data.map(d => d.close)
    const returns = this.calculateReturns(closes)
    
    return {
      returns,
      volatility: this.calculateVolatility(returns),
      sharpeRatio: this.calculateSharpeRatio(returns),
      correlation: this.calculateCorrelation(closes),
      momentum: this.calculateMomentum(closes, [5, 10, 20]),
      meanReversion: this.calculateMeanReversion(closes),
      trendStrength: this.calculateTrendStrength(closes),
      liquidityScore: this.calculateLiquidityScore(data)
    }
  }

  /**
   * Simple Moving Average
   */
  private calculateSMA(prices: number[], periods: number[]): number[] {
    return periods.map(period => {
      if (prices.length < period) return prices[prices.length - 1] || 0
      
      const slice = prices.slice(-period)
      return slice.reduce((sum, price) => sum + price, 0) / period
    })
  }

  /**
   * Exponential Moving Average
   */
  private calculateEMA(prices: number[], periods: number[]): number[] {
    return periods.map(period => {
      if (prices.length === 0) return 0
      if (prices.length === 1) return prices[0]

      const multiplier = 2 / (period + 1)
      let ema = prices[0]

      for (let i = 1; i < prices.length; i++) {
        ema = (prices[i] * multiplier) + (ema * (1 - multiplier))
      }

      return ema
    })
  }

  /**
   * Relative Strength Index
   */
  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50

    const changes = []
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1])
    }

    const gains = changes.map(change => change > 0 ? change : 0)
    const losses = changes.map(change => change < 0 ? Math.abs(change) : 0)

    const avgGain = gains.slice(-period).reduce((sum, gain) => sum + gain, 0) / period
    const avgLoss = losses.slice(-period).reduce((sum, loss) => sum + loss, 0) / period

    if (avgLoss === 0) return 100
    
    const rs = avgGain / avgLoss
    return 100 - (100 / (1 + rs))
  }

  /**
   * MACD (Moving Average Convergence Divergence)
   */
  private calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
    const ema12 = this.calculateEMA(prices, [12])[0]
    const ema26 = this.calculateEMA(prices, [26])[0]
    const macd = ema12 - ema26

    // Simple signal line calculation (normally EMA of MACD)
    const signal = macd * 0.9 // Simplified

    return {
      macd,
      signal,
      histogram: macd - signal
    }
  }

  /**
   * Bollinger Bands
   */
  private calculateBollingerBands(prices: number[], period: number, stdDev: number): { upper: number; middle: number; lower: number } {
    const sma = this.calculateSMA(prices, [period])[0]
    
    if (prices.length < period) {
      return { upper: sma, middle: sma, lower: sma }
    }

    const slice = prices.slice(-period)
    const variance = slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period
    const standardDeviation = Math.sqrt(variance)

    return {
      upper: sma + (standardDeviation * stdDev),
      middle: sma,
      lower: sma - (standardDeviation * stdDev)
    }
  }

  /**
   * Stochastic Oscillator
   */
  private calculateStochastic(highs: number[], lows: number[], closes: number[], period: number): { k: number; d: number } {
    if (closes.length < period) {
      return { k: 50, d: 50 }
    }

    const recentHighs = highs.slice(-period)
    const recentLows = lows.slice(-period)
    const currentClose = closes[closes.length - 1]

    const highestHigh = Math.max(...recentHighs)
    const lowestLow = Math.min(...recentLows)

    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100
    const d = k * 0.9 // Simplified D calculation

    return { k, d }
  }

  /**
   * Average True Range
   */
  private calculateATR(highs: number[], lows: number[], closes: number[], period: number): number {
    if (closes.length < 2) return 0

    const trueRanges = []
    for (let i = 1; i < closes.length; i++) {
      const tr1 = highs[i] - lows[i]
      const tr2 = Math.abs(highs[i] - closes[i - 1])
      const tr3 = Math.abs(lows[i] - closes[i - 1])
      trueRanges.push(Math.max(tr1, tr2, tr3))
    }

    const recentTR = trueRanges.slice(-period)
    return recentTR.reduce((sum, tr) => sum + tr, 0) / recentTR.length
  }

  /**
   * Average Directional Index
   */
  private calculateADX(highs: number[], lows: number[], closes: number[], period: number): number {
    // Simplified ADX calculation
    if (closes.length < period) return 25

    let upMoves = 0
    let downMoves = 0

    for (let i = 1; i < closes.length; i++) {
      const upMove = highs[i] - highs[i - 1]
      const downMove = lows[i - 1] - lows[i]

      if (upMove > downMove && upMove > 0) upMoves++
      if (downMove > upMove && downMove > 0) downMoves++
    }

    const totalMoves = upMoves + downMoves
    return totalMoves > 0 ? (Math.abs(upMoves - downMoves) / totalMoves) * 100 : 25
  }

  /**
   * Calculate returns
   */
  private calculateReturns(prices: number[]): number[] {
    const returns = []
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1])
    }
    return returns
  }

  /**
   * Calculate volatility
   */
  private calculateVolatility(returns: number[]): number {
    if (returns.length === 0) return 0

    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length
    return Math.sqrt(variance)
  }

  /**
   * Calculate Sharpe ratio
   */
  private calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.02): number {
    if (returns.length === 0) return 0

    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
    const volatility = this.calculateVolatility(returns)
    
    return volatility > 0 ? (meanReturn - riskFreeRate) / volatility : 0
  }

  /**
   * Calculate correlation (simplified)
   */
  private calculateCorrelation(prices: number[]): number[] {
    // Simplified correlation with market (would need market index data)
    return [0.7, 0.8, 0.6] // Placeholder values
  }

  /**
   * Calculate momentum
   */
  private calculateMomentum(prices: number[], periods: number[]): number[] {
    return periods.map(period => {
      if (prices.length < period + 1) return 0
      
      const currentPrice = prices[prices.length - 1]
      const pastPrice = prices[prices.length - 1 - period]
      
      return (currentPrice - pastPrice) / pastPrice
    })
  }

  /**
   * Calculate mean reversion indicator
   */
  private calculateMeanReversion(prices: number[]): number {
    if (prices.length < 20) return 0

    const sma20 = this.calculateSMA(prices, [20])[0]
    const currentPrice = prices[prices.length - 1]
    
    return (currentPrice - sma20) / sma20
  }

  /**
   * Calculate trend strength
   */
  private calculateTrendStrength(prices: number[]): number {
    if (prices.length < 10) return 0

    const recent = prices.slice(-10)
    let upDays = 0
    
    for (let i = 1; i < recent.length; i++) {
      if (recent[i] > recent[i - 1]) upDays++
    }
    
    return (upDays / (recent.length - 1)) * 2 - 1 // Scale to [-1, 1]
  }

  /**
   * Calculate liquidity score
   */
  private calculateLiquidityScore(data: OHLCVData[]): number {
    if (data.length === 0) return 0

    const avgVolume = data.reduce((sum, d) => sum + d.volume, 0) / data.length
    const recentVolume = data[data.length - 1].volume
    
    return recentVolume / avgVolume
  }

  /**
   * Calculate Fear & Greed Index
   */
  private calculateFearGreedIndex(avgChange: number): number {
    // Simplified calculation based on price change
    const normalized = Math.max(-10, Math.min(10, avgChange))
    return 50 + (normalized * 5) // Scale to 0-100
  }

  /**
   * Calculate social sentiment
   */
  private calculateSocialSentiment(marketData: MarketData[]): number {
    // Placeholder - would integrate with social media APIs
    const avgChange = marketData.reduce((sum, d) => sum + d.change24h, 0) / marketData.length
    return Math.max(-1, Math.min(1, avgChange / 10))
  }

  /**
   * Calculate news score
   */
  private calculateNewsScore(marketData: MarketData[]): number {
    // Placeholder - would integrate with news sentiment APIs
    return Math.random() * 2 - 1 // Random score between -1 and 1
  }

  /**
   * Calculate volume profile
   */
  private calculateVolumeProfile(avgVolume: number): number {
    // Simplified volume profile calculation
    return Math.log(avgVolume + 1) / 20 // Normalize volume
  }

  /**
   * Calculate market dominance
   */
  private calculateMarketDominance(marketData: MarketData[]): number {
    if (marketData.length === 0) return 0

    const totalVolume = marketData.reduce((sum, d) => sum + d.volume24h, 0)
    const btcData = marketData.find(d => d.symbol.includes('BTC'))
    
    return btcData ? btcData.volume24h / totalVolume : 0
  }
}

// Export singleton instance
export const featureEngineeringService = new FeatureEngineeringService()