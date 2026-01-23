import { resamplePaletteLinear } from './resample.ts'
import { Vector3 } from './vector.ts'
import { interpolateNaNs } from './statistics.ts'
import { fft, half, magnitude } from './fft.ts'

export interface ChromaticLch {
  chromatic: Vector3[]
  achromatic: Vector3[]
}

export function chromaticLch(lchColors: Vector3[], threshold: number = 0.03): ChromaticLch {
  const chromatic = lchColors.filter((c) => c[1] >= threshold && c[1] !== undefined)
  const achromatic = lchColors.filter((c) => c[1] < threshold || c[1] === undefined)

  return {
    chromatic,
    achromatic
  }
}

export interface MagnitudesLch {
  lightnessMags: number[]
  chromaMags: number[]
  hueDeltaMags: number[]
  hues: number[]
  hueDeltas: number[]
  sortedHues: number[]
  chromas: number[]
  lightnesses: number[]
}

export function fftLch(lchColors: Vector3[]): MagnitudesLch {
  // Extract channels
  const lightnesses = lchColors.map((c) => c[0])
  const chromas = lchColors.map((c) => c[1])
  const hues = lchColors.map((c) => c[2])

  // Sort hues and calculate deltas (captures clustering pattern)
  const sortedHues = [...hues].sort((a, b) => a - b)
  const hueDeltas: number[] = []

  for (let i = 0; i < sortedHues.length - 1; i++) {
    hueDeltas.push(sortedHues[i + 1] - sortedHues[i])
  }

  hueDeltas.push(360 - sortedHues[sortedHues.length - 1] + sortedHues[0])

  // Extract magnitudes (first half, excluding DC component)
  const hueDeltaMags = magnitude(half(fft(hueDeltas)))
  const chromaMags = magnitude(half(fft(chromas)))
  const lightnessMags = magnitude(half(fft(lightnesses)))

  return {
    hueDeltaMags,
    chromaMags,
    lightnessMags,
    hues,
    hueDeltas,
    sortedHues,
    chromas,
    lightnesses
  }
}

export interface Stats {
  dominantFrequencies: number[]
  smoothness: number
  totalEnergy: number
  probabilities: number[]
  complexity: number
}

export function magnitudesStats(magnitudes: number[]): Stats {
  // Find dominant frequencies
  const dominantFrequencies = magnitudes
    .map((mag, i) => ({ freq: i + 1, mag }))
    .sort((a, b) => b.mag - a.mag)
    .slice(0, 3)
    .map((x) => x.freq)

  // Calculate smoothness (low-freq energy / high-freq energy)
  const cutoff = Math.ceil(magnitudes.length * 0.3)

  const lowFreqEnergy = magnitudes.slice(0, cutoff).reduce((sum, m) => sum + m * m, 0)
  const highFreqEnergy = magnitudes.slice(cutoff).reduce((sum, m) => sum + m * m, 0)

  const smoothness = highFreqEnergy > 0 ? lowFreqEnergy / highFreqEnergy : Infinity

  // Calculate spectral entropy (complexity measure)
  const totalEnergy = magnitudes.reduce((sum, m) => sum + m * m, 0)
  const probabilities = magnitudes.map((m) => (m * m) / totalEnergy)
  const complexity = -probabilities.reduce((sum, p) => sum + (p > 0 ? p * Math.log(p) : 0), 0)

  return {
    dominantFrequencies,
    smoothness,
    totalEnergy,
    probabilities,
    complexity
  }
}

export function featuresLch(lchColors: Vector3[]): MagnitudesLch & Stats {
  const { chromatic } = chromaticLch(lchColors)
  const magnitudes = fftLch(chromatic)
  const stats = magnitudesStats(magnitudes.hueDeltaMags)

  return {
    ...magnitudes,
    ...stats
  }
}

export interface MagnitudesLab {
  lightnessMags: number[]
  aMags: number[]
  bMags: number[]
  chromaMags: number[]
}

export function magnitudesLab(labColors: Vector3[]): MagnitudesLab {
  const lightness = labColors.map((c) => c[0])
  const aChannel = interpolateNaNs(labColors.map((c) => c[1]))
  const bChannel = interpolateNaNs(labColors.map((c) => c[2]))
  const chroma = labColors.map((_, i) => Math.sqrt(aChannel[i] ** 2 + bChannel[i] ** 2))

  const lightnessMags = magnitude(half(fft(lightness)))
  const aMags = magnitude(half(fft(aChannel)))
  const bMags = magnitude(half(fft(bChannel)))
  const chromaMags = magnitude(half(fft(chroma)))

  return {
    lightnessMags,
    aMags,
    bMags,
    chromaMags
  }
}

export interface StatsLab {
  lightness: number
  a: number
  b: number
  chroma: number
}

export function statsLab({ lightnessMags, aMags, bMags, chromaMags }: MagnitudesLab, calculate: Function): StatsLab {
  return {
    lightness: calculate(lightnessMags),
    a: calculate(aMags),
    b: calculate(bMags),
    chroma: calculate(chromaMags)
  }
}

export interface StatsLabEx {
  spectralCentroid: StatsLab
  spectralSpread: StatsLab
  spectralRolloff: StatsLab

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

export function statsLabsEx(magnitudesLab: MagnitudesLab): StatsLabEx {
  const spectralCentroid = statsLab(magnitudesLab, calculateCentroid)
  const spectralRolloff = statsLab(magnitudesLab, calculateRolloff)

  const { lightnessMags, aMags, bMags, chromaMags } = magnitudesLab

  const spectralSpread = {
    lightness: calculateSpread(lightnessMags, spectralCentroid.lightness),
    a: calculateSpread(aMags, spectralCentroid.a),
    b: calculateSpread(bMags, spectralCentroid.b),
    chroma: calculateSpread(chromaMags, spectralCentroid.chroma)
  }

  // Use combined spectrum (a + b) for overall color transitions
  const colorSpectrum = aMags.map((a, i) => Math.sqrt(a ** 2 + bMags[i] ** 2))

  const energyRatios = calculateEnergyRatios(colorSpectrum)
  const smoothness = calculateSmoothness(colorSpectrum)
  const complexity = calculateComplexity(colorSpectrum)
  const dominantFrequencies = findDominantFrequencies(colorSpectrum, 3)

  return {
    spectralCentroid,
    spectralSpread,
    spectralRolloff,
    energyRatios,
    smoothness,
    complexity,
    dominantFrequencies
  }
}

export function featuresLab(labColors: Vector3[]): StatsLabEx & MagnitudesLab {
  const resampled = resamplePaletteLinear(labColors, 256)
  const magnitudes = magnitudesLab(resampled)
  const stats = statsLabsEx(magnitudes)

  return {
    ...magnitudes,
    ...stats
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

function calculateEnergyRatios(spectrum: number[]) {
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
