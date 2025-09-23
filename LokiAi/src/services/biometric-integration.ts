/**
 * Biometric Integration Service
 * Manages the complete integration of biometric authentication with Loki AI system
 */

export interface BiometricIntegrationStatus {
  isComplete: boolean
  keystrokeModelTrained: boolean
  voiceModelTrained: boolean
  securityLevel: 'none' | 'partial' | 'full'
  featuresUnlocked: string[]
  setupTimestamp?: number
}

export class BiometricIntegrationService {
  private static instance: BiometricIntegrationService
  
  public static getInstance(): BiometricIntegrationService {
    if (!BiometricIntegrationService.instance) {
      BiometricIntegrationService.instance = new BiometricIntegrationService()
    }
    return BiometricIntegrationService.instance
  }

  /**
   * Check the current biometric integration status
   */
  public checkIntegrationStatus(userAddress: string): BiometricIntegrationStatus {
    const setupComplete = localStorage.getItem('biometric_setup_complete') === 'true'
    const securityLevel = localStorage.getItem('loki_ai_security_level') as 'none' | 'partial' | 'full'
    const setupTimestamp = localStorage.getItem('biometric_setup_timestamp')
    
    // Try to find models with different possible usernames
    const possibleUsernames = [userAddress, 'user', 'loki']
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
    
    // Determine unlocked features based on security level
    const featuresUnlocked = this.getFeaturesForSecurityLevel(currentSecurityLevel)
    
    return {
      isComplete,
      keystrokeModelTrained,
      voiceModelTrained,
      securityLevel: currentSecurityLevel,
      featuresUnlocked,
      setupTimestamp: setupTimestamp ? parseInt(setupTimestamp) : undefined
    }
  }

  /**
   * Complete the biometric integration process
   */
  public completeBiometricIntegration(userAddress: string): boolean {
    try {
      console.log('🎉 Completing biometric integration for user:', userAddress)
      
      // Try to find models with different possible usernames
      const possibleUsernames = [userAddress, 'user', 'loki']
      let keystrokeModel = null
      let voiceModel = null
      let actualUsername = userAddress
      
      // Search for keystroke model
      for (const username of possibleUsernames) {
        const model = localStorage.getItem(`ghost_key_model_${username}`)
        if (model) {
          keystrokeModel = model
          actualUsername = username
          console.log('✅ Found keystroke model for username:', username)
          break
        }
      }
      
      // Search for voice model using the same username
      voiceModel = localStorage.getItem(`ghost_key_voice_${actualUsername}`)
      if (!voiceModel) {
        // Try other usernames for voice model
        for (const username of possibleUsernames) {
          const model = localStorage.getItem(`ghost_key_voice_${username}`)
          if (model) {
            voiceModel = model
            console.log('✅ Found voice model for username:', username)
            break
          }
        }
      }
      
      if (!keystrokeModel) {
        console.error('❌ Keystroke model not found for any username:', possibleUsernames)
        return false
      }
      
      if (!voiceModel) {
        console.error('❌ Voice model not found for any username:', possibleUsernames)
        return false
      }
      
      console.log('✅ Both models found using username:', actualUsername)
      
      // Mark integration as complete
      localStorage.setItem('biometric_setup_complete', 'true')
      localStorage.setItem('biometric_setup_timestamp', Date.now().toString())
      localStorage.setItem('loki_ai_security_level', 'full')
      
      // Update user preferences
      const userPrefs = JSON.parse(localStorage.getItem('loki_ai_user_preferences') || '{}')
      userPrefs.biometricAuthEnabled = true
      userPrefs.securityLevel = 'enterprise'
      userPrefs.featuresUnlocked = this.getFeaturesForSecurityLevel('full')
      userPrefs.lastUpdated = Date.now()
      localStorage.setItem('loki_ai_user_preferences', JSON.stringify(userPrefs))
      
      // Store integration metadata
      const integrationData = {
        userAddress,
        completedAt: Date.now(),
        keystrokeModelId: this.extractModelId(keystrokeModel),
        voiceModelId: this.extractModelId(voiceModel),
        version: '1.0.0'
      }
      localStorage.setItem('loki_ai_biometric_integration', JSON.stringify(integrationData))
      
      console.log('✅ Biometric integration completed successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to complete biometric integration:', error)
      return false
    }
  }

  /**
   * Reset biometric integration
   */
  public resetBiometricIntegration(userAddress: string): boolean {
    try {
      console.log('🔄 Resetting biometric integration for user:', userAddress)
      
      // Remove integration status
      localStorage.removeItem('biometric_setup_complete')
      localStorage.removeItem('biometric_setup_timestamp')
      localStorage.removeItem('loki_ai_security_level')
      localStorage.removeItem('loki_ai_biometric_integration')
      
      // Remove biometric models
      localStorage.removeItem(`ghost_key_model_${userAddress}`)
      localStorage.removeItem(`ghost_key_voice_${userAddress}`)
      localStorage.removeItem(`voice_profile_${userAddress}`)
      
      // Reset user preferences
      const userPrefs = JSON.parse(localStorage.getItem('loki_ai_user_preferences') || '{}')
      userPrefs.biometricAuthEnabled = false
      userPrefs.securityLevel = 'basic'
      userPrefs.featuresUnlocked = this.getFeaturesForSecurityLevel('none')
      userPrefs.lastUpdated = Date.now()
      localStorage.setItem('loki_ai_user_preferences', JSON.stringify(userPrefs))
      
      console.log('✅ Biometric integration reset successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to reset biometric integration:', error)
      return false
    }
  }

  /**
   * Get features unlocked for a given security level
   */
  private getFeaturesForSecurityLevel(level: 'none' | 'partial' | 'full'): string[] {
    switch (level) {
      case 'full':
        return [
          'agents',
          'trading',
          'analytics', 
          'advanced_security',
          'portfolio_management',
          'ai_insights',
          'automated_strategies',
          'risk_management',
          'real_time_monitoring',
          'custom_alerts'
        ]
      case 'partial':
        return [
          'basic_analytics',
          'portfolio_view',
          'simple_trading'
        ]
      case 'none':
      default:
        return ['wallet_connection', 'basic_info']
    }
  }

  /**
   * Extract model ID from stored model data
   */
  private extractModelId(modelData: string): string {
    try {
      const parsed = JSON.parse(modelData)
      return parsed.modelId || parsed.username || 'unknown'
    } catch {
      return 'unknown'
    }
  }

  /**
   * Check if a specific feature is unlocked
   */
  public isFeatureUnlocked(userAddress: string, feature: string): boolean {
    const status = this.checkIntegrationStatus(userAddress)
    return status.featuresUnlocked.includes(feature)
  }

  /**
   * Get user's current security level
   */
  public getSecurityLevel(userAddress: string): 'none' | 'partial' | 'full' {
    const status = this.checkIntegrationStatus(userAddress)
    return status.securityLevel
  }

  /**
   * Check if biometric setup is required for a feature
   */
  public requiresBiometricSetup(feature: string): boolean {
    const fullSecurityFeatures = this.getFeaturesForSecurityLevel('full')
    return fullSecurityFeatures.includes(feature)
  }
}

// Export singleton instance
export const biometricIntegration = BiometricIntegrationService.getInstance()