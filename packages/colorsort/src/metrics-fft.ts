// FFT implementation (Cooley-Tukey algorithm)
import { Vector3 } from './vector.ts'

export type Complex = { re: number; im: number }

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

export function fft(signal: number[]): Complex[] {
  const n = signal.length

  if (n <= 1) {
    return []
  }

  // Pad to power of 2
  const nextPow2 = Math.pow(2, Math.ceil(Math.log2(n)))
  if (n < nextPow2) {
    signal = [...signal, ...(<number[]>Array.from({ length: nextPow2 - n }).fill(0))]
  }

  return fftRecursive(signal)
}

function fftRecursive(signal: number[]) {
  const n = signal.length
  if (n <= 1) {
    return signal.map((x) => ({ re: x, im: 0 }))
  }

  const even = fftRecursive(signal.filter((_, i) => i % 2 === 0))
  const odd = fftRecursive(signal.filter((_, i) => i % 2 === 1))

  const result: Complex[] = Array.from({ length: n })

  for (let k = 0; k < n / 2; k++) {
    const angle = (-2 * Math.PI * k) / n
    const wk: Complex = { re: Math.cos(angle), im: Math.sin(angle) }
    const oddK = complexMult(wk, odd[k])

    result[k] = complexAdd(even[k], oddK)
    result[k + n / 2] = complexSub(even[k], oddK)
  }

  return result
}

function complexMult(a: Complex, b: Complex) {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re
  }
}

function complexAdd(a: Complex, b: Complex) {
  return { re: a.re + b.re, im: a.im + b.im }
}

function complexSub(a: Complex, b: Complex) {
  return { re: a.re - b.re, im: a.im - b.im }
}

export function magnitude(c: Complex) {
  return Math.sqrt(c.re * c.re + c.im * c.im)
}

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
  const hueDeltaFFT = fft(hueDeltas)
  const hueDeltaMagnitudes = hueDeltaFFT.slice(0, Math.floor(hueDeltaFFT.length / 2)).map(magnitude)

  // FFT on chroma sequence to detect variation patterns
  const chromaFFT = fft(chromas)
  const chromaMagnitudes = chromaFFT.slice(0, Math.floor(chromaFFT.length / 2)).map(magnitude)

  // FFT on lightness sequence to detect banding
  const lightnessFFT = fft(lightnesses)
  const lightnessMagnitudes = lightnessFFT.slice(0, Math.floor(lightnessFFT.length / 2)).map(magnitude)

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
function cosineSimilarity(fp1: Fingerprint, fp2: Fingerprint) {
  const dotProduct = fp1.reduce((sum, val, i) => sum + val * fp2[i], 0)
  const mag1 = Math.sqrt(fp1.reduce((sum, val) => sum + val * val, 0))
  const mag2 = Math.sqrt(fp2.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (mag1 * mag2)
}

function euclideanDistance(fp1: Fingerprint, fp2: Fingerprint) {
  return Math.sqrt(fp1.reduce((sum, val, i) => sum + (val - fp2[i]) ** 2, 0))
}

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
