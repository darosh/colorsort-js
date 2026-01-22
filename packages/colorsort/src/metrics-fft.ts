import { Vector3 } from './vector.ts'
import { oklch2oklab } from './color.ts'
import { fft, half, magnitude } from './fft.ts'

export type Analysis = {
  type: string
  confidence: number
  features: {
    chromaticRatio?: number
    achromaticCount?: number
    hueSpread?: number
    chromaticCount?: number
    largeGaps?: number
    avgGap?: string
    maxGap?: string
    chromaVariance?: string
    hueHighFreqRatio?: string
    chromaHighFreqRatio?: string
  }
  fingerprint?: Fingerprint
  spectra?: {
    hueDelta: number[]
    chroma: number[]
    lightness: number[]
    hueDeltaEnergy: number
    chromaEnergy: number
    lightnessEnergy: number
  }
}

export type Fingerprint = [number, number, number, number, number, number, number]

export type SpectrumData = { freq: number; hueDelta: number; chroma: number; lightness: number }

// Color palette analysis
function analyzePaletteStructure(colors: Vector3[]): Analysis {
  if (colors.length < 4) {
    return {
      type: 'insufficient-data',
      confidence: 0,
      features: {}
    }
  }

  // Separate chromatic and achromatic
  const chromatic = colors.filter((c) => c[1] >= 0.03)
  const achromatic = colors.filter((c) => c[1] < 0.03)

  if (chromatic.length < 3) {
    return {
      type: 'achromatic',
      confidence: 1.0,
      features: {
        chromaticRatio: chromatic.length / colors.length,
        achromaticCount: achromatic.length
      }
    }
  }

  // Extract features
  const hues = chromatic.map((c) => c[2])
  const chromas = chromatic.map((c) => c[1])
  const lightnesses = chromatic.map((c) => c[0])

  // Analyze hue distribution using circular statistics
  const hueDeltas = []
  const sortedHues = [...hues].sort((a, b) => a - b)
  for (let i = 0; i < sortedHues.length - 1; i++) {
    hueDeltas.push(sortedHues[i + 1] - sortedHues[i])
  }
  // Wrap-around delta
  hueDeltas.push(360 - sortedHues[sortedHues.length - 1] + sortedHues[0])

  // FFT on hue differences to detect clustering patterns
  // const hueDeltaFFT = fft(hueDeltas)
  const hueDeltaMagnitudes = magnitude(half(fft(hueDeltas)))

  // FFT on chroma sequence to detect variation patterns
  // const chromaFFT = fft(chromas)
  const chromaMagnitudes = magnitude(half(fft(chromas)))

  // FFT on lightness sequence to detect banding
  // const lightnessFFT = fft(lightnesses)
  const lightnessMagnitudes = magnitude(half(fft(lightnesses)))

  // Calculate features
  const hueSpread = Math.max(...sortedHues) - Math.min(...sortedHues)
  const chromaVariance = variance(chromas)
  const lightnessVariance = variance(lightnesses)

  // Detect gaps in hue distribution (indicates multi-ramp)
  const largeGaps = hueDeltas.filter((d) => d > 45).length
  const avgGap = mean(hueDeltas)
  const maxGap = Math.max(...hueDeltas)

  // Spectral features (hue-independent)
  const hueDeltaEnergy = energy(hueDeltaMagnitudes)
  const chromaEnergy = energy(chromaMagnitudes)
  const lightnessEnergy = energy(lightnessMagnitudes)

  // High-frequency content indicates multi-ramp (abrupt transitions)
  const hueHighFreqRatio = highFreqRatio(hueDeltaMagnitudes)
  const chromaHighFreqRatio = highFreqRatio(chromaMagnitudes)

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
  const fingerprint = [hueHighFreqRatio, chromaHighFreqRatio, chromaVariance, lightnessVariance, largeGaps / hueDeltas.length, maxGap / 360, chromatic.length / colors.length]

  return <Analysis>{
    type,
    confidence,
    features: {
      hueSpread,
      chromaticCount: chromatic.length,
      achromaticCount: achromatic.length,
      largeGaps,
      avgGap: avgGap.toFixed(1),
      maxGap: maxGap.toFixed(1),
      chromaVariance: chromaVariance.toFixed(3),
      hueHighFreqRatio: hueHighFreqRatio.toFixed(3),
      chromaHighFreqRatio: chromaHighFreqRatio.toFixed(3)
    },
    fingerprint,
    spectra: {
      hueDelta: hueDeltaMagnitudes,
      chroma: chromaMagnitudes,
      lightness: lightnessMagnitudes,
      hueDeltaEnergy,
      chromaEnergy,
      lightnessEnergy
    }
  }
}

