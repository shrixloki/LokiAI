import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Bot, 
  Activity, 
  ArrowUpDown,
  Play,
  Pause,
  Settings
} from 'lucide-react';
import { mockAssets, mockAgents, mockTransactions, getPortfolioStats, getAgentStats } from '@/data/mockData';

export default function Dashboard() {
  const portfolioStats = getPortfolioStats();
  const agentStats = getAgentStats();
  const recentTransactions = mockTransactions.slice(0, 5);
  const topAssets = mockAssets.slice(0, 4);

  return (
    <DashboardLayout title="Dashboard" subtitle="Cross-Chain AI Agent Network Overview">
      <div className="space-y-8">
        {/* Portfolio Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card border-scale-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-scale-gray-400">
                Total Portfolio Value
              </CardTitle>
              <DollarSign className="h-4 w-4 text-scale-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${portfolioStats.totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
              <div className={`flex items-center text-xs ${portfolioStats.changePercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {portfolioStats.changePercentage >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {portfolioStats.changePercentage >= 0 ? '+' : ''}
                {portfolioStats.changePercentage.toFixed(2)}% (24h)
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-scale-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-scale-gray-400">
                Active AI Agents
              </CardTitle>
              <Bot className="h-4 w-4 text-scale-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {agentStats.activeAgents}/{agentStats.totalAgents}
              </div>
              <p className="text-xs text-scale-gray-500">
                {agentStats.totalTrades} total trades executed
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-scale-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-scale-gray-400">
                Total P&L (30d)
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                +${agentStats.totalPnl.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-scale-gray-500">
                {agentStats.avgWinRate.toFixed(1)}% avg win rate
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-scale-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-scale-gray-400">
                Cross-Chain Activity
              </CardTitle>
              <Activity className="h-4 w-4 text-scale-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {recentTransactions.length}
              </div>
              <p className="text-xs text-scale-gray-500">
                Recent transactions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Assets */}
          <Card className="bg-card border-scale-gray-800">
            <CardHeader>
              <CardTitle className="text-foreground">Top Assets</CardTitle>
              <CardDescription className="text-scale-gray-400">
                Your largest holdings across all chains
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topAssets.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between p-3 bg-scale-gray-900/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-scale-gray-800 rounded-full flex items-center justify-center">
                      <span className="text-sm">{asset.logo}</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{asset.symbol}</p>
                      <p className="text-xs text-scale-gray-500">{asset.chain}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">
                      ${asset.usdValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </p>
                    <p className={`text-xs ${asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Agents Status */}
          <Card className="bg-card border-scale-gray-800">
            <CardHeader>
              <CardTitle className="text-foreground">AI Agents Status</CardTitle>
              <CardDescription className="text-scale-gray-400">
                Real-time performance of your deployed agents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockAgents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-3 bg-scale-gray-900/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      agent.status === 'active' ? 'bg-green-500' :
                      agent.status === 'paused' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`} />
                    <div>
                      <p className="font-medium text-foreground">{agent.name}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {agent.type.replace('-', ' ')}
                        </Badge>
                        <span className="text-xs text-scale-gray-500">
                          APY: {agent.performance.apy}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-scale-gray-400 hover:text-foreground p-1"
                    >
                      {agent.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-scale-gray-400 hover:text-foreground p-1"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-card border-scale-gray-800">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Cross-Chain Activity</CardTitle>
            <CardDescription className="text-scale-gray-400">
              Latest transactions and agent executions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-scale-gray-900/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-scale-gray-800 rounded-lg flex items-center justify-center">
                      <ArrowUpDown className="h-5 w-5 text-scale-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {tx.type === 'agent-execution' ? 'AI Agent Execution' :
                         tx.type === 'bridge' ? 'Cross-Chain Bridge' :
                         'Token Swap'}
                      </p>
                      <p className="text-sm text-scale-gray-400">
                        {tx.amount} {tx.asset} • {tx.fromChain}
                        {tx.toChain && ` → ${tx.toChain}`}
                      </p>
                      <p className="text-xs text-scale-gray-500">
                        {new Date(tx.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={tx.status === 'confirmed' ? 'default' : 
                              tx.status === 'pending' ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {tx.status}
                    </Badge>
                    {tx.hash && (
                      <p className="text-xs text-scale-gray-500 mt-1">
                        {tx.hash}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}