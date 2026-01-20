import FFT from 'fft.js'
import { Vector3 } from './vector.ts'
import { oklab2oklch, oklch2oklab } from './color.ts'
import { downsamplePalette, resamplePalette } from './resample.ts'

export interface SpectralProcessingOptions {
  // EQ (original)
  eq?: { lowGain: number; midGain: number; highGain: number }

  // Compression/Limiting
  compression?: {
    threshold: number // threshold for compression (0-1)
    ratio: number // compression ratio (1 = none, 10 = heavy)
    attack: number // attack coefficient (0-1, higher = faster)
    release: number // release coefficient (0-1, higher = faster)
  }

  // Exciter/Saturation (harmonic generation)
  exciter?: {
    amount: number // how much harmonics to add (0-1)
    frequency: number // which freq band to excite (0-1, normalized)
  }

  // Phase vocoder effects
  phaseShift?: number // circular phase rotation in degrees

  // Reverb (via convolution)
  reverb?: {
    decay: number // decay time (0-1)
    mix: number // wet/dry (0-1)
  }

  // Stereo width (for a/b channel separation)
  stereoWidth?: number // 0 = mono, 1 = normal, >1 = widened

  // Distortion/waveshaping
  distortion?: {
    amount: number // drive (0-1)
    type: 'soft' | 'hard' | 'tube'
  }

  // Comb Filtering
  combFilter?: {
    frequency: number // comb frequency (0-1, normalized)
    feedback: number // feedback amount (0-1)
    mix: number // wet/dry (0-1)
  }

  // Spectral Blur
  spectralBlur?: {
    amount: number // blur radius in bins (0-10)
  }

  // Spectral Gating
  spectralGate?: {
    threshold: number // gate threshold (0-1)
    ratio: number // attenuation below threshold (0-1)
  }

  // Partial Extraction (keep only harmonic-related bins)
  partialExtraction?: {
    fundamental: number // fundamental frequency (0-1, normalized)
    harmonics: number // how many harmonics to keep (1-16)
    bandwidth: number // how wide each harmonic band is (0-1)
  }

  // Lightness processing
  lightnessSmoothing?: number // gradient smoothing amount (0-1)
}

export function applySpectralProcessing(colors: Vector3[], options: SpectralProcessingOptions = {}) {
  const N = 256
  const ff = new FFT(N)

  // Resample and convert
  const resampled = resamplePalette(colors, N)
  const oklabColors = resampled.map(oklch2oklab)

  // Extract channels
  const L = oklabColors.map((c) => c[0])
  const a = oklabColors.map((c) => c[1])
  const b = oklabColors.map((c) => c[2])

  // Process lightness with gradient smoothing
  let resultL = [...L]
  if (options.lightnessSmoothing) {
    resultL = applyLightnessSmoothing(resultL, colors.length * options.lightnessSmoothing)
  }

  // Process a and b channels
  let resultA = [...a]
  let resultB = [...b]

  // Apply distortion (pre-processing, in time domain)
  if (options.distortion) {
    resultA = applyDistortion(resultA, options.distortion)
    resultB = applyDistortion(resultB, options.distortion)
  }

  // Apply stereo width
  if (options.stereoWidth !== undefined) {
    const mid = resultA.map((v, i) => (v + resultB[i]) / 2)
    const side = resultA.map((v, i) => (v - resultB[i]) / 2)
    const width = options.stereoWidth
    resultA = mid.map((m, i) => m + side[i] * width)
    resultB = mid.map((m, i) => m - side[i] * width)
  }

  // Frequency domain processing
  resultA = processChannelSpectral(ff, resultA, options)
  resultB = processChannelSpectral(ff, resultB, options)

  // Apply compression (post-processing, in time domain)
  if (options.compression) {
    resultA = applyCompression(resultA, options.compression)
    resultB = applyCompression(resultB, options.compression)
  }

  // Rebuild and clamp
  const processed: Vector3[] = []
  for (let i = 0; i < N; i++) {
    const lab: [number, number, number] = [
      clamp(resultL[i], 0, 1), // L range 0-1
      clamp(resultA[i], -0.4, 0.4), // Oklab a/b typical range
      clamp(resultB[i], -0.4, 0.4)
    ]
    processed.push(oklab2oklch(lab))
  }

  const downsampled = downsamplePalette(processed, colors.length)

  return {
    colors: downsampled,
    resampled,
    processed
  }
}

