import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { biometricAuth, BiometricProfile, BiometricAuthResult } from '@/services/biometric-auth';
import { useMetaMask } from '@/hooks/useMetaMask';
import { useToast } from '@/hooks/use-toast';

interface BiometricAuthContextType {
  profile: BiometricProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastAuthResult: BiometricAuthResult | null;

  // Actions
  checkStatus: () => Promise<void>;
  authenticate: (keystrokeData?: any, voiceData?: Blob) => Promise<BiometricAuthResult>;
  resetProfile: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;

  // Status helpers
  isSetupComplete: boolean;
  needsKeystrokeSetup: boolean;
  needsVoiceSetup: boolean;
  securityLevel: 'none' | 'partial' | 'full';
}

const BiometricAuthContext = createContext<BiometricAuthContextType | undefined>(undefined);

interface BiometricAuthProviderProps {
  children: ReactNode;
}

export function BiometricAuthProvider({ children }: BiometricAuthProviderProps) {
  const { account, isConnected } = useMetaMask();
  const { toast } = useToast();

  const [profile, setProfile] = useState<BiometricProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAuthResult, setLastAuthResult] = useState<BiometricAuthResult | null>(null);

  // Derived state - check biometric integration status directly
  const getBiometricStatus = () => {
    if (!account) return { isComplete: false, securityLevel: 'none' as const, keystrokeModelTrained: false, voiceModelTrained: false }
    
    try {
      // Check integration status directly from localStorage
      const setupComplete = localStorage.getItem('biometric_setup_complete') === 'true'
      const securityLevel = localStorage.getItem('loki_ai_security_level') as 'none' | 'partial' | 'full'
      
      // Try to find models with different possible usernames
      const possibleUsernames = [account, 'user', 'loki']
      let keystrokeModel = null
      let voiceModel = null
      
      // Search for models
      for (const username of possibleUsernames) {
        if (!keystrokeModel) {
          keystrokeModel = localStorage.getItem(`ghost_key_model_${username}`)
        }
        if (!voiceModel) {
          voiceModel = localStorage.getItem(`ghost_key_voice_${username}`)
        }
      }
      
      const keystrokeModelTrained = !!keystrokeModel
      const voiceModelTrained = !!voiceModel
      const isComplete = setupComplete && keystrokeModelTrained && voiceModelTrained
      
      // Determine security level
      let currentSecurityLevel: 'none' | 'partial' | 'full' = 'none'
      if (keystrokeModelTrained && voiceModelTrained) {
        currentSecurityLevel = 'full'
      } else if (keystrokeModelTrained || voiceModelTrained) {
        currentSecurityLevel = 'partial'
      }
      
      console.log('🔍 Biometric status check:', {
        account,
        setupComplete,
        keystrokeModelTrained,
        voiceModelTrained,
        isComplete,
        currentSecurityLevel
      })
      
      return { 
        isComplete, 
        securityLevel: currentSecurityLevel, 
        keystrokeModelTrained, 
        voiceModelTrained 
      }
    } catch (error) {
      console.error('Failed to check biometric status:', error)
      return { isComplete: false, securityLevel: 'none' as const, keystrokeModelTrained: false, voiceModelTrained: false }
    }
  }

  const biometricStatus = getBiometricStatus()
  const isSetupComplete = profile?.isComplete || biometricStatus.isComplete;
  const needsKeystrokeSetup = !profile?.keystrokeProfile || !biometricStatus.keystrokeModelTrained;
  const needsVoiceSetup = !profile?.voiceProfile || !biometricStatus.voiceModelTrained;

  const securityLevel: 'none' | 'partial' | 'full' = biometricStatus.securityLevel;

  // Track previous account to detect account changes
  const [previousAccount, setPreviousAccount] = useState<string | null>(null);

  // Check biometric status when account changes
  useEffect(() => {
    if (isConnected && account) {
      // Check if this is an account change (not initial connection)
      if (previousAccount && previousAccount !== account) {
        console.log('🔄 Account changed - clearing biometric security');
        console.log(`Previous: ${previousAccount} -> Current: ${account}`);
        
        // Clear biometric security for account change
        clearBiometricSecurity(previousAccount);
        
        toast({
          title: "Account Changed",
          description: "Biometric security reset required for new account",
          variant: "default"
        });
      }
      
      setPreviousAccount(account);
      checkStatus();
    } else {
      // User disconnected - clear everything
      if (previousAccount) {
        console.log('🔄 MetaMask disconnected - clearing biometric security');
        clearBiometricSecurity(previousAccount);
        
        toast({
          title: "Wallet Disconnected", 
          description: "Biometric security cleared for security",
          variant: "default"
        });
      }
      
      setProfile(null);
      setIsAuthenticated(false);
      setPreviousAccount(null);
    }
  }, [account, isConnected]);

  const checkStatus = async () => {
    if (!account) return;

    setIsLoading(true);
    try {
      const userProfile = await biometricAuth.checkBiometricStatus(account);
      setProfile(userProfile);

      // Auto-authenticate if we have a recent successful session
      const lastAuth = localStorage.getItem(`last_auth_${account}`);
      if (lastAuth) {
        const authData = JSON.parse(lastAuth);
        const isRecent = Date.now() - authData.timestamp < 30 * 60 * 1000; // 30 minutes
        if (isRecent && authData.success) {
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Error checking biometric status:', error);
      toast({
        title: "Authentication Error",
        description: "Failed to check biometric status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const authenticate = async (keystrokeData?: any, voiceData?: Blob): Promise<BiometricAuthResult> => {
    if (!account) {
      const result: BiometricAuthResult = {
        success: false,
        method: 'combined',
        confidence: 0,
        message: 'No wallet connected'
      };
      setLastAuthResult(result);
      return result;
    }

    setIsLoading(true);
    try {
      const result = await biometricAuth.authenticate(account, keystrokeData, voiceData);
      setLastAuthResult(result);

      if (result.success) {
        setIsAuthenticated(true);

        // Store successful authentication
        localStorage.setItem(`last_auth_${account}`, JSON.stringify({
          success: true,
          method: result.method,
          timestamp: Date.now()
        }));

        toast({
          title: "Authentication Successful",
          description: result.message,
        });
      } else {
        setIsAuthenticated(false);

        toast({
          title: "Authentication Failed",
          description: result.message,
          variant: "destructive"
        });
      }

      return result;
    } catch (error) {
      console.error('Authentication error:', error);
      const result: BiometricAuthResult = {
        success: false,
        method: 'combined',
        confidence: 0,
        message: 'Authentication system error'
      };
      setLastAuthResult(result);
      setIsAuthenticated(false);

      toast({
        title: "Authentication Error",
        description: "System error during authentication",
        variant: "destructive"
      });

      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const resetProfile = async (): Promise<boolean> => {
    if (!account) return false;

    setIsLoading(true);
    try {
      const success = await biometricAuth.resetBiometricData(account);
      if (success) {
        setProfile(null);
        setIsAuthenticated(false);
        setLastAuthResult(null);

        // Clear stored authentication
        localStorage.removeItem(`last_auth_${account}`);

        toast({
          title: "Profile Reset",
          description: "Biometric profile has been reset successfully",
        });
      }
      return success;
    } catch (error) {
      console.error('Error resetting profile:', error);
      toast({
        title: "Reset Failed",
        description: "Failed to reset biometric profile",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    await checkStatus();
  };

  // Clear biometric security data for account changes/disconnection
  const clearBiometricSecurity = (accountAddress: string) => {
    try {
      console.log(`🧹 Clearing biometric security for account: ${accountAddress}`);
      
      // Clear all possible biometric data for this account
      const possibleUsernames = [accountAddress, 'user', 'loki'];
      
      possibleUsernames.forEach(username => {
        // Clear Ghost Key models
        localStorage.removeItem(`ghost_key_model_${username}`);
        localStorage.removeItem(`ghost_key_voice_${username}`);
        
        // Clear authentication sessions
        localStorage.removeItem(`last_auth_${username}`);
        
        // Clear biometric profiles
        localStorage.removeItem(`biometric_profile_${username}`);
      });
      
      // Clear global biometric settings
      localStorage.removeItem('biometric_setup_complete');
      localStorage.removeItem('loki_ai_security_level');
      localStorage.removeItem('ghost_key_training_complete');
      localStorage.removeItem('voice_training_complete');
      
      // Clear any cached biometric integration data
      localStorage.removeItem('biometric_integration_status');
      localStorage.removeItem('biometric_features_unlocked');
      
      console.log('✅ Biometric security cleared successfully');
      
      // Reset local state
      setProfile(null);
      setIsAuthenticated(false);
      setLastAuthResult(null);
      
    } catch (error) {
      console.error('❌ Error clearing biometric security:', error);
    }
  };

  const contextValue: BiometricAuthContextType = {
    profile,
    isAuthenticated,
    isLoading,
    lastAuthResult,

    checkStatus,
    authenticate,
    resetProfile,
    refreshProfile,

    isSetupComplete,
    needsKeystrokeSetup,
    needsVoiceSetup,
    securityLevel
  };

  return (
    <BiometricAuthContext.Provider value={contextValue}>
      {children}
    </BiometricAuthContext.Provider>
  );
}

export function useBiometricAuth(): BiometricAuthContextType {
  const context = useContext(BiometricAuthContext);
  if (context === undefined) {
    throw new Error('useBiometricAuth must be used within a BiometricAuthProvider');
  }
  return context;
}