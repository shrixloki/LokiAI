/**
 * Agent Deployment Modal - Interface for deploying new AI trading agents
 * Provides configuration options for different agent types and chains
 */

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  TrendingUp, 
  Zap, 
  BarChart3, 
  Shield, 
  Info, 
  DollarSign, 
  Target, 
  Settings,
  Coins,
  AlertTriangle
} from 'lucide-react'

interface AgentConfig {
  type: 'yield' | 'arbitrage' | 'portfolio' | 'risk'
  name: string
  description: string
  chainId: number
  parameters: {
    maxInvestment: number
    riskTolerance: number
    minProfitThreshold: number
    gasLimit: number
    autoExecute: boolean
  }
}

interface AgentDeploymentModalProps {
  isOpen: boolean
  onClose: () => void
  onDeploy: (config: AgentConfig) => void
}

const agentTypes = [
  {
    type: 'yield' as const,
    name: 'Yield Optimizer',
    description: 'Maximizes yield across DeFi protocols using reinforcement learning',
    icon: <TrendingUp className="h-6 w-6" />,
    features: [
      'Automated yield farming',
      'Protocol risk assessment',
      'Compound optimization',
      'Gas-efficient execution'
    ],
    estimatedAPY: '12-25%',
    riskLevel: 'Medium',
    complexity: 'Advanced'
  },
  {
    type: 'arbitrage' as const,
    name: 'Arbitrage Bot',
    description: 'Exploits price differences across exchanges and chains',
    icon: <Zap className="h-6 w-6" />,
    features: [
      'Cross-DEX arbitrage',
      'MEV protection',
      'Flash loan integration',
      'Real-time execution'
    ],
    estimatedAPY: '8-18%',
    riskLevel: 'Low-Medium',
    complexity: 'Expert'
  },
  {
    type: 'portfolio' as const,
    name: 'Portfolio Rebalancer',
    description: 'Maintains optimal portfolio allocation using modern portfolio theory',
    icon: <BarChart3 className="h-6 w-6" />,
    features: [
      'Dynamic rebalancing',
      'Risk-adjusted returns',
      'Correlation analysis',
      'Tax optimization'
    ],
    estimatedAPY: '10-20%',
    riskLevel: 'Medium',
    complexity: 'Intermediate'
  },
  {
    type: 'risk' as const,
    name: 'Risk Manager',
    description: 'Monitors and mitigates portfolio risks with real-time analysis',
    icon: <Shield className="h-6 w-6" />,
    features: [
      'Real-time monitoring',
      'Stop-loss automation',
      'Volatility alerts',
      'Emergency exits'
    ],
    estimatedAPY: 'N/A (Protection)',
    riskLevel: 'Low',
    complexity: 'Beginner'
  }
]

const supportedChains = [
  { id: 1, name: 'Ethereum', symbol: 'ETH', gasPrice: 'High', tvl: '$50B+' },
  { id: 137, name: 'Polygon', symbol: 'MATIC', gasPrice: 'Low', tvl: '$5B+' },
  { id: 42161, name: 'Arbitrum', symbol: 'ETH', gasPrice: 'Medium', tvl: '$8B+' },
  { id: 56, name: 'BSC', symbol: 'BNB', gasPrice: 'Low', tvl: '$12B+' }
]

