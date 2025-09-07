import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bot, 
  Plus, 
  Play, 
  Pause, 
  Settings, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  Activity
} from 'lucide-react';
import { mockAgents } from '@/data/mockData';
import { AIAgent } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function AIAgents() {
  const [agents, setAgents] = useState(mockAgents);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAgentConfig, setNewAgentConfig] = useState({
    name: '',
    type: 'yield-optimizer' as AIAgent['type'],
    riskLevel: 'medium' as 'low' | 'medium' | 'high',
    chains: [] as string[]
  });
  const { toast } = useToast();

  const handleCreateAgent = () => {
    if (!newAgentConfig.name) {
      toast({
        title: "Error",
        description: "Please provide a name for your agent.",
        variant: "destructive"
      });
      return;
    }

    const newAgent: AIAgent = {
      id: `agent_${Date.now()}`,
      name: newAgentConfig.name,
      type: newAgentConfig.type,
      status: 'active',
      createdAt: new Date().toISOString(),
      performance: {
        totalPnl: 0,
        winRate: 0,
        totalTrades: 0,
        apy: 0
      },
      config: {
        maxSlippage: 0.5,
        minProfitThreshold: 2.0,
        maxGasPrice: 50,
        enabledStrategies: [],
        riskLevel: newAgentConfig.riskLevel
      },
      chains: newAgentConfig.chains.length > 0 ? newAgentConfig.chains : ['ethereum']
    };

    setAgents(prev => [newAgent, ...prev]);
    setIsCreateModalOpen(false);
    setNewAgentConfig({
      name: '',
      type: 'yield-optimizer',
      riskLevel: 'medium',
      chains: []
    });

    toast({
      title: "Agent Created",
      description: `${newAgent.name} has been deployed and is now active.`
    });
  };

  const toggleAgent = (agentId: string) => {
    setAgents(prev => prev.map(agent => {
      if (agent.id === agentId) {
        const newStatus = agent.status === 'active' ? 'paused' : 'active';
        toast({
          title: `Agent ${newStatus === 'active' ? 'Resumed' : 'Paused'}`,
          description: `${agent.name} is now ${newStatus}.`
        });
        return { ...agent, status: newStatus };
      }
      return agent;
    }));
  };

  const getStatusColor = (status: AIAgent['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'stopped': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: AIAgent['type']) => {
    switch (type) {
      case 'yield-optimizer': return '💰';
      case 'arbitrage': return '⚡';
      case 'portfolio-rebalancer': return '⚖️';
      case 'risk-manager': return '🛡️';
      default: return '🤖';
    }
  };

  return (
    <DashboardLayout title="AI Agents" subtitle="Deploy and manage your autonomous trading agents">
      <div className="space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-scale-gray-400" />
                <div>
                  <p className="text-sm text-scale-gray-400">Total Agents</p>
                  <p className="text-2xl font-bold text-foreground">{agents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-scale-gray-400">Active</p>
                  <p className="text-2xl font-bold text-foreground">
                    {agents.filter(a => a.status === 'active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-scale-gray-400">Total P&L</p>
                  <p className="text-2xl font-bold text-green-500">
                    +${agents.reduce((sum, a) => sum + a.performance.totalPnl, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-scale-gray-400" />
                <div>
                  <p className="text-sm text-scale-gray-400">Avg Win Rate</p>
                  <p className="text-2xl font-bold text-foreground">
                    {(agents.reduce((sum, a) => sum + a.performance.winRate, 0) / agents.length).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Your AI Agents</h2>
            <p className="text-scale-gray-400">Manage and monitor your autonomous trading agents</p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Create Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-scale-gray-800">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create New AI Agent</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-scale-gray-300">Agent Name</Label>
                  <Input
                    placeholder="Enter agent name"
                    value={newAgentConfig.name}
                    onChange={(e) => setNewAgentConfig(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-scale-gray-900 border-scale-gray-700 text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-scale-gray-300">Agent Type</Label>
                  <Select 
                    value={newAgentConfig.type} 
                    onValueChange={(value: AIAgent['type']) => 
                      setNewAgentConfig(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger className="bg-scale-gray-900 border-scale-gray-700 text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-scale-gray-800">
                      <SelectItem value="yield-optimizer">Yield Optimizer</SelectItem>
                      <SelectItem value="arbitrage">Arbitrage Bot</SelectItem>
                      <SelectItem value="portfolio-rebalancer">Portfolio Rebalancer</SelectItem>
                      <SelectItem value="risk-manager">Risk Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-scale-gray-300">Risk Level</Label>
                  <Select 
                    value={newAgentConfig.riskLevel} 
                    onValueChange={(value: 'low' | 'medium' | 'high') => 
                      setNewAgentConfig(prev => ({ ...prev, riskLevel: value }))
                    }
                  >
                    <SelectTrigger className="bg-scale-gray-900 border-scale-gray-700 text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-scale-gray-800">
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="medium">Medium Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateAgent} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  Deploy Agent
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {agents.map((agent) => (
            <Card key={agent.id} className="bg-card border-scale-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getTypeIcon(agent.type)}</div>
                    <div>
                      <CardTitle className="text-foreground">{agent.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {agent.type.replace('-', ' ')}
                        </Badge>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                        <span className="text-xs text-scale-gray-500 capitalize">
                          {agent.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAgent(agent.id)}
                      className="text-scale-gray-400 hover:text-foreground"
                    >
                      {agent.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-scale-gray-400 hover:text-foreground"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-scale-gray-400">Total P&L</p>
                    <p className={`text-lg font-semibold ${agent.performance.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {agent.performance.totalPnl >= 0 ? '+' : ''}${agent.performance.totalPnl.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-scale-gray-400">APY</p>
                    <p className="text-lg font-semibold text-foreground">{agent.performance.apy.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-scale-gray-400">Win Rate</p>
                    <div className="flex items-center space-x-2">
                      <Progress value={agent.performance.winRate} className="flex-1 h-2" />
                      <span className="text-sm text-foreground">{agent.performance.winRate.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-scale-gray-400">Total Trades</p>
                    <p className="text-lg font-semibold text-foreground">{agent.performance.totalTrades}</p>
                  </div>
                </div>

                {/* Chain Support */}
                <div>
                  <p className="text-sm text-scale-gray-400 mb-2">Supported Chains</p>
                  <div className="flex flex-wrap gap-2">
                    {agent.chains.map((chain) => (
                      <Badge key={chain} variant="outline" className="text-xs border-scale-gray-600">
                        {chain}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Risk Level */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-scale-gray-400">Risk Level</span>
                  <Badge 
                    variant={agent.config.riskLevel === 'high' ? 'destructive' : 
                           agent.config.riskLevel === 'medium' ? 'secondary' : 'default'}
                    className="text-xs"
                  >
                    {agent.config.riskLevel}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}