function processChannelSpectral(ff: FFT, signal: number[], options: SpectralProcessingOptions): number[] {
  const N = ff.size
  const spectrum = ff.createComplexArray()

  ff.realTransform(spectrum, signal)
  ff.completeSpectrum(spectrum)

  const half = N / 2

  // Apply EQ
  if (options.eq) {
    applyEQ(spectrum, half, options.eq)
  }

  // Apply exciter (harmonic generation)
  if (options.exciter) {
    applyExciter(spectrum, half, options.exciter)
  }

  // Apply phase shift
  if (options.phaseShift) {
    applyPhaseShift(spectrum, half, options.phaseShift)
  }

  // Apply reverb (simplified via spectral smearing)
  if (options.reverb) {
    applyReverb(spectrum, half, options.reverb)
  }

  // Apply comb filter
  if (options.combFilter) {
    applyCombFilter(spectrum, half, options.combFilter)
  }

  // Apply spectral blur
  if (options.spectralBlur) {
    applySpectralBlur(spectrum, half, options.spectralBlur)
  }

  // Apply spectral gate
  if (options.spectralGate) {
    applySpectralGate(spectrum, half, options.spectralGate)
  }

  // Apply partial extraction
  if (options.partialExtraction) {
    applyPartialExtraction(spectrum, half, options.partialExtraction)
  }

  // Inverse transform
  const outputComplex = ff.createComplexArray()
  ff.inverseTransform(outputComplex, spectrum)

  // Extract real parts (no normalization needed - your FFT library handles it)
  const result: number[] = []
  for (let i = 0; i < N; i++) {
    result[i] = outputComplex[i * 2]
  }

  return result
}

function applyEQ(spectrum: number[], half: number, eq: { lowGain: number; midGain: number; highGain: number }) {
  const lowCutoff = Math.floor(half * 0.05)
  const highCutoff = Math.floor(half * 0.1)

  for (let k = 0; k <= half; k++) {
    let gain = 1.0

    if (k < lowCutoff) {
      gain = eq.lowGain
    } else if (k < highCutoff) {
      gain = eq.midGain
    } else {
      gain = eq.highGain
    }

    const idx = k * 2
    spectrum[idx] *= gain
    spectrum[idx + 1] *= gain

    // Mirror to negative frequencies
    if (k > 0 && k < half) {
      const N = half * 2
      const negIdx = (N - k) * 2
      spectrum[negIdx] = spectrum[idx]
      spectrum[negIdx + 1] = -spectrum[idx + 1]
    }
  }
}

function applyExciter(spectrum: number[], half: number, exciter: { amount: number; frequency: number }) {
  // Generate harmonics by duplicating energy at higher frequencies
  const targetBin = Math.floor(half * exciter.frequency)
  const harmonicStart = targetBin * 2

  for (let k = harmonicStart; k <= half && k < half; k++) {
    const sourceK = Math.floor(k / 2)
    if (sourceK < half) {
      const idx = k * 2
      const srcIdx = sourceK * 2

      spectrum[idx] += spectrum[srcIdx] * exciter.amount * 0.5
      spectrum[idx + 1] += spectrum[srcIdx + 1] * exciter.amount * 0.5
    }
  }
}

function applyPhaseShift(spectrum: number[], half: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180

  for (let k = 0; k <= half; k++) {
    const idx = k * 2
    const re = spectrum[idx]
    const im = spectrum[idx + 1]

    // Rotate by angle in complex plane
    const mag = Math.sqrt(re * re + im * im)
    const phase = Math.atan2(im, re) + radians

    spectrum[idx] = mag * Math.cos(phase)
    spectrum[idx + 1] = mag * Math.sin(phase)

    // Mirror
    if (k > 0 && k < half) {
      const N = half * 2
      const negIdx = (N - k) * 2
      spectrum[negIdx] = spectrum[idx]
      spectrum[negIdx + 1] = -spectrum[idx + 1]
    }
  }
}

