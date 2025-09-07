import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Activity as ActivityIcon, 
  ArrowUpDown, 
  Bot, 
  Search,
  Filter,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Send,
  Repeat,
  DollarSign,
  Zap
} from 'lucide-react';
import { mockTransactions, mockAgents } from '@/data/mockData';

export default function Activity() {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('7d');

  // Extended mock activity data
  const activities = [
    ...mockTransactions.map(tx => ({
      id: tx.id,
      type: tx.type,
      status: tx.status,
      description: getTransactionDescription(tx),
      timestamp: tx.timestamp,
      amount: tx.amount,
      asset: tx.asset,
      chain: tx.fromChain,
      toChain: tx.toChain,
      fee: tx.fee,
      hash: tx.hash,
      agentId: tx.agentId
    })),
    // Additional mock activities
    {
      id: 'act_1',
      type: 'agent-deployment',
      status: 'confirmed',
      description: 'DeFi Yield Optimizer deployed successfully',
      timestamp: '2024-03-01T16:20:00Z',
      amount: 0,
      asset: '',
      chain: 'ethereum',
      toChain: undefined,
      fee: 0,
      hash: undefined,
      agentId: 'agent_1'
    },
    {
      id: 'act_2',
      type: 'strategy-update',
      status: 'confirmed', 
      description: 'Arbitrage bot strategy parameters updated',
      timestamp: '2024-03-01T15:45:00Z',
      amount: 0,
      asset: '',
      chain: 'polygon',
      toChain: undefined,
      fee: 0,
      hash: undefined,
      agentId: 'agent_2'
    },
    {
      id: 'act_3',
      type: 'profit-taking',
      status: 'confirmed',
      description: 'Automated profit taking: 500 USDC realized',
      timestamp: '2024-03-01T14:30:00Z',
      amount: 500,
      asset: 'USDC',
      chain: 'arbitrum',
      toChain: undefined,
      fee: 2.5,
      hash: '0x123abc...',
      agentId: 'agent_1'
    }
  ];

  function getTransactionDescription(tx: any) {
    switch (tx.type) {
      case 'agent-execution':
        return `AI Agent executed ${tx.asset} trade`;
      case 'bridge':
        return `Cross-chain bridge: ${tx.amount} ${tx.asset}`;
      case 'swap':
        return `Token swap: ${tx.amount} ${tx.asset}`;
      case 'transfer':
        return `Transfer: ${tx.amount} ${tx.asset}`;
      default:
        return `Transaction: ${tx.amount} ${tx.asset}`;
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'agent-execution': return <Bot className="h-4 w-4" />;
      case 'bridge': return <ArrowUpDown className="h-4 w-4" />;
      case 'swap': return <Repeat className="h-4 w-4" />;
      case 'transfer': return <Send className="h-4 w-4" />;
      case 'agent-deployment': return <Bot className="h-4 w-4" />;
      case 'strategy-update': return <Zap className="h-4 w-4" />;
      case 'profit-taking': return <DollarSign className="h-4 w-4" />;
      default: return <ActivityIcon className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-scale-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-500';
      case 'pending': return 'text-yellow-500';
      case 'failed': return 'text-red-500';
      default: return 'text-scale-gray-400';
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesFilter = filter === 'all' || activity.type === filter;
    const matchesSearch = searchTerm === '' || 
      activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.asset.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const activityCounts = {
    total: activities.length,
    confirmed: activities.filter(a => a.status === 'confirmed').length,
    pending: activities.filter(a => a.status === 'pending').length,
    failed: activities.filter(a => a.status === 'failed').length
  };

  return (
    <DashboardLayout title="Activity" subtitle="Track all your cross-chain transactions and agent actions">
      <div className="space-y-8">
        {/* Activity Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <ActivityIcon className="h-5 w-5 text-scale-gray-400" />
                <div>
                  <p className="text-sm text-scale-gray-400">Total Activities</p>
                  <p className="text-2xl font-bold text-foreground">{activityCounts.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-scale-gray-400">Confirmed</p>
                  <p className="text-2xl font-bold text-foreground">{activityCounts.confirmed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-scale-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-foreground">{activityCounts.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-scale-gray-400">Failed</p>
                  <p className="text-2xl font-bold text-foreground">{activityCounts.failed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-card border-scale-gray-800">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-foreground">Activity History</CardTitle>
                <CardDescription className="text-scale-gray-400">
                  Monitor all transactions, agent actions, and system events
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="border-scale-gray-700">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-scale-gray-400" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-scale-gray-900 border-scale-gray-700 text-foreground"
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-48 bg-scale-gray-900 border-scale-gray-700 text-foreground">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-scale-gray-800">
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="agent-execution">Agent Executions</SelectItem>
                  <SelectItem value="bridge">Cross-Chain Bridges</SelectItem>
                  <SelectItem value="swap">Token Swaps</SelectItem>
                  <SelectItem value="transfer">Transfers</SelectItem>
                  <SelectItem value="agent-deployment">Agent Deployments</SelectItem>
                  <SelectItem value="strategy-update">Strategy Updates</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32 bg-scale-gray-900 border-scale-gray-700 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-scale-gray-800">
                  <SelectItem value="1d">Today</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                  <SelectItem value="90d">90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Activity List */}
            <div className="space-y-4">
              {filteredActivities.length === 0 ? (
                <div className="text-center py-8">
                  <ActivityIcon className="h-12 w-12 text-scale-gray-500 mx-auto mb-4" />
                  <p className="text-scale-gray-400">No activities found matching your criteria</p>
                </div>
              ) : (
                filteredActivities.map((activity) => (
                  <div 
                    key={activity.id} 
                    className="flex items-center justify-between p-4 bg-scale-gray-900/50 rounded-lg hover:bg-scale-gray-900/70 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-scale-gray-800 rounded-lg">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-foreground">{activity.description}</p>
                          <Badge variant="outline" className="text-xs border-scale-gray-600">
                            {activity.type.replace('-', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-sm text-scale-gray-400">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                          {activity.chain && (
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-scale-gray-500">{activity.chain}</span>
                              {activity.toChain && (
                                <>
                                  <ArrowRight className="h-3 w-3 text-scale-gray-500" />
                                  <span className="text-xs text-scale-gray-500">{activity.toChain}</span>
                                </>
                              )}
                            </div>
                          )}
                          {activity.amount > 0 && (
                            <p className="text-sm text-scale-gray-400">
                              {activity.amount} {activity.asset}
                            </p>
                          )}
                        </div>
                        {activity.hash && (
                          <p className="text-xs text-scale-gray-500 mt-1 font-mono">
                            {activity.hash}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(activity.status)}
                        <Badge 
                          variant={activity.status === 'confirmed' ? 'default' : 
                                  activity.status === 'pending' ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {activity.status}
                        </Badge>
                      </div>
                      {activity.fee && (
                        <p className="text-xs text-scale-gray-500">
                          Fee: ${activity.fee.toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}