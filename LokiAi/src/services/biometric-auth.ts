import { AUTH_CONFIG } from '@/config/auth-config';

export interface BiometricAuthResult {
  success: boolean;
  method: 'keystroke' | 'voice' | 'combined';
  confidence: number;
  message: string;
  fallbackRequired?: boolean;
}

export interface BiometricProfile {
  username: string;
  keystrokeProfile?: any;
  voiceProfile?: any;
  isComplete: boolean;
  createdAt: number;
  lastUsed: number;
}

export class BiometricAuthService {
  private static instance: BiometricAuthService;
  private backendUrl = 'http://127.0.0.1:25001';

  private constructor() {}

  static getInstance(): BiometricAuthService {
    if (!BiometricAuthService.instance) {
      BiometricAuthService.instance = new BiometricAuthService();
    }
    return BiometricAuthService.instance;
  }

  /**
   * Check if biometric setup is complete for a user
   */
  async checkBiometricStatus(username: string): Promise<BiometricProfile> {
    try {
      // For now, check localStorage (in production, this would be a backend call)
      const keystrokeData = localStorage.getItem(`keystroke_training_${username}`);
      const voiceData = localStorage.getItem(`voice_profile_${username}`);
      
      const keystrokeProfile = keystrokeData ? JSON.parse(keystrokeData) : null;
      const voiceProfile = voiceData ? JSON.parse(voiceData) : null;
      
      const keystrokeComplete = keystrokeProfile && keystrokeProfile.length >= AUTH_CONFIG.SAMPLES_REQUIRED;
      const voiceComplete = !!voiceProfile;
      
      return {
        username,
        keystrokeProfile,
        voiceProfile,
        isComplete: keystrokeComplete && voiceComplete,
        createdAt: Math.min(
          keystrokeProfile?.timestamp || Date.now(),
          voiceProfile?.timestamp || Date.now()
        ),
        lastUsed: Math.max(
          keystrokeProfile?.lastUsed || 0,
          voiceProfile?.lastUsed || 0
        )
      };
    } catch (error) {
      console.error('Error checking biometric status:', error);
      return {
        username,
        isComplete: false,
        createdAt: Date.now(),
        lastUsed: 0
      };
    }
  }

  /**
   * Authenticate user using biometric data
   */
  async authenticate(
    username: string, 
    keystrokeData?: any, 
    voiceData?: Blob
  ): Promise<BiometricAuthResult> {
    try {
      const profile = await this.checkBiometricStatus(username);
      
      if (!profile.isComplete) {
        return {
          success: false,
          method: 'combined',
          confidence: 0,
          message: 'Biometric setup incomplete. Please complete registration first.',
          fallbackRequired: false
        };
      }

      // Try keystroke authentication first
      if (keystrokeData && profile.keystrokeProfile) {
        const keystrokeResult = await this.authenticateKeystroke(username, keystrokeData);
        
        if (keystrokeResult.success) {
          // Update last used timestamp
          this.updateLastUsed(username, 'keystroke');
          
          return {
            success: true,
            method: 'keystroke',
            confidence: keystrokeResult.confidence,
            message: 'Authentication successful with keystroke dynamics'
          };
        }
        
        // If keystroke fails, try voice fallback
        if (voiceData && profile.voiceProfile) {
          const voiceResult = await this.authenticateVoice(username, voiceData);
          
          if (voiceResult.success) {
            this.updateLastUsed(username, 'voice');
            
            return {
              success: true,
              method: 'voice',
              confidence: voiceResult.confidence,
              message: 'Authentication successful with voice biometrics (fallback)'
            };
          }
        }
        
        return {
          success: false,
          method: 'combined',
          confidence: Math.max(keystrokeResult.confidence, voiceData ? 0.3 : 0),
          message: 'Authentication failed with both keystroke and voice methods',
          fallbackRequired: false
        };
      }

      // If only voice data provided
      if (voiceData && profile.voiceProfile) {
        const voiceResult = await this.authenticateVoice(username, voiceData);
        this.updateLastUsed(username, 'voice');
        
        return {
          success: voiceResult.success,
          method: 'voice',
          confidence: voiceResult.confidence,
          message: voiceResult.success 
            ? 'Authentication successful with voice biometrics'
            : 'Voice authentication failed'
        };
      }

      return {
        success: false,
        method: 'combined',
        confidence: 0,
        message: 'No biometric data provided for authentication'
      };

    } catch (error) {
      console.error('Biometric authentication error:', error);
      return {
        success: false,
        method: 'combined',
        confidence: 0,
        message: 'Authentication system error'
      };
    }
  }