export function AgentDeploymentModal({ isOpen, onClose, onDeploy }: AgentDeploymentModalProps) {
  const [selectedType, setSelectedType] = useState<string>('')
  const [config, setConfig] = useState<Partial<AgentConfig>>({
    name: '',
    description: '',
    chainId: 1,
    parameters: {
      maxInvestment: 10000,
      riskTolerance: 0.3,
      minProfitThreshold: 0.005,
      gasLimit: 300000,
      autoExecute: false
    }
  })
  const [isDeploying, setIsDeploying] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const selectedAgentType = agentTypes.find(t => t.type === selectedType)
  const selectedChain = supportedChains.find(c => c.id === config.chainId)

  const handleDeploy = async () => {
    if (!selectedType || !config.name) return

    setIsDeploying(true)

    try {
      // Simulate deployment process
      await new Promise(resolve => setTimeout(resolve, 2000))

      const fullConfig: AgentConfig = {
        type: selectedType as any,
        name: config.name!,
        description: config.description || selectedAgentType?.description || '',
        chainId: config.chainId!,
        parameters: config.parameters!
      }

      onDeploy(fullConfig)
    } catch (error) {
      console.error('Deployment failed:', error)
    } finally {
      setIsDeploying(false)
    }
  }

  const updateParameter = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters!,
        [key]: value
      }
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Deploy AI Trading Agent</span>
          </DialogTitle>
          <DialogDescription>
            Configure and deploy an autonomous trading agent to execute strategies across DeFi protocols
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentStep.toString()} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="1" onClick={() => setCurrentStep(1)}>
              1. Select Agent Type
            </TabsTrigger>
            <TabsTrigger value="2" onClick={() => setCurrentStep(2)} disabled={!selectedType}>
              2. Configure Parameters
            </TabsTrigger>
            <TabsTrigger value="3" onClick={() => setCurrentStep(3)} disabled={!selectedType || !config.name}>
              3. Review & Deploy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="1" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agentTypes.map((agent) => (
                <Card 
                  key={agent.type}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedType === agent.type ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedType(agent.type)}
                >
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {agent.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                        <CardDescription>{agent.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Est. APY</span>
                      <Badge variant="secondary">{agent.estimatedAPY}</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Risk Level</span>
                      <Badge variant={agent.riskLevel.includes('Low') ? 'default' : 'destructive'}>
                        {agent.riskLevel}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Complexity</span>
                      <Badge variant="outline">{agent.complexity}</Badge>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium">Key Features:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {agent.features.map((feature, index) => (
                          <li key={index} className="flex items-center space-x-1">
                            <span className="w-1 h-1 bg-primary rounded-full" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedType && (
              <div className="flex justify-end">
                <Button onClick={() => setCurrentStep(2)}>
                  Continue to Configuration
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="2" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Info className="h-4 w-4" />
                    <span>Basic Configuration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="agent-name">Agent Name</Label>
                    <Input
                      id="agent-name"
                      placeholder="My Yield Optimizer"
                      value={config.name || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agent-description">Description (Optional)</Label>
                    <Textarea
                      id="agent-description"
                      placeholder="Custom description for this agent..."
                      value={config.description || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chain-select">Blockchain Network</Label>
                    <Select 
                      value={config.chainId?.toString()} 
                      onValueChange={(value) => setConfig(prev => ({ ...prev, chainId: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select blockchain" />
                      </SelectTrigger>
                      <SelectContent>
                        {supportedChains.map((chain) => (
                          <SelectItem key={chain.id} value={chain.id.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <span>{chain.name}</span>
                              <div className="flex space-x-2 ml-4">
                                <Badge variant="outline" className="text-xs">
                                  Gas: {chain.gasPrice}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  TVL: {chain.tvl}
                                </Badge>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Advanced Parameters */}
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
                      value={config.parameters?.maxInvestment || 0}
                      onChange={(e) => updateParameter('maxInvestment', parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum amount the agent can invest per position
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="risk-tolerance">Risk Tolerance</Label>
                    <Select 
                      value={config.parameters?.riskTolerance?.toString()} 
                      onValueChange={(value) => updateParameter('riskTolerance', parseFloat(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.1">Conservative (10%)</SelectItem>
                        <SelectItem value="0.3">Moderate (30%)</SelectItem>
                        <SelectItem value="0.5">Aggressive (50%)</SelectItem>
                        <SelectItem value="0.7">Very Aggressive (70%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min-profit">Minimum Profit Threshold (%)</Label>
                    <Input
                      id="min-profit"
                      type="number"
                      step="0.001"
                      value={config.parameters?.minProfitThreshold || 0}
                      onChange={(e) => updateParameter('minProfitThreshold', parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum profit percentage required to execute trades
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gas-limit">Gas Limit</Label>
                    <Input
                      id="gas-limit"
                      type="number"
                      value={config.parameters?.gasLimit || 0}
                      onChange={(e) => updateParameter('gasLimit', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-execute">Auto Execute</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically execute trades when conditions are met
                      </p>
                    </div>
                    <Switch
                      id="auto-execute"
                      checked={config.parameters?.autoExecute || false}
                      onCheckedChange={(checked) => updateParameter('autoExecute', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Risk Warning */}
            <Alert className="border-yellow-500/30 bg-yellow-500/10">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <AlertDescription>
                <strong>Risk Warning:</strong> AI trading agents operate autonomously and may result in financial losses. 
                Only invest what you can afford to lose and ensure you understand the risks involved.
              </AlertDescription>
            </Alert>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <Button onClick={() => setCurrentStep(3)} disabled={!config.name}>
                Review Configuration
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="3" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Deployment Summary</CardTitle>
                <CardDescription>
                  Review your agent configuration before deployment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Agent Type</p>
                    <p className="font-medium">{selectedAgentType?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Agent Name</p>
                    <p className="font-medium">{config.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Blockchain</p>
                    <p className="font-medium">{selectedChain?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Max Investment</p>
                    <p className="font-medium">${config.parameters?.maxInvestment?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Risk Tolerance</p>
                    <p className="font-medium">{((config.parameters?.riskTolerance || 0) * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Auto Execute</p>
                    <p className="font-medium">{config.parameters?.autoExecute ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>

                {config.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium">{config.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Estimated Costs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Estimated Costs</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Deployment Gas Fee</span>
                    <span className="font-medium">~$15-50</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Monthly Operation Cost</span>
                    <span className="font-medium">~$25-100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Performance Fee</span>
                    <span className="font-medium">2% of profits</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Back to Configuration
              </Button>
              <Button 
                onClick={handleDeploy} 
                disabled={isDeploying}
                className="min-w-[120px]"
              >
                {isDeploying ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Deploying...</span>
                  </div>
                ) : (
                  'Deploy Agent'
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}