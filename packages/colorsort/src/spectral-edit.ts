import FFT from 'fft.js'
import { Vector3 } from './vector.ts'
import { oklab2oklch, oklch2oklab } from './color.ts'
import { downsamplePalette, resamplePalette } from './resample.ts'

export interface SpectralProcessingOptions {
  // EQ (original)
  eq?: { lowGain: number; midGain: number; highGain: number }

  // Compression/Limiting
  compression?: {
    threshold: number    // threshold for compression (0-1)
    ratio: number        // compression ratio (1 = none, 10 = heavy)
    attack: number       // attack coefficient (0-1, higher = faster)
    release: number      // release coefficient (0-1, higher = faster)
  }

  // Exciter/Saturation (harmonic generation)
  exciter?: {
    amount: number       // how much harmonics to add (0-1)
    frequency: number    // which freq band to excite (0-1, normalized)
  }

  // Phase vocoder effects
  phaseShift?: number    // circular phase rotation in degrees

  // Reverb (via convolution)
  reverb?: {
    decay: number        // decay time (0-1)
    mix: number          // wet/dry (0-1)
  }

  // Stereo width (for a/b channel separation)
  stereoWidth?: number   // 0 = mono, 1 = normal, >1 = widened

  // Distortion/waveshaping
  distortion?: {
    amount: number       // drive (0-1)
    type: 'soft' | 'hard' | 'tube'
  }
}

export function applySpectralProcessing(
  colors: Vector3[],
  options: SpectralProcessingOptions = {}
) {
  const N = 256
  const ff = new FFT(N)

  // Resample and convert
  const resampled = resamplePalette(colors, N)
  const oklabColors = resampled.map(oklch2oklab)

  // Extract channels
  const L = oklabColors.map((c) => c[0])
  const a = oklabColors.map((c) => c[1])
  const b = oklabColors.map((c) => c[2])

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
      L[i],
      clamp(resultA[i], -0.4, 0.4),  // Oklab a/b typical range
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

function processChannelSpectral(
  ff: FFT,
  signal: number[],
  options: SpectralProcessingOptions
): number[] {
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

function applyEQ(
  spectrum: number[],
  half: number,
  eq: { lowGain: number; midGain: number; highGain: number }
) {
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

function applyExciter(
  spectrum: number[],
  half: number,
  exciter: { amount: number; frequency: number }
) {
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

function applyPhaseShift(
  spectrum:  number[],
  half: number,
  degrees: number
) {
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

function applyReverb(
  spectrum: number[],
  half: number,
  reverb: { decay: number; mix: number }
) {
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

    const prevMag = Math.sqrt(spectrum[prevIdx]**2 + spectrum[prevIdx+1]**2)
    const currMag = Math.sqrt(re * re + im * im)
    const nextMag = Math.sqrt(spectrum[nextIdx]**2 + spectrum[nextIdx+1]**2)

    const smoothMag = (prevMag + currMag * 2 + nextMag) / 4 * reverb.decay

    const wetRe = smoothMag * Math.cos(phase)
    const wetIm = smoothMag * Math.sin(phase)

    spectrum[idx] = drySpectrum[idx] * (1 - reverb.mix) + wetRe * reverb.mix
    spectrum[idx + 1] = drySpectrum[idx + 1] * (1 - reverb.mix) + wetIm * reverb.mix
  }
}

function applyDistortion(
  signal: number[],
  dist: { amount: number; type: 'soft' | 'hard' | 'tube' }
): number[] {
  const drive = 1 + dist.amount * 9

  return signal.map(x => {
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
        return driven > 0
          ? driven / (1 + driven * 0.5)
          : driven / (1 - driven * 0.3)

      default:
        return driven
    }
  })
}

function applyCompression(
  signal: number[],
  comp: { threshold: number; ratio: number; attack: number; release: number }
): number[] {
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