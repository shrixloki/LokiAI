import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Target,
  Zap,
  Calendar,
  Download,
  RefreshCw,
  PieChart,
  Activity
} from 'lucide-react';
import { mockAgents, getPortfolioStats, getAgentStats } from '@/data/mockData';

export default function Analytics() {
  const [timeframe, setTimeframe] = useState('30d');
  const [selectedAgent, setSelectedAgent] = useState('all');
  
  const portfolioStats = getPortfolioStats();
  const agentStats = getAgentStats();
  
  // Mock analytics data
  const performanceMetrics = {
    totalReturn: 23456.78,
    returnPercentage: 18.4,
    sharpeRatio: 2.3,
    maxDrawdown: -8.2,
    volatility: 12.5,
    winRate: 73.8,
    profitFactor: 2.1,
    avgTrade: 245.67
  };

  const chainAnalytics = [
    { chain: 'Ethereum', volume: 45682.34, trades: 156, profitLoss: 3245.67, apy: 24.5 },
    { chain: 'Polygon', volume: 23456.78, trades: 89, profitLoss: 1876.43, apy: 31.2 },
    { chain: 'Arbitrum', volume: 18934.56, trades: 67, profitLoss: 967.89, apy: 18.7 },
    { chain: 'BSC', volume: 12345.67, trades: 34, profitLoss: 456.78, apy: 15.3 }
  ];

  const strategyBreakdown = [
    { strategy: 'Yield Farming', allocation: 35, returns: 4567.89, apy: 28.4 },
    { strategy: 'Arbitrage', allocation: 25, returns: 3234.56, apy: 35.7 },
    { strategy: 'Liquidity Mining', allocation: 20, returns: 2345.67, apy: 22.1 },
    { strategy: 'Portfolio Rebalancing', allocation: 20, returns: 1876.43, apy: 19.8 }
  ];

  return (
    <DashboardLayout title="Analytics" subtitle="Comprehensive performance insights and market analysis">
      <div className="space-y-8">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-32 bg-scale-gray-900 border-scale-gray-700 text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-scale-gray-800">
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="w-48 bg-scale-gray-900 border-scale-gray-700 text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-scale-gray-800">
                <SelectItem value="all">All Agents</SelectItem>
                {mockAgents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="border-scale-gray-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="border-scale-gray-700">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-scale-gray-400">Total Return</p>
                  <p className="text-2xl font-bold text-green-500">
                    +${performanceMetrics.totalReturn.toLocaleString()}
                  </p>
                  <div className="flex items-center text-xs text-green-500 mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{performanceMetrics.returnPercentage}%
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-scale-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-scale-gray-400">Sharpe Ratio</p>
                  <p className="text-2xl font-bold text-foreground">
                    {performanceMetrics.sharpeRatio}
                  </p>
                  <p className="text-xs text-scale-gray-500 mt-1">Risk-adjusted</p>
                </div>
                <Target className="h-8 w-8 text-scale-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-scale-gray-400">Win Rate</p>
                  <p className="text-2xl font-bold text-foreground">
                    {performanceMetrics.winRate}%
                  </p>
                  <Progress value={performanceMetrics.winRate} className="mt-2 h-2" />
                </div>
                <Zap className="h-8 w-8 text-scale-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-scale-gray-400">Max Drawdown</p>
                  <p className="text-2xl font-bold text-red-500">
                    {performanceMetrics.maxDrawdown}%
                  </p>
                  <p className="text-xs text-scale-gray-500 mt-1">Risk metric</p>
                </div>
                <TrendingDown className="h-8 w-8 text-scale-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chain Performance */}
          <Card className="bg-card border-scale-gray-800">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Chain Performance</span>
              </CardTitle>
              <CardDescription className="text-scale-gray-400">
                Trading volume and profitability by blockchain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {chainAnalytics.map((chain) => (
                <div key={chain.chain} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-scale-gray-800 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {chain.chain.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{chain.chain}</p>
                        <p className="text-xs text-scale-gray-500">{chain.trades} trades</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">
                        ${chain.volume.toLocaleString()}
                      </p>
                      <p className={`text-xs ${chain.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        +${chain.profitLoss.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Progress value={chain.apy} className="h-2" />
                  <p className="text-xs text-scale-gray-400 text-right">{chain.apy}% APY</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Strategy Breakdown */}
          <Card className="bg-card border-scale-gray-800">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center space-x-2">
                <PieChart className="h-5 w-5" />
                <span>Strategy Allocation</span>
              </CardTitle>
              <CardDescription className="text-scale-gray-400">
                Portfolio distribution and performance by strategy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {strategyBreakdown.map((strategy) => (
                <div key={strategy.strategy} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{strategy.strategy}</p>
                      <p className="text-xs text-scale-gray-500">{strategy.allocation}% allocation</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-500">
                        +${strategy.returns.toLocaleString()}
                      </p>
                      <p className="text-xs text-scale-gray-400">{strategy.apy}% APY</p>
                    </div>
                  </div>
                  <Progress value={strategy.allocation} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6 text-center">
              <Activity className="h-8 w-8 text-scale-gray-400 mx-auto mb-2" />
              <p className="text-sm text-scale-gray-400">Volatility</p>
              <p className="text-xl font-bold text-foreground">{performanceMetrics.volatility}%</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 text-scale-gray-400 mx-auto mb-2" />
              <p className="text-sm text-scale-gray-400">Profit Factor</p>
              <p className="text-xl font-bold text-foreground">{performanceMetrics.profitFactor}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6 text-center">
              <DollarSign className="h-8 w-8 text-scale-gray-400 mx-auto mb-2" />
              <p className="text-sm text-scale-gray-400">Avg Trade</p>
              <p className="text-xl font-bold text-foreground">
                ${performanceMetrics.avgTrade.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 text-scale-gray-400 mx-auto mb-2" />
              <p className="text-sm text-scale-gray-400">Active Days</p>
              <p className="text-xl font-bold text-foreground">28/30</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}