  /**
   * Authenticate using keystroke dynamics
   */
  private async authenticateKeystroke(username: string, keystrokeData: any): Promise<{success: boolean, confidence: number}> {
    try {
      // In production, this would call the Rust backend
      // For now, simulate the authentication process
      
      const profile = localStorage.getItem(`keystroke_training_${username}`);
      if (!profile) {
        return { success: false, confidence: 0 };
      }

      const trainingData = JSON.parse(profile);
      
      // Mock keystroke comparison (in production, use the Rust autoencoder model)
      const similarity = this.calculateKeystrokeSimilarity(keystrokeData, trainingData);
      const threshold = AUTH_CONFIG.AUTOENCODER_THRESHOLD;
      
      return {
        success: similarity > (1 - threshold), // Convert threshold to similarity score
        confidence: similarity
      };
    } catch (error) {
      console.error('Keystroke authentication error:', error);
      return { success: false, confidence: 0 };
    }
  }

  /**
   * Authenticate using voice biometrics
   */
  private async authenticateVoice(username: string, voiceData: Blob): Promise<{success: boolean, confidence: number}> {
    try {
      const profile = localStorage.getItem(`voice_profile_${username}`);
      if (!profile) {
        return { success: false, confidence: 0 };
      }

      const voiceProfile = JSON.parse(profile);
      
      // Mock voice comparison (in production, extract features and compare)
      const similarity = Math.random() * 0.4 + 0.6; // Mock similarity between 0.6-1.0
      const threshold = AUTH_CONFIG.VOICE_SIMILARITY_THRESHOLD;
      
      return {
        success: similarity > threshold,
        confidence: similarity
      };
    } catch (error) {
      console.error('Voice authentication error:', error);
      return { success: false, confidence: 0 };
    }
  }

  /**
   * Calculate keystroke similarity (mock implementation)
   */
  private calculateKeystrokeSimilarity(current: any, training: any[]): number {
    // Mock similarity calculation
    // In production, this would use the trained autoencoder model
    return Math.random() * 0.3 + 0.7; // Mock similarity between 0.7-1.0
  }

  /**
   * Update last used timestamp for biometric method
   */
  private updateLastUsed(username: string, method: 'keystroke' | 'voice'): void {
    try {
      const key = method === 'keystroke' 
        ? `keystroke_training_${username}` 
        : `voice_profile_${username}`;
      
      const data = localStorage.getItem(key);
      if (data) {
        const profile = JSON.parse(data);
        profile.lastUsed = Date.now();
        localStorage.setItem(key, JSON.stringify(profile));
      }
    } catch (error) {
      console.error('Error updating last used timestamp:', error);
    }
  }

  /**
   * Get authentication statistics
   */
  async getAuthStats(username: string): Promise<{
    totalAttempts: number;
    successfulAttempts: number;
    keystrokeSuccessRate: number;
    voiceSuccessRate: number;
    lastAuthentication: number;
  }> {
    // Mock statistics (in production, retrieve from backend)
    return {
      totalAttempts: 26,
      successfulAttempts: 24,
      keystrokeSuccessRate: 0.92,
      voiceSuccessRate: 0.88,
      lastAuthentication: Date.now() - 3600000 // 1 hour ago
    };
  }

  /**
   * Reset biometric data for a user
   */
  async resetBiometricData(username: string): Promise<boolean> {
    try {
      localStorage.removeItem(`keystroke_training_${username}`);
      localStorage.removeItem(`voice_profile_${username}`);
      return true;
    } catch (error) {
      console.error('Error resetting biometric data:', error);
      return false;
    }
  }

  /**
   * Export biometric profile for backup
   */
  async exportProfile(username: string): Promise<string | null> {
    try {
      const profile = await this.checkBiometricStatus(username);
      return JSON.stringify(profile, null, 2);
    } catch (error) {
      console.error('Error exporting profile:', error);
      return null;
    }
  }
}

// Export singleton instance
export const biometricAuth = BiometricAuthService.getInstance();