/**
 * ETH Deposit Modal - Direct ETH deposits via MetaMask
 * Real MetaMask transactions without USD conversion
 */

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Wallet, 
  ArrowRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Zap
} from 'lucide-react'

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

interface EthDepositModalProps {
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

export function EthDepositModal({ isOpen, agent, onClose, onDepositComplete }: EthDepositModalProps) {
  const [ethAmount, setEthAmount] = useState('')
  const [walletBalance, setWalletBalance] = useState('0.0')
  const [currentStep, setCurrentStep] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transactionHash, setTransactionHash] = useState('')
  const [error, setError] = useState('')

  const [steps, setSteps] = useState<DepositStep[]>([
    {
      id: 'validate',
      title: 'Validate Amount',
      description: 'Check ETH amount and wallet balance',
      status: 'pending'
    },
    {
      id: 'prepare',
      title: 'Prepare Transaction',
      description: 'Prepare MetaMask transaction',
      status: 'pending'
    },
    {
      id: 'execute',
      title: 'Execute Transaction',
      description: 'Send ETH via MetaMask',
      status: 'pending'
    },
    {
      id: 'confirm',
      title: 'Confirm Transaction',
      description: 'Wait for blockchain confirmation',
      status: 'pending'
    }
  ])

  // Agent wallet address (where funds will be sent)
  const AGENT_WALLET = '0x742d35Cc6Cd3B7a8917fe5b3B8b3C9f5d5e5d9a2' // Replace with actual agent wallet

  useEffect(() => {
    if (isOpen && agent) {
      loadWalletBalance()
      resetSteps()
    }
  }, [isOpen, agent])

