import { Vector3 } from '../vector.ts'
import { chromaticLch, MagnitudesLch, Stats } from '../metrics-spectral.ts'

/**
 * Strategy 1: Match the spectral smoothness of a reference palette
 *
 * Analyzes the reference palette's frequency distribution and sorts
 * the target colors to create a similar smoothness profile.
 */
export function sortBySpectralSmoothness(colorsLch: Vector3[], referenceFeatures: MagnitudesLch & Stats, achromaticThreshold: number = 0.03): Vector3[] {
  const { chromatic, achromatic } = chromaticLch(colorsLch, achromaticThreshold)

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
export function sortByChromaWave(lchColors: Vector3[], referenceFeatures: MagnitudesLch & Stats, achromaticThreshold: number = 0.03): Vector3[] {
  const { chromatic, achromatic } = chromaticLch(lchColors, achromaticThreshold)

  achromatic.sort((a, b) => b[0] - a[0])

  if (chromatic.length === 0) {
    return achromatic
  }

  // Analyze chroma pattern: oscillating vs monotonic
  const chromaPattern = referenceFeatures.chromaMags
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
export function sortBySpectralTemplate(lchColors: Vector3[], referenceFeatures: MagnitudesLch & Stats, achromaticThreshold: number = 0.03): Vector3[] {
  const { chromatic, achromatic } = chromaticLch(lchColors, achromaticThreshold)

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
export function sortBySpectralGuidance(colors: Vector3[], referenceFeatures: MagnitudesLch & Stats, achromaticThreshold: number = 0.03): Vector3[] {
  // Classify reference palette type
  if (referenceFeatures.smoothness > 3.0) {
    // Very smooth → single ramp
    return sortBySpectralSmoothness(colors, referenceFeatures, achromaticThreshold)
  } else if (referenceFeatures.dominantFrequencies[0] >= 2 && referenceFeatures.smoothness < 1.0) {
    // Low smoothness + high dominant freq → multi-ramp
    return sortBySpectralTemplate(colors, referenceFeatures, achromaticThreshold)
  } else if (referenceFeatures.chromaMags.length > 2 && referenceFeatures.chromaMags[1] > 0.5) {
    // Chroma oscillation detected
    return sortByChromaWave(colors, referenceFeatures, achromaticThreshold)
  } else {
    // Default to template-based
    return sortBySpectralTemplate(colors, referenceFeatures, achromaticThreshold)
  }
}
