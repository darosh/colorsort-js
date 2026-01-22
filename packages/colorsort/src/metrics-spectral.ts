import { resamplePaletteLinear } from './resample.ts'
import { Vector3 } from './vector.ts'
import { interpolateNaNs, round2 } from './statistics.ts'
import { fft, half, magnitude } from './fft.ts'

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

export function extractSpectralFeatures(labColors: Vector3[]): SpectralFeatures {
  const resampled = resamplePaletteLinear(labColors, 256)

  // Extract channels in Oklab space (no wraparound!)
  const lightness = resampled.map((c) => c[0])
  const aChannel = interpolateNaNs(resampled.map((c) => c[1]))
  const bChannel = interpolateNaNs(resampled.map((c) => c[2]))
  const chroma = resampled.map((_, i) => Math.sqrt(aChannel[i] ** 2 + bChannel[i] ** 2))

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
