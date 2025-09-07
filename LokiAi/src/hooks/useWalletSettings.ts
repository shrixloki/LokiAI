import { useState, useEffect, useCallback } from 'react';
import { useMetaMask } from './useMetaMask';

export interface WalletSettings {
  id?: number;
  wallet_address: string;
  
  // Profile Information
  display_name?: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  
  // Security Settings
  two_factor_enabled: boolean;
  biometric_enabled: boolean;
  session_timeout: number; // minutes
  ip_whitelist?: string[];
  
  // Privacy Settings
  data_sharing_enabled: boolean;
  analytics_enabled: boolean;
  marketing_emails: boolean;
  
  // Notification Preferences
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  trade_alerts: boolean;
  security_alerts: boolean;
  
  // Trading Preferences
  default_slippage?: number;
  auto_approve_enabled: boolean;
  gas_price_preference: string; // slow, standard, fast
  preferred_dex: string;
  
  // Display Preferences
  theme: string; // light, dark, auto
  language: string;
  currency: string;
  timezone: string;
  
  // Advanced Settings
  developer_mode: boolean;
  beta_features: boolean;
  custom_rpc_urls: Record<string, any>;
  
  // Metadata
  created_at?: string;
  updated_at?: string;
  last_accessed?: string;
}

export interface SettingsResponse {
  settings: WalletSettings;
  message: string;
}

export interface SettingsExport {
  wallet_address: string;
  settings: WalletSettings;
  exported_at: string;
  version: string;
}

const API_BASE_URL = 'http://127.0.0.1:25000';

