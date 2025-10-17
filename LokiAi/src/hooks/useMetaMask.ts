import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

interface MetaMaskState {
  isConnected: boolean;
  account: string | null;
  chainId: string | null;
  isInstalled: boolean;
  isConnecting: boolean;
  isVerifying: boolean;
  error: string | null;
  networkName: string | null;
  balance: string | null;
}

interface UseMetaMaskReturn extends MetaMaskState {
  connect: () => Promise<void>;
  disconnect: () => void;
  signChallenge: () => Promise<boolean>;
  signMessage: (message: string) => Promise<string | null>;
  switchToMainnet: () => Promise<void>;
  getBalance: () => Promise<string | null>;
}

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5000' 
  : `http://${window.location.hostname}:5000`;

const NETWORK_NAMES: { [key: string]: string } = {
  '0x1': 'Ethereum Mainnet',
  '0x3': 'Ropsten Testnet',
  '0x4': 'Rinkeby Testnet',
  '0x5': 'Goerli Testnet',
  '0x89': 'Polygon Mainnet',
  '0x13881': 'Polygon Mumbai Testnet',
  '0xaa36a7': 'Sepolia Testnet',
};

export const useMetaMask = (): UseMetaMaskReturn => {
  // Initialize state with localStorage data if available
  const [state, setState] = useState<MetaMaskState>(() => {
    if (typeof window !== 'undefined') {
      const savedConnection = localStorage.getItem('metamask_connection');
      if (savedConnection) {
        try {
          const parsed = JSON.parse(savedConnection);
          return {
            isConnected: parsed.isConnected || false,
            account: parsed.account || null,
            chainId: parsed.chainId || null,
            isInstalled: false, // Will be checked on mount
            isConnecting: false,
            isVerifying: false,
            error: null,
            networkName: parsed.networkName || null,
            balance: null, // Will be fetched fresh
          };
        } catch (error) {
          console.error('Error parsing saved connection:', error);
        }
      }
    }
    
    return {
      isConnected: false,
      account: null,
      chainId: null,
      isInstalled: false,
      isConnecting: false,
      isVerifying: false,
      error: null,
      networkName: null,
      balance: null,
    };
  });

  // Check if MetaMask is installed
  const checkMetaMaskInstalled = useCallback(() => {
    const ethereum = (window as any).ethereum;
    const isInstalled = Boolean(
      ethereum && (ethereum.isMetaMask || ethereum.providers?.some((p: any) => p.isMetaMask))
    );
    
    console.log('🔍 MetaMask detection:', { ethereum: !!ethereum, isInstalled });
    setState(prev => ({ ...prev, isInstalled }));
    return isInstalled;
  }, []);

  // Get MetaMask provider
  const getProvider = useCallback(() => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      console.log('❌ No ethereum object found');
      return null;
    }
    
    // Handle multiple providers (e.g., MetaMask + other wallets)
    if (ethereum.providers) {
      const metamaskProvider = ethereum.providers.find((p: any) => p.isMetaMask);
      console.log('🔍 Found MetaMask in providers array:', !!metamaskProvider);
      return metamaskProvider || ethereum;
    }
    
    const isMetaMask = ethereum.isMetaMask;
    console.log('🔍 Direct ethereum.isMetaMask:', isMetaMask);
    return isMetaMask ? ethereum : null;
  }, []);

  // Get network name from chain ID
  const getNetworkName = useCallback((chainId: string): string => {
    return NETWORK_NAMES[chainId] || `Unknown Network (${chainId})`;
  }, []);

  // Get wallet balance
  const getBalance = useCallback(async (): Promise<string | null> => {
    if (!state.account) return null;

    const provider = getProvider();
    if (!provider) return null;

    try {
      const ethersProvider = new ethers.BrowserProvider(provider);
      const balance = await ethersProvider.getBalance(state.account);
      const balanceInEth = ethers.formatEther(balance);
      return parseFloat(balanceInEth).toFixed(4);
    } catch (error) {
      console.error('❌ Error getting balance:', error);
      return null;
    }
  }, [state.account, getProvider]);

  // Switch to Ethereum mainnet
  const switchToMainnet = useCallback(async () => {
    const provider = getProvider();
    if (!provider) return;

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }],
      });
    } catch (error: any) {
      console.error('❌ Error switching to mainnet:', error);
      setState(prev => ({ ...prev, error: 'Failed to switch to Ethereum mainnet' }));
    }
  }, [getProvider]);

  // Get challenge from backend and sign it
  const signChallenge = useCallback(async (): Promise<boolean> => {
    if (!state.account) {
      setState(prev => ({ ...prev, error: 'No account connected' }));
      return false;
    }

    const provider = getProvider();
    if (!provider) {
      setState(prev => ({ ...prev, error: 'MetaMask provider not found' }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, isVerifying: true, error: null }));

      // Get challenge from backend
      console.log('🔍 Requesting challenge from backend...');
      const challengeResponse = await fetch(`${BACKEND_URL}/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: state.account }),
      });

      if (!challengeResponse.ok) {
        throw new Error('Failed to get challenge from backend');
      }

      const { message } = await challengeResponse.json();
      console.log('✅ Received challenge:', message);

      // Sign the challenge
      console.log('🔍 Signing challenge...');
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const signature = await signer.signMessage(message);
      console.log('✅ Challenge signed successfully');

      // Verify signature with backend
      console.log('🔍 Verifying signature with backend...');
      const verifyResponse = await fetch(`${BACKEND_URL}/verify-wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: state.account,
          signature,
          message,
        }),
      });

      const result = await verifyResponse.json();
      console.log('✅ Verification result:', result);

      if (result.valid) {
        setState(prev => ({ ...prev, isVerifying: false, error: null }));
        return true;
      } else {
        setState(prev => ({ ...prev, isVerifying: false, error: 'Wallet verification failed' }));
        return false;
      }
    } catch (error: any) {
      console.error('❌ Challenge signing error:', error);
      setState(prev => ({ 
        ...prev, 
        isVerifying: false, 
        error: `Verification failed: ${error.message}` 
      }));
      return false;
    }
  }, [state.account, getProvider]);

  // Connect to MetaMask
  const connect = useCallback(async () => {
    console.log('🔍 Starting MetaMask connection process...');
    
    if (!checkMetaMaskInstalled()) {
      setState(prev => ({ 
        ...prev, 
        error: 'MetaMask is not installed. Please install it from metamask.io' 
      }));
      return;
    }

    const provider = getProvider();
    if (!provider) {
      setState(prev => ({ 
        ...prev, 
        error: 'MetaMask provider not found. Please ensure MetaMask is enabled.' 
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));
      
      console.log('🔍 Requesting accounts from MetaMask...');
      const accounts = await provider.request({ 
        method: 'eth_requestAccounts' 
      });
      
      console.log('🔍 Accounts received:', accounts);
      
      if (accounts && accounts.length > 0) {
        // Get current chain ID
        const chainId = await provider.request({ method: 'eth_chainId' });
        const networkName = getNetworkName(chainId);
        
        console.log('✅ Connected successfully:', {
          account: accounts[0],
          chainId,
          networkName
        });
        
        setState(prev => {
          const newState = {
            ...prev,
            isConnected: true,
            account: accounts[0],
            chainId,
            networkName,
            isConnecting: false,
            error: null,
          };
          
          saveConnectionState(newState);
          return newState;
        });
      } else {
        throw new Error('No accounts returned from MetaMask');
      }
    } catch (error: any) {
      console.error('❌ MetaMask connection error:', error);
      
      let errorMessage = 'Failed to connect to MetaMask';
      
      if (error.code === 4001) {
        errorMessage = 'Connection request was rejected by user';
      } else if (error.code === -32002) {
        errorMessage = 'Connection request is already pending. Please check MetaMask extension.';
      } else if (error.code === -32603) {
        errorMessage = 'Internal MetaMask error. Try refreshing the page.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
      }));
    }
  }, [checkMetaMaskInstalled, getProvider, getNetworkName]);

  // Save connection state to localStorage
  const saveConnectionState = useCallback((connectionState: Partial<MetaMaskState>) => {
    if (typeof window !== 'undefined') {
      const dataToSave = {
        isConnected: connectionState.isConnected,
        account: connectionState.account,
        chainId: connectionState.chainId,
        networkName: connectionState.networkName,
      };
      localStorage.setItem('metamask_connection', JSON.stringify(dataToSave));
    }
  }, []);

  // Clear connection state from localStorage
  const clearConnectionState = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('metamask_connection');
    }
  }, []);

  // Disconnect from MetaMask
  const disconnect = useCallback(() => {
    console.log('🔍 Disconnecting from MetaMask...');
    clearConnectionState();
    setState(prev => ({
      ...prev,
      isConnected: false,
      account: null,
      chainId: null,
      networkName: null,
      balance: null,
      error: null,
    }));
  }, [clearConnectionState]);

  // Handle account changes
  useEffect(() => {
    const provider = getProvider();
    if (!provider) return;

    const handleAccountsChanged = (accounts: string[]) => {
      console.log('🔍 Accounts changed:', accounts);
      if (accounts.length === 0) {
        clearConnectionState();
        setState(prev => ({
          ...prev,
          isConnected: false,
          account: null,
          chainId: null,
          networkName: null,
          balance: null,
          error: 'Wallet disconnected',
        }));
      } else {
        setState(prev => {
          const newState = {
            ...prev,
            isConnected: true,
            account: accounts[0],
            error: null,
          };
          saveConnectionState(newState);
          return newState;
        });
      }
    };

    const handleChainChanged = (chainId: string) => {
      console.log('🔍 Chain changed to:', chainId);
      const networkName = getNetworkName(chainId);
      setState(prev => {
        const newState = {
          ...prev,
          chainId,
          networkName,
          balance: null, // Reset balance when chain changes
        };
        saveConnectionState(newState);
        return newState;
      });
    };

    provider.on?.('accountsChanged', handleAccountsChanged);
    provider.on?.('chainChanged', handleChainChanged);

    return () => {
      provider.removeListener?.('accountsChanged', handleAccountsChanged);
      provider.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [getProvider, getNetworkName, saveConnectionState, clearConnectionState]);

  // Check for existing connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      if (!checkMetaMaskInstalled()) return;

      const provider = getProvider();
      if (!provider) return;

      try {
        const accounts = await provider.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          const chainId = await provider.request({ method: 'eth_chainId' });
          const networkName = getNetworkName(chainId);
          
          console.log('✅ Found existing connection:', {
            account: accounts[0],
            chainId,
            networkName
          });
          
          setState(prev => {
            const newState = {
              ...prev,
              isConnected: true,
              account: accounts[0],
              chainId,
              networkName,
            };
            saveConnectionState(newState);
            return newState;
          });
        }
      } catch (error) {
        console.error('❌ Error checking existing connection:', error);
      }
    };

    checkExistingConnection();
  }, [checkMetaMaskInstalled, getProvider, getNetworkName, saveConnectionState]);

  // Update balance when account or chain changes
  useEffect(() => {
    if (state.isConnected && state.account) {
      getBalance().then(balance => {
        setState(prev => ({ ...prev, balance }));
      });
    }
  }, [state.isConnected, state.account, state.chainId, getBalance]);

  const signMessage = useCallback(async (message: string): Promise<string | null> => {
    if (!checkMetaMaskInstalled()) {
      setState(prev => ({ ...prev, error: 'MetaMask is not installed' }));
      return null;
    }

    const provider = getProvider();
    if (!provider || !state.account) {
      setState(prev => ({ ...prev, error: 'No wallet connected' }));
      return null;
    }

    try {
      setState(prev => ({ ...prev, error: null }));
      
      // Sign the message using personal_sign
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, state.account],
      });

      return signature;
    } catch (error: any) {
      let errorMessage = 'Failed to sign message';
      if (error.code === 4001) {
        errorMessage = 'User rejected the signing request';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setState(prev => ({ ...prev, error: errorMessage }));
      return null;
    }
  }, [checkMetaMaskInstalled, getProvider, state.account]);

  return {
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    account: state.account,
    chainId: state.chainId,
    networkName: state.networkName,
    isInstalled: state.isInstalled,
    isVerifying: state.isVerifying,
    balance: state.balance,
    error: state.error,
    connect,
    disconnect,
    signChallenge,
    signMessage,
    switchToMainnet,
    getBalance,
  };
};