  const loadWalletBalance = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts && accounts.length > 0) {
          const balanceWei = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [accounts[0], 'latest']
          })
          const balanceEth = parseInt(balanceWei, 16) / Math.pow(10, 18)
          setWalletBalance(balanceEth.toFixed(6))
          console.log(`✅ Wallet balance loaded: ${balanceEth.toFixed(6)} ETH`)
        }
      }
    } catch (error) {
      console.error('Failed to load wallet balance:', error)
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
    if (!agent || !ethAmount) return

    setIsProcessing(true)
    setError('')

    try {
      // Step 1: Validate Amount
      setCurrentStep(0)
      updateStepStatus(0, 'active')
      
      const amount = parseFloat(ethAmount)
      const balance = parseFloat(walletBalance)
      
      if (amount <= 0) {
        throw new Error('ETH amount must be greater than 0')
      }
      
      // Leave 0.01 ETH for gas fees
      const availableBalance = Math.max(0, balance - 0.01)
      
      if (amount > availableBalance) {
        throw new Error(`Insufficient balance. Available: ${availableBalance.toFixed(4)} ETH (${balance.toFixed(4)} ETH - 0.01 gas reserve)`)
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      updateStepStatus(0, 'completed')

      // Step 2: Prepare Transaction
      setCurrentStep(1)
      updateStepStatus(1, 'active')
      
      // Check MetaMask connection
      if (!window.ethereum) {
        throw new Error('MetaMask not installed')
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (!accounts || accounts.length === 0) {
        throw new Error('MetaMask not connected')
      }

      // Check if on Sepolia network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      if (chainId !== '0xaa36a7') { // Sepolia chain ID
        // Try to switch to Sepolia
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
          })
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            // Add Sepolia network
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xaa36a7',
                chainName: 'Sepolia Testnet',
                nativeCurrency: {
                  name: 'Sepolia ETH',
                  symbol: 'SEP',
                  decimals: 18
                },
                rpcUrls: ['https://sepolia.infura.io/v3/YOUR_INFURA_KEY'],
                blockExplorerUrls: ['https://sepolia.etherscan.io/']
              }]
            })
          } else {
            throw switchError
          }
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
      updateStepStatus(1, 'completed')

      // Step 3: Execute Transaction
      setCurrentStep(2)
      updateStepStatus(2, 'active')

      console.log(`⚡ Sending ${amount} ETH to agent wallet: ${AGENT_WALLET}`)

      // Prepare transaction
      const valueWei = `0x${(amount * Math.pow(10, 18)).toString(16)}`
      
      const transaction = {
        from: accounts[0],
        to: AGENT_WALLET,
        value: valueWei,
        gas: '0x5208', // 21000 gas limit
        chainId: '0xaa36a7' // Sepolia
      }

      // Execute transaction via MetaMask
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transaction]
      })

      console.log(`📝 Transaction sent: ${txHash}`)
      setTransactionHash(txHash)

      updateStepStatus(2, 'completed')

      // Step 4: Confirm Transaction
      setCurrentStep(3)
      updateStepStatus(3, 'active')

      // Wait for transaction confirmation
      let receipt = null
      let attempts = 0
      const maxAttempts = 60 // 5 minutes max

      while (!receipt && attempts < maxAttempts) {
        try {
          receipt = await window.ethereum.request({
            method: 'eth_getTransactionReceipt',
            params: [txHash]
          })
          
          if (receipt) {
            break
          }
        } catch (error) {
          // Transaction might not be mined yet
        }
        
        await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
        attempts++
      }

      if (!receipt) {
        throw new Error('Transaction confirmation timeout')
      }

      if (receipt.status !== '0x1') {
        throw new Error('Transaction failed on blockchain')
      }

      updateStepStatus(3, 'completed')

      // Call completion callback
      onDepositComplete({
        agentId: agent.id,
        amount: amount,
        txHash: txHash,
        blockNumber: parseInt(receipt.blockNumber, 16),
        gasUsed: parseInt(receipt.gasUsed, 16),
        network: 'Sepolia',
        timestamp: new Date().toISOString(),
        explorerUrl: `https://sepolia.etherscan.io/tx/${txHash}`
      })

      console.log(`✅ Real ETH deposit completed: ${amount} ETH to agent ${agent.name}`)

    } catch (error: any) {
      console.error('❌ ETH deposit failed:', error)
      
      let errorMessage = error.message || 'Unknown error occurred'
      
      // Handle specific MetaMask errors
      if (error.code === 4001) {
        errorMessage = 'Transaction rejected by user'
      } else if (error.code === -32603) {
        errorMessage = 'Internal MetaMask error. Please try again.'
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient ETH balance for transaction + gas fees'
      }
      
      setError(errorMessage)
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

  const canDeposit = ethAmount && parseFloat(ethAmount) > 0 && !isProcessing

  if (!agent) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Deposit ETH to {agent.name}</span>
          </DialogTitle>
          <DialogDescription>
            Send ETH directly from your MetaMask wallet to the agent on Sepolia testnet
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
                <Badge variant="secondary">Sepolia Testnet</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Agent Wallet</span>
                <span className="font-mono text-xs">{AGENT_WALLET}</span>
              </div>
            </CardContent>
          </Card>

          {/* Deposit Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="h-4 w-4" />
                <span>ETH Deposit</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eth-amount">Amount (ETH)</Label>
                <Input
                  id="eth-amount"
                  type="number"
                  step="0.001"
                  min="0"
                  max={walletBalance}
                  value={ethAmount}
                  onChange={(e) => setEthAmount(e.target.value)}
                  placeholder="0.05"
                  disabled={isProcessing}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Wallet Balance: {walletBalance} ETH</span>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto"
                    onClick={() => setEthAmount((parseFloat(walletBalance) * 0.9).toFixed(3))}
                    disabled={isProcessing}
                  >
                    Use 90%
                  </Button>
                </div>
              </div>

              {ethAmount && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Your Wallet</span>
                    <ArrowRight className="h-4 w-4" />
                    <span>Agent Wallet</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Amount:</span>
                    <span className="font-medium">{ethAmount} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Estimated USD:</span>
                    <span className="font-medium">${(parseFloat(ethAmount) * 1500).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Network Fee:</span>
                    <span className="font-medium">~0.001 ETH</span>
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
                  <Zap className="h-4 w-4" />
                  <span>Transaction Progress</span>
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => window.open(`https://sepolia.etherscan.io/tx/${transactionHash}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on Etherscan
                    </Button>
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
                <strong>Transaction Failed:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Warning */}
          <Alert>
            <Zap className="w-4 h-4" />
            <AlertDescription>
              <strong>Real Transaction:</strong> This will send actual ETH from your MetaMask wallet 
              to the agent wallet on Sepolia testnet. Make sure you have sufficient testnet ETH.
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
                <Zap className="h-4 w-4 mr-1" />
                Send ETH
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}