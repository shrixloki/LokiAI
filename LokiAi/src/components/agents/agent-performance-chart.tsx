/**
 * Agent Performance Chart - Detailed performance analytics and visualizations
 * Shows profit trends, success rates, and comparative analysis across agents
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import {
  TrendingUp,
  BarChart3,
  Download,
  Calendar,
  Filter
} from 'lucide-react'

interface Agent {
  id: string
  type: 'yield' | 'arbitrage' | 'portfolio' | 'risk'
  name: string
  performance: {
    totalTrades: number
    successRate: number
    totalProfit: number
    roi: number
    sharpeRatio: number
    maxDrawdown: number
  }
}

interface AgentPerformanceChartProps {
  agents: Agent[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function AgentPerformanceChart({ agents }: AgentPerformanceChartProps) {
  const [timeRange, setTimeRange] = useState('30d')
  const [chartType, setChartType] = useState('profit')
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])

  // Update selected agents when agents prop changes
  useEffect(() => {
    setSelectedAgents(agents.map(a => a.id))
  }, [agents])

  // Generate historical data for charts
  const generateHistoricalData = (days: number) => {
    const data = []
    const now = new Date()

    for (let i = days; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)

      const dataPoint: any = {
        date: date.toLocaleDateString(),
        timestamp: date.getTime()
      }

      agents.forEach(agent => {
        if (selectedAgents.includes(agent.id)) {
          // Simulate historical performance data
          const progress = (days - i) / days
          const baseProfit = agent.performance.totalProfit * progress
          const volatility = Math.sin(i * 0.1) * (baseProfit * 0.1)

          dataPoint[agent.name] = Math.max(0, baseProfit + volatility)
          dataPoint[`${agent.name}_trades`] = Math.floor(agent.performance.totalTrades * progress)
          dataPoint[`${agent.name}_success`] = agent.performance.successRate + (Math.random() - 0.5) * 5
        }
      })

      data.push(dataPoint)
    }

    return data
  }

  const getDaysFromRange = (range: string) => {
    switch (range) {
      case '7d': return 7
      case '30d': return 30
      case '90d': return 90
      case '1y': return 365
      default: return 30
    }
  }

  const historicalData = generateHistoricalData(getDaysFromRange(timeRange))

  // Prepare data for different chart types
  const profitComparisonData = agents
    .filter(agent => selectedAgents.includes(agent.id))
    .map(agent => ({
      name: agent.name.split(' ')[0],
      profit: agent.performance.totalProfit,
      roi: agent.performance.roi,
      trades: agent.performance.totalTrades,
      successRate: agent.performance.successRate,
      sharpeRatio: agent.performance.sharpeRatio,
      maxDrawdown: agent.performance.maxDrawdown
    }))

  const agentTypeData = [
    {
      name: 'Yield Optimizer',
      value: agents.filter(a => a.type === 'yield').reduce((sum, a) => sum + a.performance.totalProfit, 0),
      count: agents.filter(a => a.type === 'yield').length
    },
    {
      name: 'Arbitrage Bot',
      value: agents.filter(a => a.type === 'arbitrage').reduce((sum, a) => sum + a.performance.totalProfit, 0),
      count: agents.filter(a => a.type === 'arbitrage').length
    },
    {
      name: 'Portfolio Rebalancer',
      value: agents.filter(a => a.type === 'portfolio').reduce((sum, a) => sum + a.performance.totalProfit, 0),
      count: agents.filter(a => a.type === 'portfolio').length
    },
    {
      name: 'Risk Manager',
      value: agents.filter(a => a.type === 'risk').reduce((sum, a) => sum + a.performance.totalProfit, 0),
      count: agents.filter(a => a.type === 'risk').length
    }
  ].filter(item => item.count > 0)

  const riskReturnData = agents
    .filter(agent => selectedAgents.includes(agent.id))
    .map(agent => ({
      name: agent.name.split(' ')[0],
      risk: agent.performance.maxDrawdown,
      return: agent.performance.roi,
      sharpe: agent.performance.sharpeRatio,
      profit: agent.performance.totalProfit
    }))

  const radarData = agents
    .filter(agent => selectedAgents.includes(agent.id))
    .map(agent => ({
      agent: agent.name.split(' ')[0],
      Profit: (agent.performance.totalProfit / 20000) * 100, // Normalize to 0-100
      'Success Rate': agent.performance.successRate,
      ROI: Math.min(100, agent.performance.roi * 5), // Scale ROI
      'Sharpe Ratio': Math.min(100, agent.performance.sharpeRatio * 40), // Scale Sharpe
      Trades: Math.min(100, (agent.performance.totalTrades / 50) * 100) // Normalize trades
    }))

  const handleExportData = () => {
    const csvData = profitComparisonData.map(row =>
      Object.entries(row).map(([, value]) => `"${value}"`).join(',')
    ).join('\n')

    const headers = Object.keys(profitComparisonData[0] || {}).join(',')
    const csv = headers + '\n' + csvData

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agent-performance-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const toggleAgent = (agentId: string) => {
    setSelectedAgents(prev =>
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    )
  }

  // Render chart based on type
  const renderChart = () => {
    if (chartType === 'profit') {
      return (
        <AreaChart data={historicalData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip
            formatter={(value: any, name: string) => [
              `${Number(value).toLocaleString()}`,
              name
            ]}
          />
          {agents
            .filter(agent => selectedAgents.includes(agent.id))
            .map((agent, index) => (
              <Area
                key={agent.id}
                type="monotone"
                dataKey={agent.name}
                stackId="1"
                stroke={COLORS[index % COLORS.length]}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={0.6}
              />
            ))}
        </AreaChart>
      )
    }

    if (chartType === 'comparison') {
      return (
        <BarChart data={profitComparisonData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="profit" fill="#8884d8" name="Profit ($)" />
          <Bar dataKey="roi" fill="#82ca9d" name="ROI (%)" />
        </BarChart>
      )
    }

    if (chartType === 'distribution') {
      return (
        <PieChart>
          <Pie
            data={agentTypeData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {agentTypeData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString()}`, 'Profit']} />
        </PieChart>
      )
    }

    if (chartType === 'risk-return') {
      return (
        <LineChart data={riskReturnData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="risk"
            type="number"
            domain={['dataMin', 'dataMax']}
            label={{ value: 'Risk (Max Drawdown %)', position: 'insideBottom', offset: -10 }}
          />
          <YAxis
            dataKey="return"
            type="number"
            domain={['dataMin', 'dataMax']}
            label={{ value: 'Return (ROI %)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={(value: any, name: string) => [
              name === 'return' ? `${Number(value).toFixed(1)}%` : `${Number(value).toFixed(1)}%`,
              name === 'return' ? 'ROI' : 'Max Drawdown'
            ]}
          />
          <Line
            type="monotone"
            dataKey="return"
            stroke="#8884d8"
            strokeWidth={3}
            dot={{ fill: '#8884d8', strokeWidth: 2, r: 6 }}
          />
        </LineChart>
      )
    }

    if (chartType === 'radar' && radarData.length > 0) {
      const radarMetrics = [
        { subject: 'Profit', A: radarData[0]?.Profit || 0 },
        { subject: 'Success Rate', A: radarData[0]?.['Success Rate'] || 0 },
        { subject: 'ROI', A: radarData[0]?.ROI || 0 },
        { subject: 'Sharpe Ratio', A: radarData[0]?.['Sharpe Ratio'] || 0 },
        { subject: 'Trades', A: radarData[0]?.Trades || 0 }
      ]

      return (
        <RadarChart data={radarMetrics}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} />
          <Radar
            name="Performance"
            dataKey="A"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.3}
          />
          <Tooltip />
        </RadarChart>
      )
    }

    return null
  }

  // Handle empty state
  if (agents.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No Performance Data</h3>
            <p className="text-muted-foreground">
              Deploy agents to see performance analytics and charts.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profit">Profit Trends</SelectItem>
                <SelectItem value="comparison">Performance Comparison</SelectItem>
                <SelectItem value="distribution">Type Distribution</SelectItem>
                <SelectItem value="risk-return">Risk vs Return</SelectItem>
                <SelectItem value="radar">Multi-Metric Radar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Agent Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Agent Filter</span>
          </CardTitle>
          <CardDescription>Select agents to include in the analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {agents.map(agent => (
              <Badge
                key={agent.id}
                variant={selectedAgents.includes(agent.id) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleAgent(agent.id)}
              >
                {agent.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>
              {chartType === 'profit' && 'Profit Trends Over Time'}
              {chartType === 'comparison' && 'Performance Comparison'}
              {chartType === 'distribution' && 'Profit Distribution by Agent Type'}
              {chartType === 'risk-return' && 'Risk vs Return Analysis'}
              {chartType === 'radar' && 'Multi-Metric Performance Radar'}
            </span>
          </CardTitle>
          <CardDescription>
            {chartType === 'profit' && `Historical profit trends for the last ${timeRange}`}
            {chartType === 'comparison' && 'Comparative analysis of key performance metrics'}
            {chartType === 'distribution' && 'Profit contribution by different agent types'}
            {chartType === 'risk-return' && 'Risk-adjusted return analysis with Sharpe ratios'}
            {chartType === 'radar' && 'Comprehensive performance overview across multiple dimensions'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            {renderChart()}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const filteredAgents = agents.filter(agent => selectedAgents.includes(agent.id))
              if (filteredAgents.length === 0) return <div>No agents selected</div>

              const topAgent = filteredAgents.reduce((prev, current) =>
                prev.performance.totalProfit > current.performance.totalProfit ? prev : current
              )
              return (
                <div>
                  <div className="text-lg font-bold">{topAgent.name}</div>
                  <div className="text-sm text-muted-foreground">
                    ${topAgent.performance.totalProfit.toLocaleString()} profit
                  </div>
                  <div className="text-sm text-green-600">
                    {topAgent.performance.roi.toFixed(1)}% ROI
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Most Consistent</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const filteredAgents = agents.filter(agent => selectedAgents.includes(agent.id))
              if (filteredAgents.length === 0) return <div>No agents selected</div>

              const consistentAgent = filteredAgents.reduce((prev, current) =>
                prev.performance.successRate > current.performance.successRate ? prev : current
              )
              return (
                <div>
                  <div className="text-lg font-bold">{consistentAgent.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {consistentAgent.performance.successRate.toFixed(1)}% success rate
                  </div>
                  <div className="text-sm text-blue-600">
                    {consistentAgent.performance.totalTrades} trades
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Best Risk-Adjusted</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const filteredAgents = agents.filter(agent => selectedAgents.includes(agent.id))
              if (filteredAgents.length === 0) return <div>No agents selected</div>

              const bestSharpe = filteredAgents.reduce((prev, current) =>
                prev.performance.sharpeRatio > current.performance.sharpeRatio ? prev : current
              )
              return (
                <div>
                  <div className="text-lg font-bold">{bestSharpe.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {bestSharpe.performance.sharpeRatio.toFixed(2)} Sharpe ratio
                  </div>
                  <div className="text-sm text-purple-600">
                    {bestSharpe.performance.maxDrawdown.toFixed(1)}% max drawdown
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}