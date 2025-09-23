/**
 * Market Data Service - Real-time data ingestion from multiple sources
 * Handles OHLCV, pricing, liquidity, and trading data from various APIs
 */

// Using fetch API instead of axios for better browser compatibility
// Using native WebSocket instead of ws library for browser environment
import { EventEmitter } from 'events'

export interface MarketData {
  symbol: string
  price: number
  volume24h: number
  change24h: number
  timestamp: number
  source: 'binance' | 'coingecko' | 'dia' | 'dexscreener'
}

export interface OHLCVData {
  symbol: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  timestamp: number
  timeframe: string
}

export interface LiquidityData {
  symbol: string
  totalLiquidity: number
  liquidityUSD: number
  priceImpact: {
    '0.1': number
    '0.5': number
    '1.0': number
  }
  timestamp: number
}

export class MarketDataService extends EventEmitter {
  private binanceWs: WebSocket | null = null
  private updateInterval: ReturnType<typeof setInterval> | null = null
  private isRunning = false

  // API endpoints
  private readonly endpoints = {
    binance: {
      rest: 'https://api.binance.com/api/v3',
      ws: 'wss://stream.binance.com:9443/ws'
    },
    coingecko: {
      rest: 'https://api.coingecko.com/api/v3'
    },
    dia: {
      rest: 'https://api.diadata.org/v1'
    },
    dexscreener: {
      rest: 'https://api.dexscreener.com/latest'
    }
  }

  constructor() {
    super()
    this.setupErrorHandling()
  }

  /**
   * Start the data pipeline
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Market data service is already running')
      return
    }

    console.log('🚀 Starting Market Data Service...')
    this.isRunning = true

    try {
      // Start real-time data streams
      await this.startBinanceStream()

      // Start periodic data updates
      this.startPeriodicUpdates()

      console.log('✅ Market Data Service started successfully')
      this.emit('started')
    } catch (error) {
      console.error('❌ Failed to start Market Data Service:', error)
      this.emit('error', error)
      throw error
    }
  }

  /**
   * Stop the data pipeline
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping Market Data Service...')
    this.isRunning = false

    // Close WebSocket connections
    if (this.binanceWs) {
      this.binanceWs.close()
      this.binanceWs = null
    }

    // Clear intervals
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    console.log('✅ Market Data Service stopped')
    this.emit('stopped')
  }

  /**
   * Get current market data for a symbol
   */
  async getMarketData(symbol: string): Promise<MarketData[]> {
    const data: MarketData[] = []

    try {
      // Fetch from multiple sources in parallel
      const [binanceData, coingeckoData, diaData] = await Promise.allSettled([
        this.getBinanceData(symbol),
        this.getCoingeckoData(symbol),
        this.getDiaData(symbol)
      ])

      if (binanceData.status === 'fulfilled') data.push(binanceData.value)
      if (coingeckoData.status === 'fulfilled') data.push(coingeckoData.value)
      if (diaData.status === 'fulfilled') data.push(diaData.value)

      return data
    } catch (error) {
      console.error('Error fetching market data:', error)
      throw error
    }
  }

