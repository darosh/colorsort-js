import { SpectralFeatures } from './metrics-spectral.ts'
import { cosineSimilarity, euclideanDistance, gaussianSimilarity, pearsonCorrelation } from './similarity.ts'

interface SimilarityResult {
  overall: number // 0-1, higher = more similar
  structural: number // Based on frequency domain patterns
  perceptual: number // Based on color space distributions
  breakdown: {
    smoothnessSimilarity: number
    complexitySimilarity: number
    energyDistributionSimilarity: number
    centroidSimilarity: number
    rolloffSimilarity: number
    spectrumCorrelation: number
  }
  interpretation: string
}

/**
 * Compare two palettes using their spectral features
 * Returns similarity score from 0 (completely different) to 1 (identical)
 */
export function compareSpectralFeatures(features1: SpectralFeatures, features2: SpectralFeatures): SimilarityResult {
  // 1. Compare scalar metrics with Gaussian similarity
  const smoothnessSim = gaussianSimilarity(features1.smoothness, features2.smoothness, 1.0)

  const complexitySim = gaussianSimilarity(features1.complexity, features2.complexity, 0.5)

  // 2. Compare energy distribution using cosine similarity
  const energy1 = [features1.energyRatios.lowFreq, features1.energyRatios.midFreq, features1.energyRatios.highFreq]
  const energy2 = [features2.energyRatios.lowFreq, features2.energyRatios.midFreq, features2.energyRatios.highFreq]
  const energySim = cosineSimilarity(energy1, energy2)

  // 3. Compare spectral centroids (average across all channels)
  const centroid1 = [features1.spectralCentroid.lightness, features1.spectralCentroid.a, features1.spectralCentroid.b, features1.spectralCentroid.chroma]
  const centroid2 = [features2.spectralCentroid.lightness, features2.spectralCentroid.a, features2.spectralCentroid.b, features2.spectralCentroid.chroma]
  const centroidSim = 1 - euclideanDistance(centroid1, centroid2) / Math.sqrt(4)

  // 4. Compare spectral rolloff
  const rolloff1 = [features1.spectralRolloff.lightness, features1.spectralRolloff.a, features1.spectralRolloff.b, features1.spectralRolloff.chroma]
  const rolloff2 = [features2.spectralRolloff.lightness, features2.spectralRolloff.a, features2.spectralRolloff.b, features2.spectralRolloff.chroma]
  const rolloffSim = 1 - euclideanDistance(rolloff1, rolloff2) / Math.sqrt(4)

  // 5. Compare full spectra using correlation (most important!)
  const chromaCorr = pearsonCorrelation(features1.chromaSpectrum, features2.chromaSpectrum)
  const aCorr = pearsonCorrelation(features1.aSpectrum, features2.aSpectrum)
  const bCorr = pearsonCorrelation(features1.bSpectrum, features2.bSpectrum)
  const lightnessCorr = pearsonCorrelation(features1.lightnessSpectrum, features2.lightnessSpectrum)

  // Average spectrum correlation
  const spectrumCorr = (chromaCorr + aCorr + bCorr + lightnessCorr) / 4

  // Weighted combination for overall similarity
  // Spectrum correlation is most important (50%)
  // Energy distribution captures rhythm (20%)
  // Smoothness captures transition style (15%)
  // Centroid/rolloff capture overall shape (15%)
  const structural = spectrumCorr * 0.5 + energySim * 0.2 + smoothnessSim * 0.15 + ((centroidSim + rolloffSim) / 2) * 0.15

  // Perceptual similarity (centroid-based, focuses on color distribution)
  const perceptual = centroidSim * 0.4 + rolloffSim * 0.3 + energySim * 0.3

  // Overall similarity (blend structural and perceptual)
  const overall = structural * 0.7 + perceptual * 0.3

  // Interpretation
  let interpretation: string

  if (overall > 0.9) {
    interpretation = 'Nearly Identical Structure'
  } else if (overall > 0.75) {
    interpretation = 'Very Similar Structure'
  } else if (overall > 0.6) {
    interpretation = 'Similar Structure'
  } else if (overall > 0.45) {
    interpretation = 'Somewhat Similar'
  } else if (overall > 0.3) {
    interpretation = 'Somewhat Different'
  } else {
    interpretation = 'Very Different Structure'
  }

  return {
    overall,
    structural,
    perceptual,
    breakdown: {
      smoothnessSimilarity: smoothnessSim,
      complexitySimilarity: complexitySim,
      energyDistributionSimilarity: energySim,
      centroidSimilarity: centroidSim,
      rolloffSimilarity: rolloffSim,
      spectrumCorrelation: spectrumCorr
    },
    interpretation
  }
}
