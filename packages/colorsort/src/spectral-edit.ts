import FFT from 'fft.js'
import { Vector3 } from './vector.ts'
import { downsamplePalette, resamplePaletteSnap } from './resample.ts'

export interface SpectralProcessingOptions {
  // EQ (original)
  eq?: { lowGain: number; midGain: number; highGain: number }
  dc?: number

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

export function applySpectralProcessing(labColors: Vector3[], options: SpectralProcessingOptions = {}) {
  const N = 256
  const ff = new FFT(N)

  // Resample and convert
  const resampledLabs = resamplePaletteSnap(labColors, N)

  // Extract channels
  const L = resampledLabs.map((c) => c[0])
  const a = resampledLabs.map((c) => c[1])
  const b = resampledLabs.map((c) => c[2])

  // Process lightness with gradient smoothing
  let resultL = [...L]

  if (options.lightnessSmoothing) {
    resultL = applyLightnessSmoothing(resultL, labColors.length * options.lightnessSmoothing)
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
  const rL = processChannelSpectral(ff, resultL, options, true)
  const rA = processChannelSpectral(ff, resultA, options)
  const rB = processChannelSpectral(ff, resultB, options)

  resultA = rA.result
  resultB = rB.result

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

    processed.push(lab)
  }

  const downsampled = downsamplePalette(processed, labColors.length)

  return {
    colors: downsampled,
    resampled: resampledLabs,
    processed,
    spectrum: [rL.spectrum.filter((_, i) => i % 2 === 0 && i > 0 && i <= N), rA.spectrum.filter((_, i) => i % 2 === 0 && i > 0 && i <= N), rB.spectrum.filter((_, i) => i % 2 === 0 && i > 0 && i <= N)]
  }
}

function processChannelSpectral(ff: FFT, signal: number[], options: SpectralProcessingOptions, skip: boolean = false) {
  const N = ff.size
  const spectrum = ff.createComplexArray()

  ff.realTransform(spectrum, signal)

  const half = N / 2

  if (!skip) {
    if (options.dc) {
      spectrum[0] *= options.dc
      spectrum[1] *= options.dc
    }

    // Apply EQ
    if (options.eq) {
      applyEQ(spectrum, options.eq)
    }

    // Apply exciter (harmonic generation)
    if (options.exciter) {
      applyExciter(spectrum, options.exciter)
    }

    // Apply phase shift
    if (options.phaseShift) {
      applyPhaseShift(spectrum, options.phaseShift)
    }

    // Apply reverb (simplified via spectral smearing)
    if (options.reverb) {
      applyReverb(spectrum, half, options.reverb)
    }

    // Apply comb filter
    if (options.combFilter) {
      applyCombFilter(spectrum, options.combFilter)
    }

    // Apply spectral blur
    if (options.spectralBlur) {
      applySpectralBlur(spectrum, options.spectralBlur)
    }

    // Apply spectral gate
    if (options.spectralGate) {
      applySpectralGate(spectrum, options.spectralGate)
    }

    // Apply partial extraction
    if (options.partialExtraction) {
      applyPartialExtraction(spectrum, options.partialExtraction)
    }
  }

  // Inverse transform
  ff.completeSpectrum(spectrum)
  const outputComplex = ff.createComplexArray()
  ff.inverseTransform(outputComplex, spectrum)

  // Extract real parts (no normalization needed - your FFT library handles it)
  const result: number[] = []

  for (let i = 0; i < N; i++) {
    result[i] = outputComplex[i * 2]
  }

  return { result, spectrum }
}

function applyEQ(spectrum: number[], eq: { lowGain: number; midGain: number; highGain: number }) {
  const half = spectrum.length / 2

  // Octave-based cutoffs (each band is 2x the frequency of previous)
  const lowCutoff = Math.pow(2, 3) * 2 // 2^3 = 8 bins
  const highCutoff = Math.pow(2, 5) * 2 // 2^5 = 32 bins

  for (let idx = 2; idx < half; idx += 2) {
    // Skip DC, process all
    let gain = 1.0

    if (idx < lowCutoff) {
      gain = eq.lowGain
    } else if (idx < highCutoff) {
      gain = eq.midGain
    } else {
      gain = eq.highGain
    }

    // Optional: boost high frequencies more
    const freqScale = 1 + Math.log2(idx / half + 1) * 2
    gain *= freqScale

    spectrum[idx] *= gain
    spectrum[idx + 1] *= gain
  }
}

function applyExciter(spectrum: number[], exciter: { amount: number; frequency: number }) {
  const half = spectrum.length / 2

  // Generate harmonics by duplicating energy at higher frequencies
  const targetBin = Math.floor(1 + (half / 2) * exciter.frequency)
  const harmonicStart = Math.max(2, targetBin * 2)

  for (let idx = harmonicStart; idx < half; idx += 2) {
    const sourceK = Math.floor(idx / 4) * 2
    const srcIdx = sourceK * 2

    // Optional: boost high frequencies more
    const freqScale = 1 + Math.log2(idx / half + 1) * 2

    spectrum[idx] += spectrum[srcIdx] * exciter.amount * 0.5 * freqScale
    spectrum[idx + 1] += spectrum[srcIdx + 1] * exciter.amount * 0.5 * freqScale
  }
}

function applyPhaseShift(spectrum: number[], degrees: number) {
  const radians = (degrees * Math.PI) / 180
  const half = spectrum.length / 2

  for (let idx = 2; idx <= half; idx += 2) {
    const re = spectrum[idx]
    const im = spectrum[idx + 1]

    // Rotate by angle in complex plane
    const mag = Math.sqrt(re * re + im * im)
    const phase = Math.atan2(im, re) + radians

    spectrum[idx] = mag * Math.cos(phase)
    spectrum[idx + 1] = mag * Math.sin(phase)
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

function applyCombFilter(spectrum: number[], comb: { frequency: number; feedback: number; mix: number }) {
  const half = spectrum.length / 2 / 2

  // Comb filter creates notches at regular intervals
  const fundamentalBin = Math.floor(half * comb.frequency)
  if (fundamentalBin === 0) {
    return
  }

  const drySpectrum = new Float64Array(spectrum)

  // Create notches at multiples of fundamental
  for (let k = 1; k < half; k++) {
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
  }
}

function applySpectralBlur(spectrum: number[], blur: { amount: number }) {
  const half = spectrum.length / 2

  if (blur.amount === 0) {
    return
  }

  const radius = Math.max(1, Math.round(blur.amount))
  const blurred = new Float64Array(spectrum)

  // Gaussian-like blur using box filter approximation
  for (let idx = 2; idx < half; idx += 2) {
    let sumRe = 0
    let sumIm = 0
    let count = 0

    for (let offset = -radius; offset <= radius; offset++) {
      const nIdx = idx + offset

      if (nIdx >= 2 && nIdx < half) {
        sumRe += spectrum[nIdx]
        sumIm += spectrum[nIdx + 1]
        count++
      }
    }

    blurred[idx] = sumRe / count
    blurred[idx + 1] = sumIm / count
  }

  // Copy back
  for (let i = 2; i < half; i++) {
    spectrum[i] = blurred[i]
  }
}

function applySpectralGate(spectrum: number[], gate: { threshold: number; ratio: number }) {
  const half = spectrum.length / 2 / 2

  // Calculate overall magnitude threshold
  let maxMag = 0

  for (let k = 1; k < half; k++) {
    const idx = k * 2
    const mag = Math.sqrt(spectrum[idx] ** 2 + spectrum[idx + 1] ** 2)
    maxMag = Math.max(maxMag, mag)
  }

  const threshold = maxMag * gate.threshold

  for (let k = 1; k < half; k++) {
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
  }
}

function applyPartialExtraction(spectrum: number[], partial: { fundamental: number; harmonics: number; bandwidth: number }) {
  const half = spectrum.length / 2 / 2
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
