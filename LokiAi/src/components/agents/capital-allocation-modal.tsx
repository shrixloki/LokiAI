/**
 * Capital Allocation Modal
 * USD → ETH → MetaMask → Sepolia transaction flow for yield optimizer agents
 */

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Wallet, 
  DollarSign, 
  ArrowRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  TrendingUp
} from 'lucide-react'
import { capitalAllocationService } from '@/services/capital-allocation'

interface Agent {
  id: string
  type: string
  name: string
  description?: string
}

interface CapitalAllocationModalProps {
  isOpen: boolean
  agent: Agent | null
  onClose: () => void
  onAllocationComplete: (result: any) => void
}

interface AllocationStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'active' | 'completed' | 'error'
  data?: any
}

export function CapitalAllocationModal({ 
  isOpen, 
  agent, 
  onClose, 
  onAllocationComplete 
}: CapitalAllocationModalProps) {
  const [usdAmount, setUsdAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)

  const [steps, setSteps] = useState<AllocationStep[]>([
    {
      id: 'connect',
      title: 'Check MetaMask',
      description: 'Verify wallet connection and network',
      status: 'pending'
    },
    {
      id: 'prepare',
      title: 'Prepare Allocation',
      description: 'Convert USD to ETH and prepare transaction',
      status: 'pending'
    },
    {
      id: 'execute',
      title: 'Execute Transaction',
      description: 'Send transaction via MetaMask',
      status: 'pending'
    },
    {
      id: 'confirm',
      title: 'Confirm on Blockchain',
      description: 'Wait for Sepolia confirmation',
      status: 'pending'
    }
  ])

  useEffect(() => {
    if (isOpen && agent) {
      resetSteps()
    }
  }, [isOpen, agent])

  const resetSteps = () => {
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending', data: undefined })))
    setCurrentStep(0)
    setIsProcessing(false)
    setError('')
    setResult(null)
  }

  const updateStepStatus = (stepIndex: number, status: AllocationStep['status'], data?: any) => {
    setSteps(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, status, data } : step
    ))
  }

  const handleAllocate = async () => {
    if (!agent || !usdAmount) return

    const amount = parseFloat(usdAmount)
    if (amount <= 0) {
      setError('Please enter a valid USD amount')
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      const result = await capitalAllocationService.allocateCapital(
        amount,
        agent.id,
        (step: string, data?: any) => {
          console.log(`📊 Progress: ${step}`, data)
          
          // Update step status based on progress
          if (step.includes('MetaMask')) {
            setCurrentStep(0)
            updateStepStatus(0, 'active')
          } else if (step.includes('Preparing')) {
            updateStepStatus(0, 'completed')
            setCurrentStep(1)
            updateStepStatus(1, 'active', data)
          } else if (step.includes('Executing')) {
            updateStepStatus(1, 'completed')
            setCurrentStep(2)
            updateStepStatus(2, 'active', data)
          } else if (step.includes('Confirming')) {
            updateStepStatus(2, 'completed')
            setCurrentStep(3)
            updateStepStatus(3, 'active', data)
          } else if (step.includes('completed')) {
            updateStepStatus(3, 'completed', data)
          }
        }
      )

      setResult(result)
      onAllocationComplete(result)
      console.log('✅ Capital allocation completed:', result)

    } catch (error) {
      console.error('❌ Capital allocation failed:', error)
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
      updateStepStatus(currentStep, 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStepIcon = (step: AllocationStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'active':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  const getProgressPercentage = () => {
    const completedSteps = steps.filter(step => step.status === 'completed').length
    return (completedSteps / steps.length) * 100
  }

  if (!agent) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Allocate Capital to {agent.name}</span>
          </DialogTitle>
          <DialogDescription>
            Convert USD to ETH and allocate funds to your yield optimizer agent on Sepolia testnet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Agent Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Agent Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Agent Type</span>
                <Badge variant="outline">{agent.type}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Network</span>
                <Badge variant="secondary">Sepolia Testnet</Badge>
              </div>
              {agent.description && (
                <div className="text-sm text-muted-foreground">
                  {agent.description}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Allocation Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Capital Allocation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usd-amount">Amount (USD)</Label>
                <Input
                  id="usd-amount"
                  type="number"
                  step="0.01"
                  min="1"
                  value={usdAmount}
                  onChange={(e) => setUsdAmount(e.target.value)}
                  placeholder="50.00"
                  disabled={isProcessing}
                />
                <div className="text-sm text-muted-foreground">
                  Minimum allocation: $1.00
                </div>
              </div>

              {usdAmount && parseFloat(usdAmount) > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span>USD Amount:</span>
                    <span className="font-medium">${parseFloat(usdAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-center my-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Estimated ETH:</span>
                    <span className="font-medium">~{(parseFloat(usdAmount) / 1500).toFixed(6)} ETH</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    *Rate will be fetched from CoinGecko at execution time
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Steps */}
          {isProcessing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Allocation Progress</span>
                  <span className="text-sm font-normal">{Math.round(getProgressPercentage())}%</span>
                </CardTitle>
                <Progress value={getProgressPercentage()} className="w-full" />
              </CardHeader>
              <CardContent className="space-y-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-start space-x-3">
                    {getStepIcon(step)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${step.status === 'active' ? 'text-blue-600' : ''}`}>
                          {step.title}
                        </span>
                        {step.status === 'active' && (
                          <Badge variant="outline" className="text-xs">
                            In Progress
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      
                      {/* Step-specific data display */}
                      {step.data && (
                        <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                          {step.id === 'prepare' && step.data.ethAmount && (
                            <div>Converting ${step.data.usdAmount} → {step.data.ethAmount} ETH</div>
                          )}
                          {step.id === 'execute' && step.data.agentWallet && (
                            <div>Sending to: {step.data.agentWallet}</div>
                          )}
                          {step.id === 'confirm' && step.data.txHash && (
                            <div className="flex items-center space-x-1">
                              <span>TX: {step.data.txHash.slice(0, 10)}...</span>
                              <ExternalLink className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Success Result */}
          {result && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span>Allocation Successful!</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Transaction Hash:</span>
                    <div className="font-mono text-xs break-all">
                      {result.confirmation.txHash}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Block Number:</span>
                    <div className="font-medium">{result.confirmation.blockNumber}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ETH Allocated:</span>
                    <div className="font-medium">{result.allocation.ethAmount} ETH</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Agent Balance:</span>
                    <div className="font-medium">{result.allocation.agentBalance} ETH</div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(result.confirmation.explorerUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Sepolia Etherscan
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Alert className="border-red-500/30 bg-red-500/10">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <AlertDescription className="text-red-700">
                <strong>Allocation Failed:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Info Alert */}
          <Alert>
            <Wallet className="w-4 h-4" />
            <AlertDescription>
              <strong>Note:</strong> This will send real ETH on Sepolia testnet to your agent wallet. 
              Make sure you have sufficient testnet ETH and are connected to the correct network.
            </AlertDescription>
          </Alert>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          
          {!result && (
            <Button 
              onClick={handleAllocate} 
              disabled={!usdAmount || parseFloat(usdAmount) <= 0 || isProcessing}
              className="min-w-[140px]"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Allocate Capital
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}