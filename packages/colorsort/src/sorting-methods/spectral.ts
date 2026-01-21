import { Vector3 } from '../vector.ts'
import { fft, magnitude } from '../metrics-fft.ts'

// ============================================================================
// Spectral Feature Extraction
// ============================================================================

interface SpectralFeatures {
  huePattern: number[] // FFT magnitudes of hue differences
  chromaPattern: number[] // FFT magnitudes of chroma values
  lightnessPattern: number[] // FFT magnitudes of lightness values
  dominantFrequencies: number[] // Top frequency bins
  smoothness: number // Low-freq / high-freq ratio
  complexity: number // Spectral entropy
}

export function extractSpectralFeatures(colors: Vector3[]): SpectralFeatures {
  const chromatic = colors.filter((c) => c[1] >= 0.03)

  if (chromatic.length < 3) {
    return {
      huePattern: [],
      chromaPattern: [],
      lightnessPattern: [],
      dominantFrequencies: [],
      smoothness: 0,
      complexity: 0
    }
  }

  // Extract channels
  const hues = chromatic.map((c) => c[2])
  const chromas = chromatic.map((c) => c[1])
  const lightnesses = chromatic.map((c) => c[0])

  // Sort hues and calculate deltas (captures clustering pattern)
  const sortedHues = [...hues].sort((a, b) => a - b)
  const hueDeltas: number[] = []

  for (let i = 0; i < sortedHues.length - 1; i++) {
    hueDeltas.push(sortedHues[i + 1] - sortedHues[i])
  }

  hueDeltas.push(360 - sortedHues[sortedHues.length - 1] + sortedHues[0])

  // Compute FFTs
  const hueDeltaFFT = fft(hueDeltas)
  const chromaFFT = fft(chromas)
  const lightnessFFT = fft(lightnesses)

  // Extract magnitudes (first half, excluding DC component)
  const huePattern = hueDeltaFFT.slice(1, Math.floor(hueDeltaFFT.length / 2)).map(magnitude)
  const chromaPattern = chromaFFT.slice(1, Math.floor(chromaFFT.length / 2)).map(magnitude)
  const lightnessPattern = lightnessFFT.slice(1, Math.floor(lightnessFFT.length / 2)).map(magnitude)

  // Find dominant frequencies
  const dominantFrequencies = huePattern
    .map((mag, i) => ({ freq: i + 1, mag }))
    .sort((a, b) => b.mag - a.mag)
    .slice(0, 3)
    .map((x) => x.freq)

  // Calculate smoothness (low-freq energy / high-freq energy)
  const cutoff = Math.ceil(huePattern.length * 0.3)
  const lowFreqEnergy = huePattern.slice(0, cutoff).reduce((sum, m) => sum + m * m, 0)
  const highFreqEnergy = huePattern.slice(cutoff).reduce((sum, m) => sum + m * m, 0)
  const smoothness = highFreqEnergy > 0 ? lowFreqEnergy / highFreqEnergy : Infinity

  // console.log({lowFreqEnergy, highFreqEnergy, smoothness, cutoff, huePattern})

  // Calculate spectral entropy (complexity measure)
  const totalEnergy = huePattern.reduce((sum, m) => sum + m * m, 0)
  const probabilities = huePattern.map((m) => (m * m) / totalEnergy)
  const complexity = -probabilities.reduce((sum, p) => sum + (p > 0 ? p * Math.log(p) : 0), 0)

  return {
    huePattern,
    chromaPattern,
    lightnessPattern,
    dominantFrequencies,
    smoothness,
    complexity
  }
}

// ============================================================================
// Spectral-Guided Sorting Strategies
// ============================================================================

/**
 * Strategy 1: Match the spectral smoothness of a reference palette
 *
 * Analyzes the reference palette's frequency distribution and sorts
 * the target colors to create a similar smoothness profile.
 */
export function sortBySpectralSmoothness(colors: Vector3[], referenceFeatures: SpectralFeatures, achromaticThreshold: number = 0.03): Vector3[] {
  // Separate chromatic and achromatic
  const chromatic = colors.filter((c) => c[1] >= achromaticThreshold)
  const achromatic = colors.filter((c) => c[1] < achromaticThreshold)

  // Sort achromatic by lightness
  achromatic.sort((a, b) => b[0] - a[0])

  if (chromatic.length === 0) {
    return achromatic
  }

  // Determine sorting strategy based on reference smoothness
  if (referenceFeatures.smoothness > 2.0) {
    // Reference is smooth → create gradual transitions
    chromatic.sort((a, b) => {
      // Primary: hue
      const hDiff = a[2] - b[2]
      if (Math.abs(hDiff) > 1) {
        return hDiff
      }

      // Secondary: chroma (smooth gradient)
      const cDiff = b[1] - a[1]
      if (Math.abs(cDiff) > 0.01) {
        return cDiff
      }

      // Tertiary: lightness
      return b[0] - a[0]
    })
  } else {
    // Reference has abrupt transitions → create distinct groups
    const hueGroupSize = 360 / (referenceFeatures.dominantFrequencies[0] || 3)

    chromatic.sort((a, b) => {
      const groupA = Math.floor(a[2] / hueGroupSize)
      const groupB = Math.floor(b[2] / hueGroupSize)

      if (groupA !== groupB) {
        return groupA - groupB
      }

      // Within group: high chroma first, then by lightness
      const cDiff = b[1] - a[1]
      if (Math.abs(cDiff) > 0.02) {
        return cDiff
      }

      return b[0] - a[0]
    })
  }

  return [...achromatic, ...chromatic]
}

