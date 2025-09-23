/**
 * Testnet Integration Service
 * Handles MetaMask integration and testnet transaction execution
 */

import { ethers } from 'ethers'

export interface NetworkConfig {
  chainId: number
  name: string
  rpcUrl: string
  explorerUrl: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
}

export interface TradeExecution {
  tradeId: string
  agentType: string
  tokenSymbol: string
  transaction: any
  gasEstimate: string
  networkInfo: NetworkConfig
}

export interface TransactionResult {
  success: boolean
  txHash?: string
  error?: string
  gasUsed?: string
  blockNumber?: number
}

export class TestnetIntegrationService {
  private provider: ethers.BrowserProvider | null = null
  private signer: ethers.JsonRpcSigner | null = null
  private currentNetwork: NetworkConfig | null = null

  // Testnet configurations
  private readonly networks: Record<string, NetworkConfig> = {
    sepolia: {
      chainId: 11155111,
      name: 'Sepolia',
      rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
      explorerUrl: 'https://sepolia.etherscan.io',
      nativeCurrency: {
        name: 'Sepolia ETH',
        symbol: 'SEP',
        decimals: 18
      }
    },
    mumbai: {
      chainId: 80001,
      name: 'Mumbai',
      rpcUrl: 'https://polygon-mumbai.infura.io/v3/YOUR_INFURA_KEY',
      explorerUrl: 'https://mumbai.polygonscan.com',
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18
      }
    }
  }

  /**
   * Initialize MetaMask connection
   */
  async initializeMetaMask(): Promise<{ success: boolean; address?: string; error?: string }> {
    try {
      if (!window.ethereum) {
        return {
          success: false,
          error: 'MetaMask not installed'
        }
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length === 0) {
        return {
          success: false,
          error: 'No accounts available'
        }
      }

      // Initialize provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum)
      this.signer = await this.provider.getSigner()

      // Get current network
      const network = await this.provider.getNetwork()
      this.currentNetwork = this.getNetworkConfig(Number(network.chainId))

      console.log('✅ MetaMask initialized:', accounts[0])
      console.log('🌐 Current network:', this.currentNetwork?.name)

      return {
        success: true,
        address: accounts[0]
      }

    } catch (error) {
      console.error('❌ MetaMask initialization failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Switch to a specific testnet
   */
  async switchNetwork(networkName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const networkConfig = this.networks[networkName]
      if (!networkConfig) {
        return {
          success: false,
          error: `Unsupported network: ${networkName}`
        }
      }

      if (!window.ethereum) {
        return {
          success: false,
          error: 'MetaMask not available'
        }
      }

      // Try to switch to the network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${networkConfig.chainId.toString(16)}` }]
        })
      } catch (switchError: any) {
        // If network doesn't exist, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${networkConfig.chainId.toString(16)}`,
              chainName: networkConfig.name,
              nativeCurrency: networkConfig.nativeCurrency,
              rpcUrls: [networkConfig.rpcUrl],
              blockExplorerUrls: [networkConfig.explorerUrl]
            }]
          })
        } else {
          throw switchError
        }
      }

      // Update current network
      this.currentNetwork = networkConfig
      console.log(`✅ Switched to ${networkConfig.name}`)

      return { success: true }

    } catch (error) {
      console.error('❌ Network switch failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Execute agent trade via backend and MetaMask
   */
  async executeAgentTrade(
    agentId: string,
    marketData: Record<string, number>,
    walletAddress: string
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      console.log(`🚀 Executing trade for agent: ${agentId}`)

      // First, try to deploy the agent if it doesn't exist
      let agentExists = false
      try {
        const checkResponse = await fetch(`http://127.0.0.1:25001/agents/${agentId}`)
        agentExists = checkResponse.ok
      } catch (error) {
        console.log('Agent check failed, will deploy new agent')
      }

      // Deploy agent if it doesn't exist
      if (!agentExists) {
        console.log(`🚀 Deploying new agent: ${agentId}`)
        const deployResponse = await fetch('http://127.0.0.1:25001/agents/deploy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'yield', // Default to yield optimizer
            tokenSymbol: 'ETH',
            maxInvestment: 1000,
            riskTolerance: 0.5,
            network: 'sepolia'
          })
        })

        if (!deployResponse.ok) {
          throw new Error(`Failed to deploy agent: ${deployResponse.status} ${deployResponse.statusText}`)
        }

        const deployResult = await deployResponse.json()
        console.log(`✅ Agent deployed: ${deployResult.agentId}`)
      }

      // Call backend to get trade instruction
      const response = await fetch(`http://127.0.0.1:25001/agents/${agentId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          marketData,
          walletAddress
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Backend error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Trade execution failed'
        }
      }

      // Execute transaction via MetaMask
      const txResult = await this.executeTransaction(data.execution)

      if (txResult.success && txResult.txHash) {
        // Confirm transaction with backend
        await this.confirmTransaction(data.tradeInstruction.id, txResult.txHash, 'confirmed')
      }

      return {
        success: txResult.success,
        result: {
          prediction: data.prediction,
          tradeInstruction: data.tradeInstruction,
          transaction: txResult
        },
        error: txResult.error
      }

    } catch (error) {
      console.error('❌ Agent trade execution failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Execute transaction via MetaMask
   */
  async executeTransaction(tradeExecution: TradeExecution): Promise<TransactionResult> {
    try {
      if (!this.signer) {
        throw new Error('MetaMask not initialized')
      }

      console.log(`⚡ Executing transaction: ${tradeExecution.tradeId}`)

      // Send transaction
      const tx = await this.signer.sendTransaction(tradeExecution.transaction)
      console.log(`📝 Transaction sent: ${tx.hash}`)

      // Wait for confirmation
      const receipt = await tx.wait()
      console.log(`✅ Transaction confirmed: ${tx.hash}`)

      return {
        success: true,
        txHash: tx.hash,
        gasUsed: receipt?.gasUsed?.toString(),
        blockNumber: receipt?.blockNumber
      }

    } catch (error) {
      console.error('❌ Transaction execution failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Confirm transaction with backend
   */
  async confirmTransaction(tradeId: string, txHash: string, status: string): Promise<void> {
    try {
      await fetch(`http://127.0.0.1:25001/trades/${tradeId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          txHash,
          status
        })
      })

      console.log(`✅ Transaction confirmed with backend: ${tradeId}`)

    } catch (error) {
      console.error('❌ Transaction confirmation failed:', error)
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(address: string): Promise<{ balance: string; symbol: string }> {
    try {
      if (!this.provider || !this.currentNetwork) {
        throw new Error('Provider not initialized')
      }

      const balance = await this.provider.getBalance(address)
      const balanceEth = ethers.formatEther(balance)

      return {
        balance: balanceEth,
        symbol: this.currentNetwork.nativeCurrency.symbol
      }

    } catch (error) {
      console.error('❌ Failed to get wallet balance:', error)
      return {
        balance: '0.0',
        symbol: 'ETH'
      }
    }
  }

  /**
   * Get recent transactions
   */
  async getRecentTransactions(address: string, limit: number = 5): Promise<any[]> {
    try {
      // In production, use explorer APIs
      // For now, return mock data
      return [
        {
          hash: '0x' + 'a'.repeat(64),
          blockNumber: 12345678,
          timestamp: new Date().toISOString(),
          from: address,
          to: '0x' + 'b'.repeat(40),
          value: '0.1',
          gasUsed: 21000,
          status: 'success'
        }
      ]

    } catch (error) {
      console.error('❌ Failed to get recent transactions:', error)
      return []
    }
  }

  /**
   * Get network configuration by chain ID
   */
  private getNetworkConfig(chainId: number): NetworkConfig | null {
    for (const config of Object.values(this.networks)) {
      if (config.chainId === chainId) {
        return config
      }
    }
    return null
  }

  /**
   * Get current network info
   */
  getCurrentNetwork(): NetworkConfig | null {
    return this.currentNetwork
  }

  /**
   * Get supported networks
   */
  getSupportedNetworks(): Record<string, NetworkConfig> {
    return this.networks
  }

  /**
   * Check if connected to a supported testnet
   */
  isConnectedToTestnet(): boolean {
    return this.currentNetwork !== null && 
           Object.values(this.networks).some(n => n.chainId === this.currentNetwork?.chainId)
  }
}

// Export singleton instance
export const testnetIntegration = new TestnetIntegrationService()