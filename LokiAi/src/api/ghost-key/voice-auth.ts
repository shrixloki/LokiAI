import { AUTH_CONFIG } from '@/config/auth-config'

// Voice feature interfaces
export interface VoiceFeatures {
  mfcc: number[]
  spectralCentroid: number
  spectralFlatness: number
  spectralRolloff: number
  spectralFlux: number
  perceptualSpread: number
  perceptualSharpness: number
  spectralKurtosis: number
  zcr: number
  rms: number
  energy: number
  pitch?: {
    mean: number
    variance: number
    range: number
  }
  jitter?: number
  shimmer?: number
  speakingRate?: number
  formants?: number[]
}

export interface AggregatedVoiceFeatures {
  mfccMean: number[]
  mfccVariance: number[]
  spectralCentroidMean: number
  spectralCentroidVariance: number
  spectralFlatnessMean: number
  spectralFlatnessVariance: number
  spectralRolloffMean: number
  spectralRolloffVariance: number
  spectralFluxMean: number
  spectralFluxVariance: number
  perceptualSpreadMean: number
  perceptualSpreadVariance: number
  perceptualSharpnessMean: number
  perceptualSharpnessVariance: number
  spectralKurtosisMean: number
  spectralKurtosisVariance: number
  zcrMean: number
  zcrVariance: number
  rmsMean: number
  rmsVariance: number
  energyMean: number
  energyVariance: number
  pitchMean?: number
  pitchVariance?: number
  pitchRange?: number
  jitter?: number
  shimmer?: number
  speakingRate?: number
  formantsMean?: number[]
  formantsVariance?: number[]
}

export interface RobustSimilarityResult {
  overallSimilarity: number
  pitchNormalizedSimilarity: number
  tempoNormalizedSimilarity: number
  spectralSimilarity: number
  voiceQualitySimilarity: number
  confidenceScore: number
  detailedMetrics: {
    mfccDistance: number
    spectralCentroidDiff: number
    zcrDiff: number
    pitchDiff: number | null
    energyDiff: number
  }
}

// Normalize pitch features to handle voice changes
function normalizePitchFeatures(features: AggregatedVoiceFeatures): AggregatedVoiceFeatures {
  const normalized = { ...features }

  // Normalize pitch to relative values if available
  if (features.pitchMean && features.pitchMean > 0) {
    // Convert to log scale for better pitch comparison
    normalized.pitchMean = Math.log(features.pitchMean)
  }

  return normalized
}

// Normalize tempo-related features
function normalizeTempoFeatures(features: AggregatedVoiceFeatures): AggregatedVoiceFeatures {
  const normalized = { ...features }

  // Normalize speaking rate and temporal features
  if (features.speakingRate && features.speakingRate > 0) {
    // Convert to relative tempo
    normalized.speakingRate = Math.log(features.speakingRate)
  }

  // Normalize ZCR (related to speech rate)
  if (features.zcrMean > 0) {
    normalized.zcrMean = Math.log(features.zcrMean + 1)
  }

  return normalized
}

// Normalize energy and spectral features
function normalizeSpectralFeatures(features: AggregatedVoiceFeatures): AggregatedVoiceFeatures {
  const normalized = { ...features }

  // Normalize energy features
  if (features.energyMean > 0) {
    normalized.energyMean = Math.log(features.energyMean + 1)
  }

  if (features.rmsMean > 0) {
    normalized.rmsMean = Math.log(features.rmsMean + 1)
  }

  // Normalize spectral centroid (related to brightness)
  if (features.spectralCentroidMean > 0) {
    normalized.spectralCentroidMean = Math.log(features.spectralCentroidMean)
  }

  return normalized
}

