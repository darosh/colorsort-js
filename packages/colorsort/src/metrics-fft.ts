import { Vector3 } from './vector.ts'
import { cosineSimilarity, euclideanDistance, manhattanDistance } from './similarity.ts'
import { energy, highFreqRatio, mean, variance } from './statistics.ts'
import { chromaticLch, fftLch } from './metrics-spectral.ts'

export type Analysis = {
  type: string
  confidence: number
  features: {
    chromaticRatio?: number
    achromaticCount?: number
    hueSpread?: number
    chromaticCount?: number
    largeGaps?: number
    avgGap?: number
    maxGap?: number
    chromaVariance?: number
    hueHighFreqRatio?: number
    chromaHighFreqRatio?: number
  }
  fingerprint?: Fingerprint
  spectra?: {
    hueDeltaMags: number[]
    chromaMags: number[]
    lightnessMags: number[]
    hueDeltaEnergy: number
    chromaEnergy: number
    lightnessEnergy: number
  }
}

export type Fingerprint = [number, number, number, number, number, number, number]

export type SpectrumData = { freq: number; hueDelta: number; chroma: number; lightness: number }

function analyzePaletteStructure(lchColors: Vector3[]): Analysis {
  if (lchColors.length < 4) {
    return {
      type: 'insufficient-data',
      confidence: 0,
      features: {}
    }
  }

  const { chromatic, achromatic } = chromaticLch(lchColors)

  if (chromatic.length < 3) {
    return {
      type: 'achromatic',
      confidence: 1.0,
      features: {
        chromaticRatio: chromatic.length / lchColors.length,
        achromaticCount: achromatic.length
      }
    }
  }

  const {
    hueDeltaMags,
    chromaMags,
    lightnessMags,
    // hues,
    hueDeltas,
    sortedHues,
    chromas,
    lightnesses
  } = fftLch(chromatic)

  // Calculate features
  const hueSpread = Math.max(...sortedHues) - Math.min(...sortedHues)
  const chromaVariance = variance(chromas)
  const lightnessVariance = variance(lightnesses)

  // Detect gaps in hue distribution (indicates multi-ramp)
  const largeGaps = hueDeltas.filter((d) => d > 45).length
  const avgGap = mean(hueDeltas)
  const maxGap = Math.max(...hueDeltas)

  // Spectral features (hue-independent)
  const hueDeltaEnergy = energy(hueDeltaMags)
  const chromaEnergy = energy(chromaMags)
  const lightnessEnergy = energy(lightnessMags)

  // High-frequency content indicates multi-ramp (abrupt transitions)
  const hueHighFreqRatio = highFreqRatio(hueDeltaMags)
  const chromaHighFreqRatio = highFreqRatio(chromaMags)

  // Classification logic
  let type = 'unknown'
  let confidence = 0

  if (hueSpread < 60) {
    type = 'monochromatic'
    confidence = 0.9
  } else if (largeGaps >= 2 || hueHighFreqRatio > 0.3) {
    type = 'multi-ramp'
    confidence = Math.min(0.95, 0.6 + hueHighFreqRatio)
  } else if (hueSpread > 300 || largeGaps === 0) {
    type = 'full-spectrum'
    confidence = 0.85
  } else {
    type = 'wide-gamut'
    confidence = 0.7
  }

  // Create fingerprint vector (hue-independent features)
  const fingerprint: Fingerprint = [hueHighFreqRatio, chromaHighFreqRatio, chromaVariance, lightnessVariance, largeGaps / hueDeltas.length, maxGap / 360, chromatic.length / lchColors.length]

  return {
    type,
    confidence,
    features: {
      hueSpread,
      chromaticCount: chromatic.length,
      achromaticCount: achromatic.length,
      largeGaps,
      avgGap: avgGap,
      maxGap: maxGap,
      chromaVariance: chromaVariance,
      hueHighFreqRatio: hueHighFreqRatio,
      chromaHighFreqRatio: chromaHighFreqRatio
    },
    fingerprint,
    spectra: {
      hueDeltaMags,
      chromaMags,
      lightnessMags,
      hueDeltaEnergy,
      chromaEnergy,
      lightnessEnergy
    }
  }
}

export function metricsFftFingerprint(lchColors: Vector3[]) {
  const analysis: Analysis = analyzePaletteStructure(lchColors)

  const spectrumData: SpectrumData[] = analysis?.spectra?.hueDeltaMags
    ? analysis.spectra.hueDeltaMags.slice(0, 16).map((mag, i) => ({
        freq: i,
        hueDelta: mag,
        chroma: analysis?.spectra?.chromaMags[i] || 0,
        lightness: analysis?.spectra?.lightnessMags[i] || 0
      }))
    : []

  return {
    analysis,
    spectrumData
  }
}

export function compareFingerprints(fp1: Fingerprint, fp2: Fingerprint) {
  const cosine = cosineSimilarity(fp1, fp2)
  const euclidean = euclideanDistance(fp1, fp2)
  const manhattan = manhattanDistance(fp1, fp2)

  return {
    cosine,
    euclidean,
    manhattan,
    // Cosine similarity interpretation
    similarity: cosine,
    interpretation: cosine > 0.95 ? 'Nearly Identical' : cosine > 0.85 ? 'Very Similar' : cosine > 0.7 ? 'Similar' : cosine > 0.5 ? 'Somewhat Similar' : cosine > 0.3 ? 'Somewhat Different' : 'Very Different'
  }
}