  /**
   * Get OHLCV data for technical analysis
   */
  async getOHLCVData(symbol: string, timeframe: string = '1h', limit: number = 100): Promise<OHLCVData[]> {
    try {
      const url = new URL(`${this.endpoints.binance.rest}/klines`)
      url.searchParams.append('symbol', symbol.toUpperCase())
      url.searchParams.append('interval', timeframe)
      url.searchParams.append('limit', limit.toString())

      const response = await fetch(url.toString())

      const data = await response.json()
      return data.map((candle: any[]) => ({
        symbol,
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5]),
        timestamp: candle[0],
        timeframe
      }))
    } catch (error) {
      console.error('Error fetching OHLCV data:', error)
      throw error
    }
  }

  /**
   * Get liquidity data from DexScreener
   */
  async getLiquidityData(tokenAddress: string): Promise<LiquidityData | null> {
    try {
      const response = await fetch(`${this.endpoints.dexscreener.rest}/dex/tokens/${tokenAddress}`)
      const data = await response.json()

      if (data.pairs && data.pairs.length > 0) {
        const pair = data.pairs[0]

        return {
          symbol: pair.baseToken.symbol,
          totalLiquidity: parseFloat(pair.liquidity?.usd || '0'),
          liquidityUSD: parseFloat(pair.liquidity?.usd || '0'),
          priceImpact: {
            '0.1': parseFloat(pair.priceImpact?.['0.1'] || '0'),
            '0.5': parseFloat(pair.priceImpact?.['0.5'] || '0'),
            '1.0': parseFloat(pair.priceImpact?.['1.0'] || '0')
          },
          timestamp: Date.now()
        }
      }

      return null
    } catch (error) {
      console.error('Error fetching liquidity data:', error)
      return null
    }
  }

  /**
   * Start Binance WebSocket stream for real-time data
   */
  private async startBinanceStream(): Promise<void> {
    const symbols = ['btcusdt', 'ethusdt', 'adausdt', 'dotusdt', 'linkusdt']
    const streams = symbols.map(symbol => `${symbol}@ticker`).join('/')

    this.binanceWs = new WebSocket(`${this.endpoints.binance.ws}/${streams}`)

    this.binanceWs.on('open', () => {
      console.log('📡 Binance WebSocket connected')
    })

    this.binanceWs.on('message', (data) => {
      try {
        const ticker = JSON.parse(data.toString())

        const marketData: MarketData = {
          symbol: ticker.s,
          price: parseFloat(ticker.c),
          volume24h: parseFloat(ticker.v),
          change24h: parseFloat(ticker.P),
          timestamp: Date.now(),
          source: 'binance'
        }

        this.emit('marketData', marketData)
      } catch (error) {
        console.error('Error parsing Binance data:', error)
      }
    })

    this.binanceWs.on('error', (error) => {
      console.error('Binance WebSocket error:', error)
      this.emit('error', error)
    })

    this.binanceWs.on('close', () => {
      console.log('📡 Binance WebSocket disconnected')
      if (this.isRunning) {
        // Reconnect after 5 seconds
        setTimeout(() => this.startBinanceStream(), 5000)
      }
    })
  }

  /**
   * Start periodic updates for non-real-time data
   */
  private startPeriodicUpdates(): void {
    this.updateInterval = setInterval(async () => {
      try {
        // Update market data every 30 seconds
        const symbols = ['bitcoin', 'ethereum', 'cardano', 'polkadot', 'chainlink']

        for (const symbol of symbols) {
          const data = await this.getCoingeckoData(symbol)
          this.emit('marketData', data)
        }
      } catch (error) {
        console.error('Error in periodic update:', error)
      }
    }, 30000) // 30 seconds
  }

  /**
   * Fetch data from Binance API
   */
  private async getBinanceData(symbol: string): Promise<MarketData> {
    const url = new URL(`${this.endpoints.binance.rest}/ticker/24hr`)
    url.searchParams.append('symbol', symbol.toUpperCase())

    const response = await fetch(url.toString())
    const data = await response.json()
    return {
      symbol: data.symbol,
      price: parseFloat(data.lastPrice),
      volume24h: parseFloat(data.volume),
      change24h: parseFloat(data.priceChangePercent),
      timestamp: Date.now(),
      source: 'binance'
    }
  }

  /**
   * Fetch data from CoinGecko API
   */
  private async getCoingeckoData(symbol: string): Promise<MarketData> {
    const url = new URL(`${this.endpoints.coingecko.rest}/simple/price`)
    url.searchParams.append('ids', symbol)
    url.searchParams.append('vs_currencies', 'usd')
    url.searchParams.append('include_24hr_change', 'true')
    url.searchParams.append('include_24hr_vol', 'true')

    const response = await fetch(url.toString())
    const responseData = await response.json()
    const data = responseData[symbol]
    return {
      symbol: symbol.toUpperCase(),
      price: data.usd,
      volume24h: data.usd_24h_vol || 0,
      change24h: data.usd_24h_change || 0,
      timestamp: Date.now(),
      source: 'coingecko'
    }
  }

  /**
   * Fetch data from DIA API
   */
  private async getDiaData(symbol: string): Promise<MarketData> {
    const response = await fetch(`${this.endpoints.dia.rest}/quotation/${symbol}`)
    const data = await response.json()
    return {
      symbol: data.Symbol,
      price: data.Price,
      volume24h: 0, // DIA doesn't provide volume in this endpoint
      change24h: 0, // DIA doesn't provide 24h change in this endpoint
      timestamp: new Date(data.Time).getTime(),
      source: 'dia'
    }
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.on('error', (error) => {
      console.error('Market Data Service Error:', error)
      // Implement retry logic, alerting, etc.
    })
  }
}

// Export singleton instance
export const marketDataService = new MarketDataService()