// Calculate robust similarity score that handles voice variations
export function calculateRobustSimilarityScore(
  features1: AggregatedVoiceFeatures,
  features2: AggregatedVoiceFeatures,
): RobustSimilarityResult {
  // Validate input features
  if (
    !features1.mfccMean ||
    !features2.mfccMean ||
    features1.mfccMean.length === 0 ||
    features2.mfccMean.length === 0
  ) {
    throw new Error("Invalid MFCC features for comparison")
  }

  // Apply different normalization strategies
  const pitchNorm1 = normalizePitchFeatures(features1)
  const pitchNorm2 = normalizePitchFeatures(features2)

  const tempoNorm1 = normalizeTempoFeatures(features1)
  const tempoNorm2 = normalizeTempoFeatures(features2)

  const spectralNorm1 = normalizeSpectralFeatures(features1)
  const spectralNorm2 = normalizeSpectralFeatures(features2)

  // Calculate MFCC similarity (most robust feature)
  let mfccDistance = 0
  const mfccLength = Math.min(features1.mfccMean.length, features2.mfccMean.length)
  for (let i = 0; i < mfccLength; i++) {
    const diff = features1.mfccMean[i] - features2.mfccMean[i]
    mfccDistance += diff * diff
  }
  mfccDistance = Math.sqrt(mfccDistance / mfccLength)

  // Calculate spectral similarity
  const spectralCentroidDiff = Math.abs(spectralNorm1.spectralCentroidMean - spectralNorm2.spectralCentroidMean)
  const spectralFlatnessDiff = Math.abs(features1.spectralFlatnessMean - features2.spectralFlatnessMean)
  const spectralRolloffDiff = Math.abs(features1.spectralRolloffMean - features2.spectralRolloffMean)

  // Calculate temporal similarity
  const zcrDiff = Math.abs(tempoNorm1.zcrMean - tempoNorm2.zcrMean)
  const energyDiff = Math.abs(spectralNorm1.energyMean - spectralNorm2.energyMean)

  // Calculate pitch similarity (if available)
  let pitchDiff: number | null = null
  if (pitchNorm1.pitchMean && pitchNorm2.pitchMean) {
    pitchDiff = Math.abs(pitchNorm1.pitchMean - pitchNorm2.pitchMean)
  }

  // Calculate voice quality similarity
  const perceptualSpreadDiff = Math.abs(features1.perceptualSpreadMean - features2.perceptualSpreadMean)
  const perceptualSharpnessDiff = Math.abs(features1.perceptualSharpnessMean - features2.perceptualSharpnessMean)

  // Similarity calculations
  const mfccSimilarity = Math.max(0, 1 - mfccDistance / 2.0)
  const spectralSimilarity = Math.max(
    0,
    1 - ((0.4 * spectralCentroidDiff) / 1.0 + (0.3 * spectralFlatnessDiff) / 0.3 + (0.3 * spectralRolloffDiff) / 1.0),
  )
  const voiceQualitySimilarity = Math.max(
    0,
    1 - ((0.5 * perceptualSpreadDiff) / 0.3 + (0.5 * perceptualSharpnessDiff) / 0.3),
  )
  const tempoSimilarity = Math.max(0, 1 - ((0.6 * zcrDiff) / 0.5 + (0.4 * energyDiff) / 1.0))
  const pitchSimilarity = pitchDiff !== null ? Math.max(0, 1 - pitchDiff / 1.0) : 0.5

  // Calculate normalized similarities
  const pitchNormalizedSimilarity = mfccSimilarity * 0.7 + spectralSimilarity * 0.2 + pitchSimilarity * 0.1
  const tempoNormalizedSimilarity = mfccSimilarity * 0.6 + spectralSimilarity * 0.3 + tempoSimilarity * 0.1

  // Overall similarity with strict weighting - emphasize MFCC more
  const overallSimilarity =
    mfccSimilarity * 0.6 + // MFCC - increased weight for most reliable feature
    spectralSimilarity * 0.25 + // Spectral features
    voiceQualitySimilarity * 0.1 + // Voice quality
    tempoSimilarity * 0.03 + // Temporal features
    pitchSimilarity * 0.02 // Pitch

  // Calculate confidence score based on feature consistency
  const featureConsistency = [
    mfccSimilarity,
    spectralSimilarity,
    voiceQualitySimilarity,
    tempoSimilarity,
    pitchSimilarity,
  ]

  const meanSimilarity = featureConsistency.reduce((a, b) => a + b, 0) / featureConsistency.length
  const variance =
    featureConsistency.reduce((sum, sim) => sum + Math.pow(sim - meanSimilarity, 2), 0) / featureConsistency.length
  const confidenceScore = Math.max(0, 1 - variance * 2)

  return {
    overallSimilarity,
    pitchNormalizedSimilarity,
    tempoNormalizedSimilarity,
    spectralSimilarity,
    voiceQualitySimilarity,
    confidenceScore,
    detailedMetrics: {
      mfccDistance,
      spectralCentroidDiff,
      zcrDiff,
      pitchDiff,
      energyDiff,
    },
  }
}

// Helper function to calculate average features across multiple samples
function calculateAverageFeatures(features: AggregatedVoiceFeatures[]): AggregatedVoiceFeatures {
  if (features.length === 0) {
    throw new Error("No features to average")
  }

  // Initialize with the structure of the first feature
  const result: any = {}
  const firstFeature = features[0]

  // For each property in the first feature
  for (const key in firstFeature) {
    if (Array.isArray(firstFeature[key])) {
      // Handle arrays (like MFCC)
      const arrayLength = firstFeature[key].length
      result[key] = new Array(arrayLength).fill(0)

      // Sum all values
      for (const feature of features) {
        for (let i = 0; i < arrayLength; i++) {
          result[key][i] += feature[key][i]
        }
      }

      // Calculate average
      for (let i = 0; i < arrayLength; i++) {
        result[key][i] /= features.length
      }
    } else if (typeof firstFeature[key] === "number") {
      // Handle numeric values
      result[key] = 0

      // Sum all values
      for (const feature of features) {
        result[key] += feature[key]
      }

      // Calculate average
      result[key] /= features.length
    } else {
      // Copy other values as is
      result[key] = firstFeature[key]
    }
  }

  return result as AggregatedVoiceFeatures
}

