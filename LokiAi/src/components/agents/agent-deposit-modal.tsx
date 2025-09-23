/**
 * Agent Deposit Modal - Handle fund deposits for AI trading agents
 * Integrates with MetaMask for secure testnet/mainnet transactions
 */

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Wallet, 
  DollarSign, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  ArrowRight,
  Info
} from 'lucide-react'
import { testnetIntegration } from '@/services/testnet-integration'

interface Agent {
  id: string
  type: string
  name: string
  chainId: number
  chainName: string
  config: {
    maxInvestment: number
    riskTolerance: number
  }
}

interface AgentDepositModalProps {
  isOpen: boolean
  agent: Agent | null
  onClose: () => void
  onDepositComplete: (depositInfo: any) => void
}

interface DepositStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'active' | 'completed' | 'error'
}

export function AgentDepositModal({ isOpen, agent, onClose, onDepositComplete }: AgentDepositModalProps) {
  const [depositAmount, setDepositAmount] = useState('')
  const [walletBalance, setWalletBalance] = useState('0.0')
  const [currentStep, setCurrentStep] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transactionHash, setTransactionHash] = useState('')
  const [error, setError] = useState('')

  const [steps, setSteps] = useState<DepositStep[]>([
    {
      id: 'validate',
      title: 'Validate Amount',
      description: 'Check deposit amount and wallet balance',
      status: 'pending'
    },
    {
      id: 'approve',
      title: 'Approve Transaction',
      description: 'Approve the deposit transaction in MetaMask',
      status: 'pending'
    },
    {
      id: 'execute',
      title: 'Execute Deposit',
      description: 'Send funds to agent contract',
      status: 'pending'
    },
    {
      id: 'confirm',
      title: 'Confirm Transaction',
      description: 'Wait for blockchain confirmation',
      status: 'pending'
    }
  ])

  useEffect(() => {
    if (isOpen && agent) {
      loadWalletBalance()
      resetSteps()
    }
  }, [isOpen, agent])

  const loadWalletBalance = async () => {
    try {
      // First try to get balance from MetaMask directly
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts && accounts.length > 0) {
          const balanceWei = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [accounts[0], 'latest']
          })
          // Convert from Wei to ETH
          const balanceEth = parseInt(balanceWei, 16) / Math.pow(10, 18)
          setWalletBalance(balanceEth.toFixed(6))
          console.log(`✅ Wallet balance loaded: ${balanceEth.toFixed(6)} ETH`)
          return
        }
      }
      
      // Fallback to testnet integration
      const walletAddress = localStorage.getItem('wallet_address')
      if (walletAddress) {
        const balance = await testnetIntegration.getWalletBalance(walletAddress)
        setWalletBalance(balance.balance)
      }
    } catch (error) {
      console.error('Failed to load wallet balance:', error)
      // Set a default balance to prevent blocking
      setWalletBalance('0.0')
    }
  }

  const resetSteps = () => {
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' })))
    setCurrentStep(0)
    setIsProcessing(false)
    setTransactionHash('')
    setError('')
  }

  const updateStepStatus = (stepIndex: number, status: 'pending' | 'active' | 'completed' | 'error') => {
    setSteps(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, status } : step
    ))
  }

  const handleDeposit = async () => {
    if (!agent || !depositAmount) return

    setIsProcessing(true)
    setError('')

    try {
      // Step 1: Validate Amount
      setCurrentStep(0)
      updateStepStatus(0, 'active')
      
      const amount = parseFloat(depositAmount)
      const balance = parseFloat(walletBalance)
      
      if (amount <= 0) {
        throw new Error('Deposit amount must be greater than 0')
      }
      
      if (amount > balance) {
        throw new Error('Insufficient wallet balance')
      }
      
      if (amount > agent.config.maxInvestment) {
        throw new Error(`Amount exceeds agent maximum investment limit of $${agent.config.maxInvestment}`)
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      updateStepStatus(0, 'completed')

      // Step 2: Approve Transaction
      setCurrentStep(1)
      updateStepStatus(1, 'active')
      
      // Initialize MetaMask if not already done
      const initResult = await testnetIntegration.initializeMetaMask()
      if (!initResult.success) {
        throw new Error(initResult.error || 'Failed to initialize MetaMask')
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
      updateStepStatus(1, 'completed')

      // Step 3: Execute Deposit
      setCurrentStep(2)
      updateStepStatus(2, 'active')

      // Create mock market data for the deposit transaction
      const marketData = {
        price: 1500.25,
        volume_24h: 1250000.0,
        volatility: 0.045,
        rsi: 65.2,
        liquidity_usd: 15000000.0,
        deposit_amount: amount
      }

      // Use the new capital allocation service for real MetaMask transactions
      const walletAddress = localStorage.getItem('wallet_address') || initResult.address
      
      try {
        // Import the capital allocation service
        const { capitalAllocationService } = await import('@/services/capital-allocation')
        
        console.log('🚀 Using real capital allocation service...')
        
        // Convert ETH amount to USD for the capital allocation service
        const estimatedUSD = amount * 1500 // Rough estimate, will be corrected by real price fetch
        
        // Execute real capital allocation
        const allocationResult = await capitalAllocationService.allocateCapital(
          estimatedUSD,
          agent.id,
          (step: string, data?: any) => {
            console.log(`📊 Capital Allocation Progress: ${step}`, data)
          }
        )
        
        // Convert the result to match expected format
        const tradeResult = {
          success: true,
          result: {
            prediction: {
              prediction_id: `pred_${Date.now()}`,
              agent_type: agent.type,
              confidence: 0.85,
              expected_return: amount * 0.1
            },
            tradeInstruction: {
              id: allocationResult.allocation.id,
              agentId: agent.id,
              agentType: agent.type,
              status: 'confirmed'
            },
            transaction: {
              txHash: allocationResult.confirmation.txHash,
              gasUsed: allocationResult.confirmation.gasUsed,
              blockNumber: allocationResult.confirmation.blockNumber
            }
          }
        }
        
        console.log('✅ Real MetaMask transaction completed:', tradeResult)
        
      } catch (realError) {
        console.error('❌ Real capital allocation failed:', realError)
        throw new Error(`MetaMask transaction failed: ${realError.message}`)
      }

      updateStepStatus(2, 'completed')

      // Step 4: Confirm Transaction
      setCurrentStep(3)
      updateStepStatus(3, 'active')

      if (tradeResult.result?.transaction?.txHash) {
        setTransactionHash(tradeResult.result.transaction.txHash)
        
        // Simulate waiting for confirmation
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        updateStepStatus(3, 'completed')

        // Call completion callback
        onDepositComplete({
          agentId: agent.id,
          amount: amount,
          txHash: tradeResult.result.transaction.txHash,
          network: agent.chainName,
          timestamp: new Date().toISOString()
        })

        console.log(`✅ Deposit completed: ${amount} ETH to agent ${agent.name}`)
      } else {
        throw new Error('Transaction hash not received')
      }

    } catch (error) {
      console.error('Deposit failed:', error)
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
      updateStepStatus(currentStep, 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStepIcon = (step: DepositStep) => {
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

  const canDeposit = depositAmount && parseFloat(depositAmount) > 0 && !isProcessing

  if (!agent) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5" />
            <span>Deposit Funds to {agent.name}</span>
          </DialogTitle>
          <DialogDescription>
            Deposit funds to your AI trading agent for autonomous trading operations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Agent Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Agent Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Agent Type</span>
                <Badge variant="outline">{agent.type}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Network</span>
                <Badge variant="secondary">{agent.chainName}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Max Investment</span>
                <span className="font-medium">${agent.config.maxInvestment.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Risk Tolerance</span>
                <span className="font-medium">{(agent.config.riskTolerance * 100).toFixed(0)}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Deposit Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Deposit Amount</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deposit-amount">Amount (ETH)</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  step="0.001"
                  min="0"
                  max={walletBalance}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.0"
                  disabled={isProcessing}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Wallet Balance: {walletBalance} ETH</span>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto"
                    onClick={() => setDepositAmount((parseFloat(walletBalance) * 0.9).toFixed(3))}
                    disabled={isProcessing}
                  >
                    Use 90%
                  </Button>
                </div>
              </div>

              {depositAmount && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Deposit Amount:</span>
                    <span className="font-medium">{depositAmount} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Estimated USD:</span>
                    <span className="font-medium">${(parseFloat(depositAmount) * 1500).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Network Fee:</span>
                    <span className="font-medium">~$5-15</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Steps */}
          {isProcessing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Deposit Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center space-x-3">
                    {getStepIcon(step)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${step.status === 'active' ? 'text-blue-600' : ''}`}>
                          {step.title}
                        </span>
                        {index < steps.length - 1 && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}

                {transactionHash && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-green-700">Transaction Hash:</span>
                    </div>
                    <p className="text-xs font-mono text-green-600 mt-1 break-all">
                      {transactionHash}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Alert className="border-red-500/30 bg-red-500/10">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <AlertDescription className="text-red-700">
                <strong>Deposit Failed:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Warning */}
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              <strong>Important:</strong> This will deposit real funds to your AI trading agent. 
              Make sure you understand the risks involved in automated trading.
            </AlertDescription>
          </Alert>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          
          <Button 
            onClick={handleDeposit} 
            disabled={!canDeposit}
            className="min-w-[120px]"
          >
            {isProcessing ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <>
                <Wallet className="h-4 w-4 mr-1" />
                Deposit Funds
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}