/**
 * Real-Time Monitor - Live monitoring dashboard for AI agents
 * Displays real-time market data, agent decisions, and execution status
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Brain, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  DollarSign,
  BarChart3,
  Target,
  Pause,
  Play
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

interface Agent {
  id: string
  type: 'yield' | 'arbitrage' | 'portfolio' | 'risk'
  name: string
  status: 'active' | 'paused' | 'stopped' | 'error'
  performance: {
    totalTrades: number
    successRate: number
    totalProfit: number
    roi: number
  }
}

interface MarketData {
  symbol: string
  price: number
  change24h: number
  volume: number
  timestamp: number
}

interface AgentDecision {
  agentId: string
  agentName: string
  decision: string
  confidence: number
  reasoning: string
  timestamp: number
  status: 'analyzing' | 'executing' | 'completed' | 'failed'
}

interface RealTimeMonitorProps {
  agents: Agent[]
}

export function RealTimeMonitor({ agents }: RealTimeMonitorProps) {
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [recentDecisions, setRecentDecisions] = useState<AgentDecision[]>([])
  const [systemMetrics, setSystemMetrics] = useState({
    totalDecisions: 0,
    executedActions: 0,
    successRate: 0,
    avgLatency: 0,
    activeAgents: 0
  })
  const [priceHistory, setPriceHistory] = useState<any[]>([])
  const [isLive, setIsLive] = useState(true)

  // Handle empty state
  if (agents.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Activity className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No Live Monitoring Data</h3>
            <p className="text-muted-foreground">
              Deploy and activate agents to see real-time monitoring data.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  // Simulate real-time data updates
  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      // Update market data
      const newMarketData: MarketData[] = [
        {
          symbol: 'BTC/USDT',
          price: 45000 + (Math.random() - 0.5) * 1000,
          change24h: (Math.random() - 0.5) * 10,
          volume: 1000000000 + Math.random() * 500000000,
          timestamp: Date.now()
        },
        {
          symbol: 'ETH/USDT',
          price: 3000 + (Math.random() - 0.5) * 200,
          change24h: (Math.random() - 0.5) * 8,
          volume: 500000000 + Math.random() * 200000000,
          timestamp: Date.now()
        },
        {
          symbol: 'LINK/USDT',
          price: 15 + (Math.random() - 0.5) * 2,
          change24h: (Math.random() - 0.5) * 12,
          volume: 100000000 + Math.random() * 50000000,
          timestamp: Date.now()
        }
      ]
      setMarketData(newMarketData)

      // Update price history
      setPriceHistory(prev => {
        const newPoint = {
          time: new Date().toLocaleTimeString(),
          btc: newMarketData[0].price,
          eth: newMarketData[1].price,
          link: newMarketData[2].price
        }
        return [...prev.slice(-19), newPoint] // Keep last 20 points
      })

      // Simulate agent decisions (only if agents exist)
      if (agents.length > 0 && Math.random() < 0.3) { // 30% chance of new decision
        const randomAgent = agents[Math.floor(Math.random() * agents.length)]
        if (randomAgent && randomAgent.status === 'active') {
          const decisions = [
            'Analyzing yield opportunity',
            'Executing arbitrage trade',
            'Rebalancing portfolio',
            'Monitoring risk levels',
            'Compounding rewards',
            'Migrating liquidity'
          ]
          
          const newDecision: AgentDecision = {
            agentId: randomAgent.id,
            agentName: randomAgent.name,
            decision: decisions[Math.floor(Math.random() * decisions.length)],
            confidence: 0.6 + Math.random() * 0.4,
            reasoning: 'Market conditions favorable for execution',
            timestamp: Date.now(),
            status: Math.random() < 0.8 ? 'completed' : 'executing'
          }

          setRecentDecisions(prev => [newDecision, ...prev.slice(0, 9)]) // Keep last 10
        }
      }

      // Update system metrics
      setSystemMetrics(prev => ({
        totalDecisions: prev.totalDecisions + (Math.random() < 0.2 ? 1 : 0),
        executedActions: prev.executedActions + (Math.random() < 0.15 ? 1 : 0),
        successRate: 85 + Math.random() * 10,
        avgLatency: 80 + Math.random() * 40,
        activeAgents: agents.filter(a => a.status === 'active').length
      }))

    }, 2000) // Update every 2 seconds

    return () => clearInterval(interval)
  }, [agents, isLive])

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'yield': return <TrendingUp className="h-4 w-4" />
      case 'arbitrage': return <Zap className="h-4 w-4" />
      case 'portfolio': return <BarChart3 className="h-4 w-4" />
      case 'risk': return <Target className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'analyzing': return <Brain className="h-4 w-4 text-blue-500 animate-pulse" />
      case 'executing': return <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-sm font-medium">
              {isLive ? 'Live Monitoring' : 'Paused'}
            </span>
          </div>
          <Badge variant="outline">
            {systemMetrics.activeAgents} Active Agents
          </Badge>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsLive(!isLive)}
        >
          {isLive ? (
            <>
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-1" />
              Resume
            </>
          )}
        </Button>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>Decisions/Min</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(systemMetrics.totalDecisions / 5)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total: {systemMetrics.totalDecisions}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Executions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemMetrics.executedActions}
            </div>
            <p className="text-xs text-muted-foreground">
              Success: {systemMetrics.successRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Avg Latency</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemMetrics.avgLatency.toFixed(0)}ms
            </div>
            <Progress value={Math.max(0, 100 - systemMetrics.avgLatency)} className="mt-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>System Load</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((systemMetrics.activeAgents / agents.length) * 100).toFixed(0)}%
            </div>
            <Progress value={(systemMetrics.activeAgents / agents.length) * 100} className="mt-1" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Live Market Data</span>
            </CardTitle>
            <CardDescription>Real-time price feeds and market indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {marketData.map((data) => (
              <div key={data.symbol} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                <div>
                  <div className="font-medium">{data.symbol}</div>
                  <div className="text-sm text-muted-foreground">
                    Vol: ${(data.volume / 1000000).toFixed(0)}M
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    ${data.price.toLocaleString()}
                  </div>
                  <div className={`text-sm flex items-center ${
                    data.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {data.change24h >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(data.change24h).toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Decisions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>Agent Decisions</span>
            </CardTitle>
            <CardDescription>Real-time agent decision making and execution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentDecisions.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No recent decisions
                </div>
              ) : (
                recentDecisions.map((decision, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-muted/50 rounded">
                    <div className="mt-0.5">
                      {getStatusIcon(decision.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">
                          {decision.agentName}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(decision.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {decision.decision}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <Badge variant="outline" className="text-xs">
                          {(decision.confidence * 100).toFixed(0)}% confidence
                        </Badge>
                        <Badge 
                          variant={decision.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {decision.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Price Movements</span>
          </CardTitle>
          <CardDescription>Real-time price tracking for major assets</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={priceHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="btc" 
                stackId="1" 
                stroke="#f7931a" 
                fill="#f7931a" 
                fillOpacity={0.3}
                name="BTC"
              />
              <Area 
                type="monotone" 
                dataKey="eth" 
                stackId="2" 
                stroke="#627eea" 
                fill="#627eea" 
                fillOpacity={0.3}
                name="ETH"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Agent Status Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Agent Status Overview</span>
          </CardTitle>
          <CardDescription>Current status and activity of all deployed agents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <div key={agent.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getAgentIcon(agent.type)}
                    <span className="font-medium text-sm">{agent.name}</span>
                  </div>
                  <Badge 
                    variant={agent.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {agent.status}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Profit</span>
                    <span className="font-medium text-green-600">
                      ${agent.performance.totalProfit.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className="font-medium">
                      {agent.performance.successRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Trades</span>
                    <span className="font-medium">
                      {agent.performance.totalTrades}
                    </span>
                  </div>
                </div>

                {agent.status === 'active' && (
                  <div className="mt-2 flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-muted-foreground">
                      Monitoring markets...
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}