export async function registerVoiceProfile(requestData: {
  username: string
  features: AggregatedVoiceFeatures[]
  sampleCount: number
}) {
  try {
    const { username, features, sampleCount } = requestData

    if (!username) {
      return { error: "Username is required", success: false }
    }

    // Validate that we have features
    if (features.length === 0) {
      return {
        error: "No voice features extracted. Please ensure audio quality is sufficient.",
        success: false,
      }
    }

    // Validate feature structure
    for (const feature of features) {
      if (!feature.mfccMean || !Array.isArray(feature.mfccMean)) {
        return {
          error: "Invalid voice features detected. Please try recording again.",
          success: false,
        }
      }
    }

    // Create voice profile metadata with extracted features
    const voiceProfile = {
      username,
      sampleCount,
      passphrase: "I'll Always Choose You",
      createdAt: new Date().toISOString(),
      modelType: "voice_biometric",
      version: "1.0",
      features,
      // Calculate average features across all samples for the reference model
      referenceModel: calculateAverageFeatures(features),
    }

    // Save voice profile to localStorage
    const profileKey = `ghost_key_voice_${username}`
    localStorage.setItem(profileKey, JSON.stringify(voiceProfile))

    console.log(`Voice profile created for ${username} with ${sampleCount} samples and biometric features`)

    return {
      success: true,
      message: "Voice profile registered successfully with biometric features",
      sampleCount,
      featureCount: features.length,
    }
  } catch (error) {
    console.error("Voice registration failed:", error)
    return { error: "Voice registration failed", success: false }
  }
}

export async function verifyVoiceAuth(requestData: {
  username: string
  features: AggregatedVoiceFeatures
}) {
  try {
    const { username, features } = requestData

    if (!username || !features) {
      return { error: "Username and voice features are required", success: false }
    }

    // Check if voice profile exists
    const profileKey = `ghost_key_voice_${username}`
    const profileDataStr = localStorage.getItem(profileKey)

    if (!profileDataStr) {
      return {
        success: false,
        error: "No voice profile found for this user",
      }
    }

    // Load voice profile
    const voiceProfile = JSON.parse(profileDataStr)

    // Compare extracted features with the reference model using robust similarity
    const referenceModel = voiceProfile.referenceModel

    // Calculate robust similarity score that handles voice variations
    const similarityResult = calculateRobustSimilarityScore(features, referenceModel)

    // Use configurable threshold
    const SIMILARITY_THRESHOLD = AUTH_CONFIG.VOICE_SIMILARITY_THRESHOLD
    const success = similarityResult.overallSimilarity >= SIMILARITY_THRESHOLD

    // Enhanced logging with robustness metrics
    const verificationLog = {
      timestamp: new Date().toISOString(),
      username,
      success,
      similarityScore: similarityResult.overallSimilarity,
      threshold: SIMILARITY_THRESHOLD,
      robustnessMetrics: {
        pitchNormalizedSimilarity: similarityResult.pitchNormalizedSimilarity,
        tempoNormalizedSimilarity: similarityResult.tempoNormalizedSimilarity,
        spectralSimilarity: similarityResult.spectralSimilarity,
        voiceQualitySimilarity: similarityResult.voiceQualitySimilarity,
        confidenceScore: similarityResult.confidenceScore,
      },
      detailedMetrics: {
        mfccDistance: similarityResult.detailedMetrics.mfccDistance,
        spectralCentroidDiff: similarityResult.detailedMetrics.spectralCentroidDiff,
        zcrDiff: similarityResult.detailedMetrics.zcrDiff,
        pitchDiff: similarityResult.detailedMetrics.pitchDiff,
        energyDiff: similarityResult.detailedMetrics.energyDiff,
      },
    }

    // Store verification log
    const logKey = `ghost_key_voice_log`
    const existingLogs = JSON.parse(localStorage.getItem(logKey) || '[]')
    existingLogs.push(verificationLog)
    localStorage.setItem(logKey, JSON.stringify(existingLogs.slice(-100))) // Keep last 100 entries

    return {
      success,
      similarityScore: similarityResult.overallSimilarity,
      threshold: SIMILARITY_THRESHOLD,
      message: success ? "Voice authentication successful" : "Voice authentication failed",
      robustnessMetrics: verificationLog.robustnessMetrics,
      detailedMetrics: verificationLog.detailedMetrics,
      confidenceLevel:
        similarityResult.confidenceScore > 0.8 ? "high" : similarityResult.confidenceScore > 0.6 ? "medium" : "low",
    }
  } catch (error) {
    console.error("Voice verification failed:", error)
    return { error: "Voice verification failed", success: false }
  }
}