function variance(arr: number[]) {
  const m = mean(arr)
  return mean(arr.map((x) => (x - m) ** 2))
}

function mean(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function energy(magnitudes: number[]) {
  return magnitudes.reduce((sum, m) => sum + m * m, 0)
}

function highFreqRatio(magnitudes: number[]) {
  const cutoff = Math.floor(magnitudes.length * 0.4)
  const highFreqEnergy = magnitudes.slice(cutoff).reduce((sum, m) => sum + m * m, 0)
  const totalEnergy = energy(magnitudes)
  return totalEnergy > 0 ? highFreqEnergy / totalEnergy : 0
}

export function metricsFft(colors: Vector3[]) {
  const analysis: Analysis = analyzePaletteStructure(colors)

  const spectrumData: SpectrumData[] = analysis?.spectra?.hueDelta
    ? analysis.spectra.hueDelta.slice(0, 16).map((mag, i) => ({
        freq: i,
        hueDelta: mag,
        chroma: analysis?.spectra?.chroma[i] || 0,
        lightness: analysis?.spectra?.lightness[i] || 0
      }))
    : []

  return {
    analysis,
    spectrumData
  }
}

// Fingerprint comparison functions
// export function cosineSimilarity (fp1: Fingerprint, fp2: Fingerprint) {
//   const dotProduct = fp1.reduce((sum, val, i) => sum + val * fp2[i], 0)
//   const mag1 = Math.sqrt(fp1.reduce((sum, val) => sum + val * val, 0))
//   const mag2 = Math.sqrt(fp2.reduce((sum, val) => sum + val * val, 0))
//   return dotProduct / (mag1 * mag2)
// }

// function euclideanDistance (fp1: Fingerprint, fp2: Fingerprint) {
//   return Math.sqrt(fp1.reduce((sum, val, i) => sum + (val - fp2[i]) ** 2, 0))
// }

function manhattanDistance(fp1: Fingerprint, fp2: Fingerprint) {
  return fp1.reduce((sum, val, i) => sum + Math.abs(val - fp2[i]), 0)
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

// Convert Oklch to Oklab for FFT analysis
// export function oklchToOklab(color: Vector3): [number, number, number] {
//   const [L, C, H] = color
//   const hRad = (H * Math.PI) / 180
//   return [L, C * Math.cos(hRad), C * Math.sin(hRad)]
// }

// Resample palette to 256 points with interpolation
export function resamplePalette(colors: Vector3[], samples: number = 256): Vector3[] {
  if (colors.length < 2) {
    return colors
  }

  const result: Vector3[] = []
  const step = (colors.length - 1) / (samples - 1)

  for (let i = 0; i < samples; i++) {
    const pos = i * step
    const idx1 = Math.floor(pos)
    const idx2 = Math.min(idx1 + 1, colors.length - 1)
    const frac = pos - idx1

    // Interpolate in Oklab space (no hue wraparound issues!)
    const lab1 = oklch2oklab(colors[idx1])
    const lab2 = oklch2oklab(colors[idx2])

    const interpolated: [number, number, number] = [
      lab1[0] * (1 - frac) + lab2[0] * frac, // L
      lab1[1] * (1 - frac) + lab2[1] * frac, // a
      lab1[2] * (1 - frac) + lab2[2] * frac // b
    ]

    // Convert back to Oklch for storage
    const L = interpolated[0]
    const C = Math.sqrt(interpolated[1] ** 2 + interpolated[2] ** 2)
    const H = ((Math.atan2(interpolated[2], interpolated[1]) * 180) / Math.PI + 360) % 360

    result.push([L, C, H])
  }

  return result
}

// ============================================================================
// Spectral Features
// ============================================================================

export interface SpectralFeatures {
  // Raw FFT magnitudes (128 bins for 256 samples)
  lightnessSpectrum: number[]
  aSpectrum: number[]
  bSpectrum: number[]
  chromaSpectrum: number[]

  // Derived metrics (size-independent)
  spectralCentroid: {
    lightness: number
    a: number
    b: number
    chroma: number
  }

  spectralSpread: {
    lightness: number
    a: number
    b: number
    chroma: number
  }

  spectralRolloff: {
    lightness: number
    a: number
    b: number
    chroma: number
  }

  energyRatios: {
    lowFreq: number // 0-30% of spectrum
    midFreq: number // 30-70% of spectrum
    highFreq: number // 70-100% of spectrum
  }

  // Complexity measures
  smoothness: number // Low-freq / high-freq energy ratio
  complexity: number // Spectral entropy
  dominantFrequencies: number[] // Top 3 frequency bins
}

/**
 * Interpolate NaN values in a signal using surrounding valid values
 * This prevents false discontinuities in FFT when achromatic colors produce NaN
 */
export function interpolateNaNs(signal: number[]): number[] {
  const result = [...signal]

  for (let i = 0; i < result.length; i++) {
    if (!isFinite(result[i])) {
      // Find previous valid value
      let prevIdx = i - 1
      while (prevIdx >= 0 && !isFinite(result[prevIdx])) {
        prevIdx--
      }

      // Find next valid value
      let nextIdx = i + 1
      while (nextIdx < result.length && !isFinite(result[nextIdx])) {
        nextIdx++
      }

      // Interpolate
      if (prevIdx >= 0 && nextIdx < result.length) {
        // Both neighbors exist - linear interpolation
        const prevVal = result[prevIdx]
        const nextVal = result[nextIdx]
        const span = nextIdx - prevIdx
        const offset = i - prevIdx
        result[i] = prevVal + (nextVal - prevVal) * (offset / span)
      } else if (prevIdx >= 0) {
        // Only previous exists - use it
        result[i] = result[prevIdx]
      } else if (nextIdx < result.length) {
        // Only next exists - use it
        result[i] = result[nextIdx]
      } else {
        // No valid values at all - use 0
        result[i] = 0
      }
    }
  }

  return result
}

function round2(x: number) {
  return Math.round((x || 0) * 1000) / 1000
}

export function extractSpectralFeaturesOklab(colors: Vector3[]): SpectralFeatures {
  // Resample to 256 for consistent FFT (always 128 meaningful bins)
  const resampled = resamplePalette(colors, 64)
  const oklabColors = resampled.map(oklch2oklab)

  // Extract channels in Oklab space (no wraparound!)
  const lightness = oklabColors.map((c) => c[0])
  const aChannel = interpolateNaNs(oklabColors.map((c) => c[1]))
  const bChannel = interpolateNaNs(oklabColors.map((c) => c[2]))

  const chroma = oklabColors.map((_, i) => Math.sqrt(aChannel[i] ** 2 + bChannel[i] ** 2))

  // Compute FFTs
  // const lightnessFFT = fft(lightness)
  // const aFFT = fft(aChannel)
  // const bFFT = fft(bChannel)
  // const chromaFFT = fft(chroma)

  // Extract magnitudes (first half only, skip DC component at index 0)
  // const halfLength = Math.floor(lightnessFFT.length / 2)

  const lightnessSpectrum = magnitude(half(fft(lightness)))
  const aSpectrum = magnitude(half(fft(aChannel)))
  const bSpectrum = magnitude(half(fft(bChannel)))
  const chromaSpectrum = magnitude(half(fft(chroma)))

  // Calculate derived metrics
  const spectralCentroid = {
    lightness: calculateCentroid(lightnessSpectrum),
    a: calculateCentroid(aSpectrum),
    b: calculateCentroid(bSpectrum),
    chroma: calculateCentroid(chromaSpectrum)
  }

  const spectralSpread = {
    lightness: calculateSpread(lightnessSpectrum, spectralCentroid.lightness),
    a: calculateSpread(aSpectrum, spectralCentroid.a),
    b: calculateSpread(bSpectrum, spectralCentroid.b),
    chroma: calculateSpread(chromaSpectrum, spectralCentroid.chroma)
  }

  const spectralRolloff = {
    lightness: calculateRolloff(lightnessSpectrum),
    a: calculateRolloff(aSpectrum),
    b: calculateRolloff(bSpectrum),
    chroma: calculateRolloff(chromaSpectrum)
  }

  // Use combined spectrum (a + b) for overall color transitions
  const colorSpectrum = aSpectrum.map((a, i) => Math.sqrt(a * a + bSpectrum[i] * bSpectrum[i]))

  const energyRatios = calculateEnergyRatios(colorSpectrum)
  const smoothness = calculateSmoothness(colorSpectrum)
  const complexity = calculateComplexity(colorSpectrum)
  const dominantFrequencies = findDominantFrequencies(colorSpectrum, 3)

  return {
    lightnessSpectrum: lightnessSpectrum.map(round2),
    aSpectrum: aSpectrum.map(round2),
    bSpectrum: bSpectrum.map(round2),
    chromaSpectrum: chromaSpectrum.map(round2),
    spectralCentroid,
    spectralSpread,
    spectralRolloff,
    energyRatios,
    smoothness,
    complexity,
    dominantFrequencies
  }
}

// ============================================================================
// Spectral Analysis Helpers
// ============================================================================

function calculateCentroid(spectrum: number[]): number {
  const total = spectrum.reduce((sum, x) => sum + x, 0)
  if (total === 0) {
    return 0
  }

  const weightedSum = spectrum.reduce((sum, mag, i) => sum + mag * i, 0)
  return weightedSum / total / spectrum.length // Normalize to 0-1
}

function calculateSpread(spectrum: number[], centroid: number): number {
  const total = spectrum.reduce((sum, x) => sum + x, 0)
  if (total === 0) {
    return 0
  }

  const normalizedCentroid = centroid * spectrum.length
  const variance = spectrum.reduce((sum, mag, i) => sum + mag * (i - normalizedCentroid) ** 2, 0) / total

  return Math.sqrt(variance) / spectrum.length // Normalize to 0-1
}

function calculateRolloff(spectrum: number[], threshold: number = 0.85): number {
  const energy = spectrum.map((x) => x * x)
  const totalEnergy = energy.reduce((sum, x) => sum + x, 0)
  if (totalEnergy === 0) {
    return 0
  }

  let cumEnergy = 0
  for (let i = 0; i < spectrum.length; i++) {
    cumEnergy += energy[i]
    if (cumEnergy >= threshold * totalEnergy) {
      return i / spectrum.length // Normalize to 0-1
    }
  }

  return 1.0
}

function calculateEnergyRatios(spectrum: number[]): {
  lowFreq: number
  midFreq: number
  highFreq: number
} {
  const energy = spectrum.map((x) => x * x)
  const totalEnergy = energy.reduce((sum, x) => sum + x, 0)

  if (totalEnergy === 0) {
    return { lowFreq: 0, midFreq: 0, highFreq: 0 }
  }

  const lowIdx = Math.floor(spectrum.length * 0.3)
  const highIdx = Math.floor(spectrum.length * 0.7)

  const lowFreqEnergy = energy.slice(0, lowIdx).reduce((sum, x) => sum + x, 0)
  const midFreqEnergy = energy.slice(lowIdx, highIdx).reduce((sum, x) => sum + x, 0)
  const highFreqEnergy = energy.slice(highIdx).reduce((sum, x) => sum + x, 0)

  return {
    lowFreq: lowFreqEnergy / totalEnergy,
    midFreq: midFreqEnergy / totalEnergy,
    highFreq: highFreqEnergy / totalEnergy
  }
}

function calculateSmoothness(spectrum: number[]): number {
  const cutoff = Math.floor(spectrum.length * 0.3)
  const energy = spectrum.map((x) => x * x)

  const lowFreqEnergy = energy.slice(0, cutoff).reduce((sum, x) => sum + x, 0)
  const highFreqEnergy = energy.slice(cutoff).reduce((sum, x) => sum + x, 0)

  return highFreqEnergy > 0 ? lowFreqEnergy / highFreqEnergy : Infinity
}

function calculateComplexity(spectrum: number[]): number {
  const totalEnergy = spectrum.reduce((sum, x) => sum + x * x, 0)
  if (totalEnergy === 0) {
    return 0
  }

  const probabilities = spectrum.map((x) => (x * x) / totalEnergy)
  const entropy = -probabilities.reduce((sum, p) => sum + (p > 0 ? p * Math.log(p) : 0), 0)

  return entropy
}

function findDominantFrequencies(spectrum: number[], count: number): number[] {
  return spectrum
    .map((mag, i) => ({ freq: i + 1, mag }))
    .sort((a, b) => b.mag - a.mag)
    .slice(0, count)
    .map((x) => x.freq)
}

// ============================================================================
// Similarity Metrics
// ============================================================================

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

// ============================================================================
// Distance/Similarity Helper Functions
// ============================================================================

export function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))

  if (magA === 0 || magB === 0) {
    return 0
  }
  return dotProduct / (magA * magB)
}

function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0))
}

function gaussianSimilarity(a: number, b: number, sigma: number): number {
  // Gaussian kernel: exp(-distance^2 / (2 * sigma^2))
  // Returns 1 when values are identical, decreases smoothly as they differ
  const distance = Math.abs(a - b)
  return Math.exp(-(distance * distance) / (2 * sigma * sigma))
}

function pearsonCorrelation(a: number[], b: number[]): number {
  const n = a.length
  if (n !== b.length || n === 0) {
    return 0
  }

  const meanA = a.reduce((sum, x) => sum + x, 0) / n
  const meanB = b.reduce((sum, x) => sum + x, 0) / n

  let numerator = 0
  let sumSqA = 0
  let sumSqB = 0

  for (let i = 0; i < n; i++) {
    const diffA = a[i] - meanA
    const diffB = b[i] - meanB
    numerator += diffA * diffB
    sumSqA += diffA * diffA
    sumSqB += diffB * diffB
  }

  const denominator = Math.sqrt(sumSqA * sumSqB)
  if (denominator === 0) {
    return 0
  }

  // Pearson returns -1 to 1, convert to 0 to 1
  return (numerator / denominator + 1) / 2
}
