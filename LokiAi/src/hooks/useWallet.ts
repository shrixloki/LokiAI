import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  user: User | null;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    isConnecting: false,
    user: null,
    error: null,
  });
  
  const { toast } = useToast();

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('connectedUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setState(prev => ({
          ...prev,
          isConnected: true,
          user
        }));
      } catch (error) {
        localStorage.removeItem('connectedUser');
      }
    }
  }, []);

  const connectWallet = useCallback(async (walletType: 'metamask' | 'phantom' | 'coinbase' | 'walletconnect') => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      toast({
        title: "Connecting wallet...",
        description: `Please approve the connection in your ${walletType} wallet.`
      });

      // Simulate wallet connection
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock wallet address
      const addresses = {
        metamask: '0x742d35Cc6Cd3B7a8917fe5b3B8b3C9f5d5e5d9a',
        phantom: 'DXP7UZwCj2nCkX8PkQnKx3YeMpVT8fF2VyHqN9mK8nB',
        coinbase: '0x892a4D7B2CC8aF8b7b1F1B0D3D8e4F5a6B7C8D9E',
        walletconnect: '0x456b8E9C7D4A1F2E5D7A8B9C0F1E2D3C4B5A6789'
      };

      const user: User = {
        id: `user_${Date.now()}`,
        address: addresses[walletType],
        walletType,
        connectedAt: new Date().toISOString(),
        preferences: {
          theme: 'dark',
          notifications: true,
          autoExecute: false,
          riskTolerance: 'medium',
          preferredChains: ['ethereum', 'polygon', 'arbitrum']
        }
      };

      // Save to localStorage
      localStorage.setItem('connectedUser', JSON.stringify(user));

      setState({
        isConnected: true,
        isConnecting: false,
        user,
        error: null
      });

      toast({
        title: "Wallet connected successfully!",
        description: `Welcome to Cross-Chain AI Agent Network!`
      });

      return user;
    } catch (error) {
      const errorMessage = "Failed to connect wallet. Please try again.";
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage
      }));

      toast({
        title: "Connection failed",
        description: errorMessage,
        variant: "destructive"
      });

      throw error;
    }
  }, [toast]);

  const disconnectWallet = useCallback(() => {
    localStorage.removeItem('connectedUser');
    setState({
      isConnected: false,
      isConnecting: false,
      user: null,
      error: null
    });

    toast({
      title: "Wallet disconnected",
      description: "You have been safely logged out."
    });
  }, [toast]);

  const updatePreferences = useCallback((preferences: Partial<User['preferences']>) => {
    if (!state.user) return;

    const updatedUser = {
      ...state.user,
      preferences: { ...state.user.preferences, ...preferences }
    };

    localStorage.setItem('connectedUser', JSON.stringify(updatedUser));
    setState(prev => ({ ...prev, user: updatedUser }));

    toast({
      title: "Preferences updated",
      description: "Your settings have been saved."
    });
  }, [state.user, toast]);

  return {
    ...state,
    connectWallet,
    disconnectWallet,
    updatePreferences
  };
}