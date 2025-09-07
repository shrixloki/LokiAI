import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

interface BalanceData {
  ethBalance: string;
  ethBalanceWei: string;
  usdBalance: number;
  ethPrice: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface NetworkInfo {
  chainId: string;
  name: string;
  isTestnet: boolean;
}

export function useWalletBalance(account: string | null, isConnected: boolean) {
  const [balanceData, setBalanceData] = useState<BalanceData>({
    ethBalance: '0',
    ethBalanceWei: '0',
    usdBalance: 0,
    ethPrice: 0,
    isLoading: false,
    error: null,
    lastUpdated: null,
  });

  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);

  // Fetch ETH price from multiple sources with fallbacks
  const fetchEthPrice = useCallback(async (): Promise<number> => {
    const sources = [
      // CoinGecko API (primary)
      async () => {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await response.json();
        return data.ethereum.usd;
      },
      // CoinCap API (fallback 1)
      async () => {
        const response = await fetch('https://api.coincap.io/v2/assets/ethereum');
        const data = await response.json();
        return parseFloat(data.data.priceUsd);
      },
      // Binance API (fallback 2)
      async () => {
        const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT');
        const data = await response.json();
        return parseFloat(data.price);
      }
    ];

    for (const source of sources) {
      try {
        const price = await source();
        if (price && price > 0) {
          console.log('ETH Price fetched:', price);
          return price;
        }
      } catch (error) {
        console.warn('Price source failed:', error);
      }
    }

    // Ultimate fallback
    console.warn('All price sources failed, using fallback price');
    return 3500;
  }, []);

  // Get network information
  const getNetworkInfo = useCallback(async (): Promise<NetworkInfo | null> => {
    if (!window.ethereum) return null;

    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      const networks: { [key: string]: NetworkInfo } = {
        '0x1': { chainId: '0x1', name: 'Ethereum Mainnet', isTestnet: false },
        '0x5': { chainId: '0x5', name: 'Goerli Testnet', isTestnet: true },
        '0xaa36a7': { chainId: '0xaa36a7', name: 'Sepolia Testnet', isTestnet: true },
        '0x11155111': { chainId: '0x11155111', name: 'Sepolia Testnet', isTestnet: true },
        '0x89': { chainId: '0x89', name: 'Polygon Mainnet', isTestnet: false },
      };

      return networks[chainId] || { chainId, name: `Unknown Network (${chainId})`, isTestnet: true };
    } catch (error) {
      console.error('Failed to get network info:', error);
      return null;
    }
  }, []);

  // Fetch wallet balance with high precision
  const fetchBalance = useCallback(async () => {
    if (!account || !window.ethereum || !isConnected) {
      setBalanceData(prev => ({
        ...prev,
        ethBalance: '0',
        ethBalanceWei: '0',
        usdBalance: 0,
        isLoading: false,
        error: null,
      }));
      return;
    }

    setBalanceData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get network info
      const network = await getNetworkInfo();
      setNetworkInfo(network);

      // Fetch balance using multiple methods for reliability
      let balanceWei: string;
      
      try {
        // Method 1: Direct eth_getBalance call
        balanceWei = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [account, 'latest'],
        });
      } catch (error) {
        console.warn('Direct balance fetch failed, trying ethers provider:', error);
        
        // Method 2: Ethers provider fallback
        const provider = new ethers.BrowserProvider(window.ethereum);
        const balance = await provider.getBalance(account);
        balanceWei = balance.toString();
      }

      // Convert Wei to ETH with high precision (18 decimals)
      const ethBalance = ethers.formatEther(balanceWei);
      
      // Fetch ETH price
      const ethPrice = await fetchEthPrice();
      
      // Calculate USD value with high precision
      const ethBalanceNum = parseFloat(ethBalance);
      const usdBalance = ethBalanceNum * ethPrice;

      console.log('Balance Details:', {
        account,
        network: network?.name,
        balanceWei,
        ethBalance,
        ethBalanceNum,
        ethPrice,
        usdBalance
      });

      setBalanceData({
        ethBalance,
        ethBalanceWei: balanceWei,
        usdBalance,
        ethPrice,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });

    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setBalanceData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch balance',
      }));
    }
  }, [account, isConnected, fetchEthPrice, getNetworkInfo]);

  // Auto-refresh balance every 10 seconds
  useEffect(() => {
    if (isConnected && account) {
      fetchBalance();
      
      const interval = setInterval(fetchBalance, 10000);
      return () => clearInterval(interval);
    }
  }, [isConnected, account, fetchBalance]);

  // Listen for MetaMask events
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = () => {
      console.log('Accounts changed, refreshing balance');
      fetchBalance();
    };

    const handleChainChanged = () => {
      console.log('Chain changed, refreshing balance');
      fetchBalance();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [fetchBalance]);

  // Manual refresh function
  const refreshBalance = useCallback(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Format balance for display with proper precision
  const formatEthBalance = useCallback((decimals: number = 6) => {
    const balance = parseFloat(balanceData.ethBalance);
    if (balance === 0) return '0';
    
    // For very small balances, show more decimals
    if (balance < 0.0001) {
      return balance.toFixed(8);
    } else if (balance < 0.01) {
      return balance.toFixed(6);
    } else {
      return balance.toFixed(decimals);
    }
  }, [balanceData.ethBalance]);

  const formatUsdBalance = useCallback((decimals: number = 2) => {
    const balance = balanceData.usdBalance;
    if (balance === 0) return '0.00';
    
    // For very small USD amounts, show more precision
    if (balance < 0.01) {
      return balance.toFixed(4);
    } else {
      return balance.toFixed(decimals);
    }
  }, [balanceData.usdBalance]);

  return {
    ...balanceData,
    networkInfo,
    refreshBalance,
    formatEthBalance,
    formatUsdBalance,
  };
}