/**
 * Strategy 2: Match the chroma wave pattern of a reference palette
 *
 * Uses the chroma FFT pattern to create similar saturation rhythms.
 */
export function sortByChromaWave(colors: Vector3[], referenceFeatures: SpectralFeatures, achromaticThreshold: number = 0.03): Vector3[] {
  const chromatic = colors.filter((c) => c[1] >= achromaticThreshold)
  const achromatic = colors.filter((c) => c[1] < achromaticThreshold)

  achromatic.sort((a, b) => b[0] - a[0])

  if (chromatic.length === 0) {
    return achromatic
  }

  // Analyze chroma pattern: oscillating vs monotonic
  const chromaPattern = referenceFeatures.chromaPattern
  const hasOscillation = chromaPattern.length > 2 && chromaPattern[1] > chromaPattern[0] * 0.5

  if (hasOscillation) {
    // Create alternating high/low chroma pattern
    const highChroma = chromatic.filter((c) => c[1] > 0.15).sort((a, b) => a[2] - b[2])
    const lowChroma = chromatic.filter((c) => c[1] <= 0.15).sort((a, b) => a[2] - b[2])

    const result: Vector3[] = []
    const maxLen = Math.max(highChroma.length, lowChroma.length)
    for (let i = 0; i < maxLen; i++) {
      if (i < highChroma.length) {
        result.push(highChroma[i])
      }
      if (i < lowChroma.length) {
        result.push(lowChroma[i])
      }
    }

    return [...achromatic, ...result]
  } else {
    // Monotonic chroma sorting (vivid to muted or vice versa)
    chromatic.sort((a, b) => {
      const hDiff = a[2] - b[2]
      if (Math.abs(hDiff) > 15) {
        return hDiff
      }
      return b[1] - a[1] // High chroma first
    })

    return [...achromatic, ...chromatic]
  }
}

/**
 * Strategy 3: Reconstruct spectral template
 *
 * Uses the reference palette's dominant frequencies to determine
 * how many distinct hue groups to create.
 */
export function sortBySpectralTemplate(colors: Vector3[], referenceFeatures: SpectralFeatures, achromaticThreshold: number = 0.03): Vector3[] {
  const chromatic = colors.filter((c) => c[1] >= achromaticThreshold)
  const achromatic = colors.filter((c) => c[1] < achromaticThreshold)

  achromatic.sort((a, b) => b[0] - a[0])

  if (chromatic.length === 0) {
    return achromatic
  }

  // Determine number of hue groups from dominant frequency
  const numGroups = referenceFeatures.dominantFrequencies[0] || (referenceFeatures.smoothness > 2.0 ? 1 : 3)

  const hueGroupSize = 360 / numGroups

  chromatic.sort((a, b) => {
    // Normalize hues to start at 0
    const normalizeHue = (h: number) => h % 360
    const hA = normalizeHue(a[2])
    const hB = normalizeHue(b[2])

    // Assign to hue groups
    const groupA = Math.floor(hA / hueGroupSize)
    const groupB = Math.floor(hB / hueGroupSize)

    if (groupA !== groupB) {
      return groupA - groupB
    }

    // Within group: sort by chroma then lightness
    const cDiff = b[1] - a[1]
    if (Math.abs(cDiff) > 0.02) {
      return cDiff
    }

    return b[0] - a[0]
  })

  return [...achromatic, ...chromatic]
}

/**
 * Strategy 4: Hybrid approach - detect palette type and apply best strategy
 */
export function sortBySpectralGuidance(colors: Vector3[], referenceColors: Vector3[], achromaticThreshold: number = 0.03): Vector3[] {
  const features = extractSpectralFeatures(referenceColors)

  // Classify reference palette type
  if (features.smoothness > 3.0) {
    // Very smooth → single ramp
    return sortBySpectralSmoothness(colors, features, achromaticThreshold)
  } else if (features.dominantFrequencies[0] >= 2 && features.smoothness < 1.0) {
    // Low smoothness + high dominant freq → multi-ramp
    return sortBySpectralTemplate(colors, features, achromaticThreshold)
  } else if (features.chromaPattern.length > 2 && features.chromaPattern[1] > 0.5) {
    // Chroma oscillation detected
    return sortByChromaWave(colors, features, achromaticThreshold)
  } else {
    // Default to template-based
    return sortBySpectralTemplate(colors, features, achromaticThreshold)
  }
}
