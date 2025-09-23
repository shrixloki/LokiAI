/**
 * Capital Allocation Service - Frontend
 * Handles USD → ETH → MetaMask → Sepolia transaction flow
 */

export interface AllocationRequest {
  usdAmount: number;
  userAddress: string;
  agentId: string;
}

export interface AllocationResponse {
  success: boolean;
  allocationId: string;
  conversion: {
    usdAmount: number;
    ethAmount: string;
    ethPrice: number;
    rate: string;
  };
  transaction: {
    from: string;
    to: string;
    value: string;
    gas: string;
    chainId: string;
  };
  agentWallet: string;
  explorerUrl: string;
}

export interface ConfirmationResponse {
  success: boolean;
  confirmation: {
    txHash: string;
    blockNumber: number;
    gasUsed: string;
    explorerUrl: string;
  };
  allocation: {
    id: string;
    agentId: string;
    ethAmount: number;
    agentBalance: string;
  };
  message: string;
}

export interface TransactionStatus {
  pending: boolean;
  confirmed: boolean;
  failed: boolean;
  txHash?: string;
  error?: string;
}

export class CapitalAllocationService {
  private readonly baseUrl: string;
  private readonly sepoliaChainId = '0xaa36a7'; // 11155111 in hex

  constructor(baseUrl: string = 'http://127.0.0.1:25003') {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if MetaMask is connected and on Sepolia network
   */
  async checkMetaMaskConnection(): Promise<{ connected: boolean; onSepolia: boolean; address?: string }> {
    try {
      if (!window.ethereum) {
        return { connected: false, onSepolia: false };
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });

      return {
        connected: accounts.length > 0,
        onSepolia: chainId === this.sepoliaChainId,
        address: accounts[0]
      };
    } catch (error) {
      console.error('❌ MetaMask connection check failed:', error);
      return { connected: false, onSepolia: false };
    }
  }

  /**
   * Switch to Sepolia network
   */
  async switchToSepolia(): Promise<boolean> {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: this.sepoliaChainId }],
      });

      console.log('✅ Switched to Sepolia network');
      return true;
    } catch (error: any) {
      // If network doesn't exist, add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: this.sepoliaChainId,
              chainName: 'Sepolia Testnet',
              nativeCurrency: {
                name: 'Sepolia ETH',
                symbol: 'SEP',
                decimals: 18
              },
              rpcUrls: ['https://sepolia.infura.io/v3/YOUR_INFURA_KEY'],
              blockExplorerUrls: ['https://sepolia.etherscan.io/']
            }]
          });
          return true;
        } catch (addError) {
          console.error('❌ Failed to add Sepolia network:', addError);
          return false;
        }
      }
      
      console.error('❌ Failed to switch to Sepolia:', error);
      return false;
    }
  }

  /**
   * Prepare allocation - convert USD to ETH and get transaction payload
   */
  async prepareAllocation(request: AllocationRequest): Promise<AllocationResponse> {
    try {
      console.log('🚀 Preparing allocation:', request);

      const response = await fetch(`${this.baseUrl}/allocate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Allocation prepared:', result);

      return result;
    } catch (error) {
      console.error('❌ Allocation preparation failed:', error);
      throw error;
    }
  }

  /**
   * Execute transaction via MetaMask
   */
  async executeTransaction(transaction: any): Promise<string> {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      console.log('⚡ Executing transaction via MetaMask:', transaction);

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transaction]
      });

      console.log('📝 Transaction sent:', txHash);
      return txHash;
    } catch (error: any) {
      console.error('❌ Transaction execution failed:', error);
      
      // Handle user rejection
      if (error.code === 4001) {
        throw new Error('Transaction rejected by user');
      }
      
      // Handle insufficient funds
      if (error.message?.includes('insufficient funds')) {
        throw new Error('Insufficient ETH balance for transaction');
      }
      
      throw error;
    }
  }

  /**
   * Confirm transaction and update agent balance
   */
  async confirmTransaction(txHash: string, allocationId: string): Promise<ConfirmationResponse> {
    try {
      console.log('🔍 Confirming transaction:', { txHash, allocationId });

      const response = await fetch(`${this.baseUrl}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ txHash, allocationId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Transaction confirmed:', result);

      return result;
    } catch (error) {
      console.error('❌ Transaction confirmation failed:', error);
      throw error;
    }
  }

  /**
   * Complete allocation flow: prepare → execute → confirm
   */
  async allocateCapital(
    usdAmount: number,
    agentId: string,
    onProgress?: (step: string, data?: any) => void
  ): Promise<ConfirmationResponse> {
    try {
      // Step 1: Check MetaMask connection
      onProgress?.('Checking MetaMask connection...');
      const connection = await this.checkMetaMaskConnection();
      
      if (!connection.connected) {
        throw new Error('MetaMask not connected. Please connect your wallet.');
      }
      
      if (!connection.onSepolia) {
        onProgress?.('Switching to Sepolia network...');
        const switched = await this.switchToSepolia();
        if (!switched) {
          throw new Error('Failed to switch to Sepolia network');
        }
      }

      // Step 2: Prepare allocation
      onProgress?.('Preparing allocation...', { usdAmount });
      const allocation = await this.prepareAllocation({
        usdAmount,
        userAddress: connection.address!,
        agentId
      });

      // Step 3: Execute transaction
      onProgress?.('Executing transaction...', { 
        ethAmount: allocation.conversion.ethAmount,
        agentWallet: allocation.agentWallet 
      });
      const txHash = await this.executeTransaction(allocation.transaction);

      // Step 4: Confirm transaction
      onProgress?.('Confirming transaction...', { txHash });
      const confirmation = await this.confirmTransaction(txHash, allocation.allocationId);

      onProgress?.('Allocation completed!', confirmation);
      return confirmation;

    } catch (error) {
      console.error('❌ Capital allocation failed:', error);
      throw error;
    }
  }

  /**
   * Get allocation history for an agent
   */
  async getAllocationHistory(agentId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/allocations/${agentId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to get allocation history:', error);
      throw error;
    }
  }

  /**
   * Get agent wallet balance
   */
  async getAgentBalance(): Promise<{ balance: string; balanceWei: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/agent-balance`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      return {
        balance: result.balance,
        balanceWei: result.balanceWei
      };
    } catch (error) {
      console.error('❌ Failed to get agent balance:', error);
      throw error;
    }
  }

  /**
   * Monitor transaction status
   */
  async monitorTransaction(txHash: string): Promise<TransactionStatus> {
    try {
      if (!window.ethereum) {
        return { pending: false, confirmed: false, failed: true, error: 'MetaMask not available' };
      }

      const receipt = await window.ethereum.request({
        method: 'eth_getTransactionReceipt',
        params: [txHash]
      });

      if (!receipt) {
        return { pending: true, confirmed: false, failed: false, txHash };
      }

      const success = receipt.status === '0x1';
      return {
        pending: false,
        confirmed: success,
        failed: !success,
        txHash,
        error: success ? undefined : 'Transaction failed on blockchain'
      };

    } catch (error) {
      console.error('❌ Transaction monitoring failed:', error);
      return { 
        pending: false, 
        confirmed: false, 
        failed: true, 
        txHash, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Export singleton instance
export const capitalAllocationService = new CapitalAllocationService();