function applyReverb(spectrum: number[], half: number, reverb: { decay: number; mix: number }) {
  // Simplified reverb via spectral smoothing (low-pass on magnitude)
  const drySpectrum = new Float64Array(spectrum)

  for (let k = 1; k < half; k++) {
    const idx = k * 2
    const prevIdx = (k - 1) * 2
    const nextIdx = Math.min(k + 1, half) * 2

    // Smooth magnitude, preserve phase
    const re = spectrum[idx]
    const im = spectrum[idx + 1]
    const phase = Math.atan2(im, re)

    const prevMag = Math.sqrt(spectrum[prevIdx] ** 2 + spectrum[prevIdx + 1] ** 2)
    const currMag = Math.sqrt(re * re + im * im)
    const nextMag = Math.sqrt(spectrum[nextIdx] ** 2 + spectrum[nextIdx + 1] ** 2)

    const smoothMag = ((prevMag + currMag * 2 + nextMag) / 4) * reverb.decay

    const wetRe = smoothMag * Math.cos(phase)
    const wetIm = smoothMag * Math.sin(phase)

    spectrum[idx] = drySpectrum[idx] * (1 - reverb.mix) + wetRe * reverb.mix
    spectrum[idx + 1] = drySpectrum[idx + 1] * (1 - reverb.mix) + wetIm * reverb.mix
  }
}

function applyDistortion(signal: number[], dist: { amount: number; type: 'soft' | 'hard' | 'tube' }): number[] {
  const drive = 1 + dist.amount * 9

  return signal.map((x) => {
    const driven = x * drive

    switch (dist.type) {
      case 'soft':
        // Cubic soft clipping
        return driven / (1 + Math.abs(driven))

      case 'hard':
        // Hard clipping
        return Math.max(-1, Math.min(1, driven))

      case 'tube':
        // Tube-like asymmetric
        return driven > 0 ? driven / (1 + driven * 0.5) : driven / (1 - driven * 0.3)

      default:
        return driven
    }
  })
}