export const useWalletSettings = () => {
  const { account, isConnected } = useMetaMask();
  const [settings, setSettings] = useState<WalletSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Default settings factory
  const createDefaultSettings = useCallback((walletAddress: string): WalletSettings => ({
    wallet_address: walletAddress,
    
    // Profile defaults
    display_name: undefined,
    email: undefined,
    avatar_url: undefined,
    bio: undefined,
    
    // Security defaults
    two_factor_enabled: false,
    biometric_enabled: false,
    session_timeout: 30,
    ip_whitelist: undefined,
    
    // Privacy defaults
    data_sharing_enabled: false,
    analytics_enabled: true,
    marketing_emails: false,
    
    // Notification defaults
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    trade_alerts: true,
    security_alerts: true,
    
    // Trading defaults
    default_slippage: 0.5,
    auto_approve_enabled: false,
    gas_price_preference: 'standard',
    preferred_dex: 'uniswap',
    
    // Display defaults
    theme: 'dark',
    language: 'en',
    currency: 'USD',
    timezone: 'UTC',
    
    // Advanced defaults
    developer_mode: false,
    beta_features: false,
    custom_rpc_urls: {},
  }), []);

  // Sign message with MetaMask for authentication
  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!window.ethereum || !account) {
      throw new Error('MetaMask not connected');
    }

    try {
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, account],
      });
      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      throw new Error('Failed to sign message with MetaMask');
    }
  }, [account]);

  // Generate authentication message
  const generateAuthMessage = useCallback((action: string): string => {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = Math.random().toString(36).substring(2, 15);
    return `Chainflow Sentinel Settings ${action}\n\nWallet: ${account}\nTimestamp: ${timestamp}\nNonce: ${nonce}`;
  }, [account]);

  // Fetch settings for current wallet
  const fetchSettings = useCallback(async () => {
    if (!account || !isConnected) {
      setSettings(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/settings/${account}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
      
      if (response.ok) {
        const data: SettingsResponse = await response.json();
        setSettings(data.settings);
      } else if (response.status === 404) {
        // No settings found, create defaults
        const defaultSettings = createDefaultSettings(account);
        setSettings(defaultSettings);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      
      // If fetch fails, use default settings but don't show error for first load
      const defaultSettings = createDefaultSettings(account);
      setSettings(defaultSettings);
      
      // Only show error if it's not a network connectivity issue
      if (err instanceof Error && !err.message.includes('fetch')) {
        setError('Failed to fetch settings from server. Using defaults.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [account, isConnected, createDefaultSettings]);

  // Save settings to backend
  const saveSettings = useCallback(async (updatedSettings: Partial<WalletSettings>): Promise<boolean> => {
    if (!account || !isConnected) {
      throw new Error('Wallet not connected');
    }

    setIsSaving(true);
    setError(null);

    try {
      // Generate authentication message and signature
      const message = generateAuthMessage('Update');
      const signature = await signMessage(message);

      const response = await fetch(`${API_BASE_URL}/api/settings/${account}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: updatedSettings,
          signature,
          message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: SettingsResponse = await response.json();
      setSettings(data.settings);
      return true;
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [account, isConnected, generateAuthMessage, signMessage]);

  // Reset settings to defaults
  const resetSettings = useCallback(async (): Promise<boolean> => {
    if (!account || !isConnected) {
      throw new Error('Wallet not connected');
    }

    setIsSaving(true);
    setError(null);

    try {
      const message = generateAuthMessage('Reset');
      const signature = await signMessage(message);

      const response = await fetch(`${API_BASE_URL}/api/settings/${account}/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {},
          signature,
          message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: SettingsResponse = await response.json();
      setSettings(data.settings);
      return true;
    } catch (err) {
      console.error('Error resetting settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset settings');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [account, isConnected, generateAuthMessage, signMessage]);

  // Delete all settings
  const deleteSettings = useCallback(async (): Promise<boolean> => {
    if (!account || !isConnected) {
      throw new Error('Wallet not connected');
    }

    setIsSaving(true);
    setError(null);

    try {
      const message = generateAuthMessage('Delete');
      const signature = await signMessage(message);

      const response = await fetch(`${API_BASE_URL}/api/settings/${account}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {},
          signature,
          message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Clear local settings
      setSettings(null);
      return true;
    } catch (err) {
      console.error('Error deleting settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete settings');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [account, isConnected, generateAuthMessage, signMessage]);

  // Export settings as JSON
  const exportSettings = useCallback(async (): Promise<SettingsExport | null> => {
    if (!account || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/settings/${account}/export`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const exportData: SettingsExport = await response.json();
      return exportData;
    } catch (err) {
      console.error('Error exporting settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to export settings');
      return null;
    }
  }, [account, isConnected]);

  // Import settings from JSON
  const importSettings = useCallback(async (importData: SettingsExport): Promise<boolean> => {
    if (!account || !isConnected) {
      throw new Error('Wallet not connected');
    }

    // Validate import data
    if (importData.wallet_address.toLowerCase() !== account.toLowerCase()) {
      throw new Error('Import data is for a different wallet address');
    }

    return await saveSettings(importData.settings);
  }, [account, isConnected, saveSettings]);

  // Update specific setting
  const updateSetting = useCallback(async <K extends keyof WalletSettings>(
    key: K,
    value: WalletSettings[K]
  ): Promise<boolean> => {
    if (!settings) {
      throw new Error('No settings loaded');
    }

    const updatedSettings = {
      ...settings,
      [key]: value,
    };

    // Update local state optimistically
    setSettings(updatedSettings);

    // Save to backend
    const success = await saveSettings({ [key]: value });
    
    if (!success && settings) {
      // Revert on failure
      setSettings(settings);
    }

    return success;
  }, [settings, saveSettings]);

  // Load settings when wallet connects or changes
  useEffect(() => {
    let mounted = true;
    
    const loadSettings = async () => {
      if (isConnected && account && mounted) {
        await fetchSettings();
      } else if (mounted) {
        setSettings(null);
        setError(null);
      }
    };

    // Add a small delay to ensure wallet connection is stable
    const timeoutId = setTimeout(loadSettings, 100);
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [isConnected, account, fetchSettings]);

  return {
    settings,
    isLoading,
    isSaving,
    error,
    fetchSettings,
    saveSettings,
    updateSetting,
    resetSettings,
    deleteSettings,
    exportSettings,
    importSettings,
    createDefaultSettings,
  };
};
