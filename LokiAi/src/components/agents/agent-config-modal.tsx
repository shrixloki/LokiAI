/**
 * Agent Configuration Modal - Interface for configuring existing AI trading agents
 * Allows users to modify parameters, view performance, and manage agent settings
 */

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Settings, 
  TrendingUp, 
  AlertTriangle, 
  Save, 
  RotateCcw,
  Activity,
  DollarSign,
  Target,
  Shield,
  Zap,
  BarChart3,
  Clock,
  CheckCircle
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Agent {
  id: string
  type: 'yield' | 'arbitrage' | 'portfolio' | 'risk'
  name: string
  description: string
  status: 'active' | 'paused' | 'stopped' | 'error'
  chainId: number
  chainName: string
  performance: {
    totalTrades: number
    successRate: number
    totalProfit: number
    roi: number
    sharpeRatio: number
    maxDrawdown: number
  }
  lastAction: {
    type: string
    timestamp: number
    result: 'success' | 'failed' | 'pending'
  }
  config: {
    maxInvestment: number
    riskTolerance: number
    autoExecute: boolean
  }
}

interface AgentConfigModalProps {
  isOpen: boolean
  agent: Agent
  onClose: () => void
  onSave: (updatedAgent: Agent) => void
}

export function AgentConfigModal({ isOpen, agent, onClose, onSave }: AgentConfigModalProps) {
  const [config, setConfig] = useState(agent.config)
  const [name, setName] = useState(agent.name)
  const [description, setDescription] = useState(agent.description)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Performance data for chart
  const performanceData = [
    { date: '1W', profit: agent.performance.totalProfit * 0.1, trades: Math.floor(agent.performance.totalTrades * 0.1) },
    { date: '2W', profit: agent.performance.totalProfit * 0.3, trades: Math.floor(agent.performance.totalTrades * 0.3) },
    { date: '3W', profit: agent.performance.totalProfit * 0.6, trades: Math.floor(agent.performance.totalTrades * 0.6) },
    { date: '4W', profit: agent.performance.totalProfit, trades: agent.performance.totalTrades }
  ]

  useEffect(() => {
    const configChanged = JSON.stringify(config) !== JSON.stringify(agent.config)
    const nameChanged = name !== agent.name
    const descChanged = description !== agent.description
    
    setHasChanges(configChanged || nameChanged || descChanged)
  }, [config, name, description, agent])

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const updatedAgent: Agent = {
        ...agent,
        name,
        description,
        config
      }
      
      onSave(updatedAgent)
    } catch (error) {
      console.error('Failed to save agent configuration:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setConfig(agent.config)
    setName(agent.name)
    setDescription(agent.description)
  }

  const updateConfig = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const getAgentIcon = () => {
    switch (agent.type) {
      case 'yield': return <TrendingUp className="h-5 w-5" />
      case 'arbitrage': return <Zap className="h-5 w-5" />
      case 'portfolio': return <BarChart3 className="h-5 w-5" />
      case 'risk': return <Shield className="h-5 w-5" />
      default: return <Settings className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500'
      case 'paused': return 'text-yellow-500'
      case 'stopped': return 'text-gray-500'
      case 'error': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getRiskLevel = (tolerance: number) => {
    if (tolerance <= 0.2) return { level: 'Conservative', color: 'text-green-600' }
    if (tolerance <= 0.4) return { level: 'Moderate', color: 'text-yellow-600' }
    if (tolerance <= 0.6) return { level: 'Aggressive', color: 'text-orange-600' }
    return { level: 'Very Aggressive', color: 'text-red-600' }
  }

  const riskInfo = getRiskLevel(config.riskTolerance)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getAgentIcon()}
            <span>Configure {agent.name}</span>
            <Badge variant="outline" className={getStatusColor(agent.status)}>
              {agent.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Modify agent parameters, monitor performance, and manage settings
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="configuration" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="configuration" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Basic Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="agent-name">Agent Name</Label>
                    <Input
                      id="agent-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agent-description">Description</Label>
                    <Input
                      id="agent-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Agent Type</Label>
                    <div className="flex items-center space-x-2">
                      {getAgentIcon()}
                      <span className="font-medium capitalize">{agent.type}</span>
                      <Badge variant="secondary">{agent.chainName}</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Last Action</Label>
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-sm">{agent.lastAction.type}</span>
                      <div className="flex items-center space-x-2">
                        {agent.lastAction.result === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {agent.lastAction.result === 'failed' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        {agent.lastAction.result === 'pending' && <Clock className="h-4 w-4 text-yellow-500" />}
                        <span className="text-xs text-muted-foreground">
                          {new Date(agent.lastAction.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trading Parameters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-4 w-4" />
                    <span>Trading Parameters</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-investment">Maximum Investment ($)</Label>
                    <Input
                      id="max-investment"
                      type="number"
                      value={config.maxInvestment}
                      onChange={(e) => updateConfig('maxInvestment', parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Current allocation: ${(config.maxInvestment * 0.7).toLocaleString()} (70% utilized)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="risk-tolerance">Risk Tolerance</Label>
                    <div className="space-y-2">
                      <Input
                        id="risk-tolerance"
                        type="range"
                        min="0.1"
                        max="0.8"
                        step="0.1"
                        value={config.riskTolerance}
                        onChange={(e) => updateConfig('riskTolerance', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {(config.riskTolerance * 100).toFixed(0)}%
                        </span>
                        <Badge variant="outline" className={riskInfo.color}>
                          {riskInfo.level}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-execute">Auto Execute Trades</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically execute trades when conditions are met
                      </p>
                    </div>
                    <Switch
                      id="auto-execute"
                      checked={config.autoExecute}
                      onCheckedChange={(checked) => updateConfig('autoExecute', checked)}
                    />
                  </div>

                  {!config.autoExecute && (
                    <Alert className="border-yellow-500/30 bg-yellow-500/10">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <AlertDescription className="text-sm">
                        Manual mode: Agent will analyze opportunities but require manual approval for execution.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Risk Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Risk Assessment</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Portfolio Risk</span>
                      <span className="text-sm font-medium">{riskInfo.level}</span>
                    </div>
                    <Progress value={config.riskTolerance * 100} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Max Drawdown</span>
                      <span className="text-sm font-medium">{agent.performance.maxDrawdown.toFixed(1)}%</span>
                    </div>
                    <Progress value={agent.performance.maxDrawdown * 10} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Sharpe Ratio</span>
                      <span className="text-sm font-medium">{agent.performance.sharpeRatio.toFixed(2)}</span>
                    </div>
                    <Progress value={Math.min(100, agent.performance.sharpeRatio * 40)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ${agent.performance.totalProfit.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ROI: {agent.performance.roi.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {agent.performance.successRate.toFixed(1)}%
                  </div>
                  <Progress value={agent.performance.successRate} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {agent.performance.totalTrades}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Avg: {Math.floor(agent.performance.totalTrades / 30)} per day
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {agent.performance.sharpeRatio.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Risk-adjusted return
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Over Time</CardTitle>
                <CardDescription>Profit and trade volume trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#8884d8" 
                      name="Profit ($)" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest agent actions and results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { action: 'Stake USDC', result: 'success', profit: 45.32, time: '2 hours ago' },
                    { action: 'Compound rewards', result: 'success', profit: 12.18, time: '4 hours ago' },
                    { action: 'Migrate to Aave', result: 'success', profit: 78.94, time: '6 hours ago' },
                    { action: 'Risk assessment', result: 'success', profit: 0, time: '8 hours ago' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{activity.action}</span>
                      </div>
                      <div className="text-right">
                        {activity.profit > 0 && (
                          <div className="text-sm font-medium text-green-600">
                            +${activity.profit.toFixed(2)}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {activity.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Alert className="border-red-500/30 bg-red-500/10">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <AlertDescription>
                <strong>Warning:</strong> Advanced settings can significantly impact agent performance. 
                Only modify these settings if you understand the implications.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Advanced Configuration</CardTitle>
                <CardDescription>
                  Fine-tune agent behavior and execution parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Gas Limit</Label>
                    <Input type="number" defaultValue="300000" />
                    <p className="text-xs text-muted-foreground">
                      Maximum gas limit for transactions
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Slippage Tolerance (%)</Label>
                    <Input type="number" step="0.1" defaultValue="0.5" />
                    <p className="text-xs text-muted-foreground">
                      Maximum acceptable slippage
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Rebalance Frequency</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Stop Loss (%)</Label>
                    <Input type="number" step="0.1" defaultValue="5.0" />
                    <p className="text-xs text-muted-foreground">
                      Automatic stop loss threshold
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Emergency Stop</Label>
                      <p className="text-xs text-muted-foreground">
                        Immediately halt all agent activities
                      </p>
                    </div>
                    <Button variant="destructive" size="sm">
                      Emergency Stop
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Reset to Defaults</Label>
                      <p className="text-xs text-muted-foreground">
                        Restore all settings to default values
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Reset Defaults
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || isSaving}
              className="min-w-[100px]"
            >
              {isSaving ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}