function applyCompression(signal: number[], comp: { threshold: number; ratio: number; attack: number; release: number }): number[] {
  let envelope = 0
  const result = []

  for (const sample of signal) {
    const absSample = Math.abs(sample)

    // Envelope follower
    if (absSample > envelope) {
      envelope += (absSample - envelope) * comp.attack
    } else {
      envelope += (absSample - envelope) * comp.release
    }

    // Compression
    let gain = 1
    if (envelope > comp.threshold) {
      const over = envelope - comp.threshold
      const compressed = over / comp.ratio
      gain = (comp.threshold + compressed) / envelope
    }

    result.push(sample * gain)
  }

  return result
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

function applyCombFilter(spectrum: number[], half: number, comb: { frequency: number; feedback: number; mix: number }) {
  // Comb filter creates notches at regular intervals
  const fundamentalBin = Math.floor(half * comb.frequency)
  if (fundamentalBin === 0) {
    return
  }

  const drySpectrum = new Float64Array(spectrum)

  // Create notches at multiples of fundamental
  for (let k = 0; k <= half; k++) {
    const idx = k * 2

    // Calculate distance to nearest comb tooth
    const toothIndex = Math.round(k / fundamentalBin)
    const nearestTooth = toothIndex * fundamentalBin
    const distance = Math.abs(k - nearestTooth)
    const normalizedDistance = distance / fundamentalBin

    // Attenuation curve (inverse of feedback at comb teeth)
    const attenuation = 1 - comb.feedback * Math.exp(-normalizedDistance * 5)

    spectrum[idx] = drySpectrum[idx] * (1 - comb.mix) + drySpectrum[idx] * attenuation * comb.mix
    spectrum[idx + 1] = drySpectrum[idx + 1] * (1 - comb.mix) + drySpectrum[idx + 1] * attenuation * comb.mix

    // Mirror
    if (k > 0 && k < half) {
      const N = half * 2
      const negIdx = (N - k) * 2
      spectrum[negIdx] = spectrum[idx]
      spectrum[negIdx + 1] = -spectrum[idx + 1]
    }
  }
}

function applySpectralBlur(spectrum: number[], half: number, blur: { amount: number }) {
  if (blur.amount === 0) {
    return
  }

  const radius = Math.max(1, Math.round(blur.amount))
  const blurred = new Float64Array(spectrum)

  // Gaussian-like blur using box filter approximation
  for (let k = 0; k <= half; k++) {
    const idx = k * 2
    let sumRe = 0
    let sumIm = 0
    let count = 0

    for (let offset = -radius; offset <= radius; offset++) {
      const neighbor = k + offset
      if (neighbor >= 0 && neighbor <= half) {
        const nIdx = neighbor * 2
        sumRe += spectrum[nIdx]
        sumIm += spectrum[nIdx + 1]
        count++
      }
    }

    blurred[idx] = sumRe / count
    blurred[idx + 1] = sumIm / count

    // Mirror
    if (k > 0 && k < half) {
      const N = half * 2
      const negIdx = (N - k) * 2
      blurred[negIdx] = blurred[idx]
      blurred[negIdx + 1] = -blurred[idx + 1]
    }
  }

  // Copy back
  for (let i = 0; i < spectrum.length; i++) {
    spectrum[i] = blurred[i]
  }
}

function applySpectralGate(spectrum: number[], half: number, gate: { threshold: number; ratio: number }) {
  // Calculate overall magnitude threshold
  let maxMag = 0
  for (let k = 0; k <= half; k++) {
    const idx = k * 2
    const mag = Math.sqrt(spectrum[idx] ** 2 + spectrum[idx + 1] ** 2)
    maxMag = Math.max(maxMag, mag)
  }

  const threshold = maxMag * gate.threshold

  for (let k = 0; k <= half; k++) {
    const idx = k * 2
    const re = spectrum[idx]
    const im = spectrum[idx + 1]
    const mag = Math.sqrt(re * re + im * im)

    if (mag < threshold) {
      // Attenuate below threshold
      const attenuation = gate.ratio
      spectrum[idx] *= attenuation
      spectrum[idx + 1] *= attenuation
    }

    // Mirror
    if (k > 0 && k < half) {
      const N = half * 2
      const negIdx = (N - k) * 2
      spectrum[negIdx] = spectrum[idx]
      spectrum[negIdx + 1] = -spectrum[idx + 1]
    }
  }
}

function applyPartialExtraction(spectrum: number[], half: number, partial: { fundamental: number; harmonics: number; bandwidth: number }) {
  const fundamentalBin = Math.floor(half * partial.fundamental)
  if (fundamentalBin === 0) {
    return
  }

  const bandwidthBins = Math.max(1, Math.floor(half * partial.bandwidth))

  // Create a mask for which bins to keep
  const keep = Array.from({ length: half + 1 }).fill(false)

  // Keep DC
  keep[0] = true

  // Keep fundamental and harmonics
  for (let h = 1; h <= partial.harmonics; h++) {
    const harmonicBin = fundamentalBin * h
    if (harmonicBin > half) {
      break
    }

    // Keep bins around this harmonic
    for (let offset = -bandwidthBins; offset <= bandwidthBins; offset++) {
      const bin = harmonicBin + offset
      if (bin >= 0 && bin <= half) {
        keep[bin] = true
      }
    }
  }

  // Zero out bins not in the keep list
  for (let k = 0; k <= half; k++) {
    if (!keep[k]) {
      const idx = k * 2
      spectrum[idx] = 0
      spectrum[idx + 1] = 0
    }

    // Mirror
    if (k > 0 && k < half) {
      const N = half * 2
      const negIdx = (N - k) * 2
      if (keep[k]) {
        spectrum[negIdx] = spectrum[k * 2]
        spectrum[negIdx + 1] = -spectrum[k * 2 + 1]
      } else {
        spectrum[negIdx] = 0
        spectrum[negIdx + 1] = 0
      }
    }
  }
}

function applyLightnessSmoothing(lightness: number[], amount: number): number[] {
  if (amount === 0) {
    return lightness
  }

  // Simple gaussian-like smoothing
  const result = [...lightness]
  const passes = Math.max(1, Math.round(amount))

  for (let pass = 0; pass < passes; pass++) {
    const temp = [...result]
    for (let i = 1; i < result.length - 1; i++) {
      // 3-point average with center weighting
      temp[i] = (result[i - 1] + result[i] * 2 + result[i + 1]) / 4
    }
    result.splice(0, result.length, ...temp)
  }

  return result
}
