import { useState, useEffect } from 'react';
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
  Activity,
  RefreshCw,
  Wallet as WalletIcon
} from 'lucide-react';
import { fetchAgents, runAgent, toggleAgentStatus, configureAgent, AgentData } from '@/services/agents-service';
import { useToast } from '@/hooks/use-toast';
import { useMetaMask } from '@/hooks/useMetaMask';
import { useSocket } from '@/hooks/useSocket';

export default function AIAgents() {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningAgents, setRunningAgents] = useState<Set<string>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAgentConfig, setNewAgentConfig] = useState({
    name: '',
    type: 'yield-optimizer',
    riskLevel: 'medium' as 'low' | 'medium' | 'high',
    chains: [] as string[]
  });
  const { toast } = useToast();
  const { isConnected, account, connect, isInstalled } = useMetaMask();
  const { subscribeToAgentUpdates, unsubscribe } = useSocket(account);

  // Fetch agents when wallet is connected
  useEffect(() => {
    if (isConnected && account) {
      loadAgents();
    }
  }, [isConnected, account]);

  // Subscribe to real-time agent updates
  useEffect(() => {
    if (account) {
      subscribeToAgentUpdates((data) => {
        console.log('📡 Received agent update:', data);
        
        // Update specific agent in the list
        setAgents(prevAgents => 
          prevAgents.map(agent => 
            agent.type === data.agentType 
              ? { 
                  ...agent, 
                  pnl: data.pnl || agent.pnl,
                  apy: data.bestAPY || data.apy || agent.apy,
                  trades: data.transactions || agent.trades,
                  lastUpdated: data.timestamp || new Date().toISOString()
                }
              : agent
          )
        );
        
        // Show toast notification for significant updates
        if (data.pnl && Math.abs(data.pnl) > 10) {
          toast({
            title: "Agent Update",
            description: `${data.agentType} agent: ${data.pnl > 0 ? '+' : ''}$${data.pnl.toFixed(2)} P&L`,
          });
        }
      });
    }

    return () => {
      unsubscribe('agent:update');
    };
  }, [account, subscribeToAgentUpdates, unsubscribe, toast]);

  const loadAgents = async () => {
    if (!account) return;

    setLoading(true);
    try {
      console.log('🤖 Fetching agents for:', account);
      const agentData = await fetchAgents(account);
      setAgents(agentData);
      console.log('✅ Agents loaded:', agentData.length);
    } catch (error) {
      console.error('❌ Failed to load agents:', error);
      toast({
        title: 'Failed to load agents',
        description: 'Could not fetch agent data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    if (!isInstalled) {
      toast({
        title: 'MetaMask Not Found',
        description: 'Please install MetaMask to connect your wallet.',
        variant: 'destructive',
      });
      window.open('https://metamask.io/download/', '_blank');
      return;
    }
    
    try {
      await connect();
      toast({
        title: 'Wallet Connected',
        description: 'Successfully connected to MetaMask',
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleCreateAgent = async () => {
    if (!newAgentConfig.name || !account) {
      toast({
        title: "Error",
        description: "Please provide a name for your agent and ensure wallet is connected.",
        variant: "destructive"
      });
      return;
    }

    try {
      await configureAgent(account, newAgentConfig.type, {
        name: newAgentConfig.name,
        riskLevel: newAgentConfig.riskLevel,
        chains: newAgentConfig.chains
      });
      
      toast({
        title: "Agent Created",
        description: `${newAgentConfig.name} has been deployed successfully.`,
      });
      
      setIsCreateModalOpen(false);
      setNewAgentConfig({
        name: '',
        type: 'yield-optimizer',
        riskLevel: 'medium',
        chains: []
      });
      
      // Reload agents
      await loadAgents();
      
    } catch (error) {
      toast({
        title: "Failed to Create Agent",
        description: "Could not deploy the agent. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRunAgent = async (agentType: string, agentName: string) => {
    if (!account) return;
    
    const agentKey = `${agentType}-${agentName}`;
    setRunningAgents(prev => new Set(prev).add(agentKey));
    
    try {
      toast({
        title: "Agent Starting",
        description: `${agentName} is analyzing opportunities...`,
      });
      
      const result = await runAgent(account, agentType);
      
      if (result.success) {
        toast({
          title: "Agent Execution Complete",
          description: `${agentName} found ${result.opportunities || 0} opportunities. P&L: $${result.pnl?.toFixed(2) || '0.00'}`,
        });
        
        // Reload agents to show updated performance
        await loadAgents();
      } else {
        throw new Error(result.error || 'Agent execution failed');
      }
      
    } catch (error) {
      console.error('Agent execution failed:', error);
      toast({
        title: "Agent Execution Failed",
        description: "Could not execute agent. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRunningAgents(prev => {
        const newSet = new Set(prev);
        newSet.delete(agentKey);
        return newSet;
      });
    }
  };

  const handleToggleAgent = async (agentType: string, currentStatus: string) => {
    if (!account) return;
    
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      await toggleAgentStatus(account, agentType, newStatus);
      
      toast({
        title: "Agent Status Updated",
        description: `Agent is now ${newStatus}.`,
      });
      
      // Reload agents
      await loadAgents();
      
    } catch (error) {
      toast({
        title: "Failed to Update Agent",
        description: "Could not change agent status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'stopped': return 'bg-gray-500';
      case 'training': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'yield-optimizer': return '💰';
      case 'arbitrage': return '⚡';
      case 'portfolio-rebalancer': return '⚖️';
      case 'risk-manager': return '🛡️';
      default: return '🤖';
    }
  };

  // Show wallet connection prompt if not connected
  if (!isConnected) {
    return (
      <DashboardLayout title="AI Agents" subtitle="Connect your wallet to view agents">
        <Card className="bg-card border-scale-gray-800">
          <CardContent className="py-12">
            <div className="text-center">
              <WalletIcon className="h-16 w-16 mx-auto mb-4 text-scale-gray-600" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Wallet Not Connected</h3>
              <p className="text-scale-gray-400 mb-4">
                Please connect your MetaMask wallet to view and manage your AI agents.
              </p>
              <Button onClick={handleConnectWallet} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <WalletIcon className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <DashboardLayout title="AI Agents" subtitle="Loading agents...">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-scale-gray-400" />
        </div>
      </DashboardLayout>
    );
  }

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
                    +${agents.reduce((sum, a) => sum + a.pnl, 0).toLocaleString()}
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
                    {agents.length > 0 ? (agents.reduce((sum, a) => sum + a.winRate, 0) / agents.length).toFixed(1) : '0.0'}%
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
            <p className="text-scale-gray-400">Real-time performance from MongoDB</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAgents}
              className="border-scale-gray-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
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
                    onValueChange={(value: string) => 
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
        </div>

        {/* Agents Grid */}
        {agents.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {agents.map((agent, index) => (
              <Card key={`${agent.name}-${index}`} className="bg-card border-scale-gray-800">
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
                        onClick={() => handleRunAgent(agent.type, agent.name)}
                        disabled={runningAgents.has(`${agent.type}-${agent.name}`)}
                        className="text-green-500 hover:text-green-400"
                      >
                        {runningAgents.has(`${agent.type}-${agent.name}`) ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAgent(agent.type, agent.status)}
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
                      <p className={`text-lg font-semibold ${agent.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {agent.pnl >= 0 ? '+' : ''}${agent.pnl.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-scale-gray-400">APY</p>
                      <p className="text-lg font-semibold text-foreground">{agent.apy.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-scale-gray-400">Win Rate</p>
                      <div className="flex items-center space-x-2">
                        <Progress value={agent.winRate} className="flex-1 h-2" />
                        <span className="text-sm text-foreground">{agent.winRate.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-scale-gray-400">Total Trades</p>
                      <p className="text-lg font-semibold text-foreground">{agent.trades}</p>
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
                  {agent.config?.riskLevel && (
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
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card border-scale-gray-800">
            <CardContent className="py-12">
              <div className="text-center">
                <Bot className="h-16 w-16 mx-auto mb-4 text-scale-gray-600" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Agents Found</h3>
                <p className="text-scale-gray-400 mb-4">
                  You haven't deployed any AI agents yet.
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Agent
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}