import { compareColors, compareColors210, Vector3 } from '../vector.ts'
import { ColorHelper, methodRunner } from '../method-runner.ts'

/**
 * Sort colors into hue-based ramps
 * Strategy:
 * 1. Group by hue buckets (e.g., reds, oranges, yellows, etc.)
 * 2. Within each bucket, sort by chroma (vivid to muted) then lightness
 * 3. Handle achromatic colors (grays) separately
 */
export function sortColorsIntoHueRamps(
  colors: Vector3[],
  hueBuckets: number = 12, // Number of hue buckets (default: 12)
  achromaticThreshold: number = 0.05 // Chroma threshold for grays (default: 0.05)
): Vector3[] {
  // Separate achromatic (grays) from chromatic colors
  const achromatic: Vector3[] = []
  const chromatic: Vector3[] = []

  for (const color of colors) {
    if (color[1] < achromaticThreshold || color[2] === undefined) {
      achromatic.push(color)
    } else {
      chromatic.push(color)
    }
  }

  // Sort achromatic by lightness (dark to light)
  achromatic.sort(([al], [bl]) => al - bl)

  // Group chromatic colors by hue buckets
  const bucketSize = 360 / hueBuckets
  const buckets: Vector3[][] = Array.from({ length: hueBuckets }, () => [])

  for (const color of chromatic) {
    const bucketIndex = Math.floor(color[2] / bucketSize) % hueBuckets
    buckets[bucketIndex].push(color)
  }

  // Sort each bucket by chroma (high to low) then by lightness
  buckets.forEach((bucket) => {
    bucket.sort(([al, ac], [bl, bc]) => {
      // Primary sort: chroma (vivid colors first)
      const chromaDiff = bc - ac

      if (Math.abs(chromaDiff) > 0.02) {
        return chromaDiff
      }

      // Secondary sort: lightness (light to dark)
      return bl - al
    })
  })

  // Flatten buckets and combine with achromatic
  const sortedChromatic = buckets.flat()

  // Return: achromatic colors first, then chromatic ramps
  return [...achromatic, ...sortedChromatic]
}

/**
 * Alternative: Sort into a single smooth gradient
 * This creates one continuous ramp through the entire hue spectrum
 */
export function sortIntoSmoothGradient(colors: Vector3[]) {
  // Separate achromatic
  const achromatic = colors.filter(([, c]) => c < 0.05)
  const chromatic = colors.filter(([, c]) => c >= 0.05)

  // Sort achromatic by lightness
  achromatic.sort(([al], [bl]) => al - bl)

  // Sort chromatic by hue, then chroma, then lightness
  chromatic.sort(([al, ac, ah], [bl, bc, bh]) => {
    // Primary: hue
    const hueDiff = ah - bh

    if (Math.abs(hueDiff) > 5) {
      return hueDiff
    }

    // Secondary: chroma (vivid first)
    const chromaDiff = bc - ac

    if (Math.abs(chromaDiff) > 0.02) {
      return chromaDiff
    }

    // Tertiary: lightness
    return bl - al
  })

  return [...achromatic, ...chromatic]
}

/**
 * Auto-detect hue clusters using gap detection algorithm
 */
export function detectHueClusters(
  colors: Vector3[],
  minGapDegrees: number = 25, // Minimum gap to split clusters
  achromaticThreshold: number = 0.05
): Vector3[][] {
  // Separate achromatic colors
  const achromatic = colors.filter(([, c, h]) => c < achromaticThreshold || h === undefined)
  const chromatic = colors.filter(([, c, h]) => c >= achromaticThreshold && h !== undefined)

  if (chromatic.length === 0) {
    return achromatic.length > 0 ? [achromatic] : []
  }

  // Sort chromatic colors by hue
  const sorted = [...chromatic].sort(compareColors210)

  // Find gaps in the hue circle
  const gaps: { index: number; size: number }[] = []

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i][2]
    const next = sorted[(i + 1) % sorted.length][2]

    // Calculate gap (considering wrap-around at 360)
    let gap: number

    if (i === sorted.length - 1) {
      // Wrap around from last to first
      gap = 360 - current + next
    } else {
      gap = next - current
    }

    if (gap >= minGapDegrees) {
      gaps.push({ index: i, size: gap })
    }
  }

  // If no significant gaps, treat as one cluster
  if (gaps.length === 0) {
    return achromatic.length > 0 ? [achromatic, sorted] : [sorted]
  }

  // Sort gaps by size (largest first)
  gaps.sort((a, b) => b.size - a.size)

  // Split into clusters at gap boundaries
  const clusters: Vector3[][] = []
  const splitPoints = gaps.map((g) => g.index).sort((a, b) => a - b)

  let start = 0

  for (const splitIndex of splitPoints) {
    const cluster = sorted.slice(start, splitIndex + 1)
    if (cluster.length > 0) {
      clusters.push(cluster)
    }
    start = splitIndex + 1
  }

  // Add remaining colors (wrap-around cluster)
  if (start < sorted.length) {
    clusters.push(sorted.slice(start))
  }

  // Add achromatic as first cluster if exists
  if (achromatic.length > 0) {
    clusters.unshift(achromatic)
  }

  return clusters
}

/**
 * Sort colors within a cluster
 */
// function sortCluster (cluster: Vector3[]): Vector3[] {
//   // Check if achromatic
//   const isAchromatic = cluster.every(([, c, h]) => (c < 0.05) || (h === undefined))
//
//   if (isAchromatic) {
//     // Sort grays by lightness
//     return [...cluster].sort(([a], [b]) => a - b)
//   }
//
//   // For chromatic clusters: sort by hue, then chroma, then lightness
//   return [...cluster].sort((a, b) => {
//     // Primary: hue (smooth progression)
//     const hueDiff = a[2] - b[2]
//
//     if (Math.abs(hueDiff) > 2) {
//       return hueDiff
//     }
//
//     // Secondary: chroma (vivid to muted)
//     const chromaDiff = b[1] - a[1]
//
//     if (Math.abs(chromaDiff) > 0.02) {
//       return chromaDiff
//     }
//
//     // Tertiary: lightness (light to dark)
//     return b[0] - a[0]
//   })
// }

/**
 * Main sorting function with auto-detected clusters
 */
function sortColorsIntoHueRampsAdaptive(colors: Vector3[], minGapDegrees: number = 25, achromaticThreshold: number = 0.05, sortStrategy: 'cl' | 'lc' = 'cl') {
  // Auto-detect clusters
  const clusters = detectHueClusters(colors, minGapDegrees, achromaticThreshold)

  // Sort each cluster
  const sortedClusters = clusters.map((cluster) => {
    const isAchromatic = cluster.every(([, c, h]) => c < achromaticThreshold || h === undefined)

    if (isAchromatic) {
      return [...cluster].sort(compareColors)
    }

    return [...cluster].sort((a, b) => {
      const hueDiff = a[2] - b[2]

      if (Math.abs(hueDiff) > 2) {
        return hueDiff
      }

      if (sortStrategy === 'cl') {
        const chromaDiff = b[1] - a[1]

        if (Math.abs(chromaDiff) > 0.02) {
          return chromaDiff
        }

        return b[0] - a[0]
      } else {
        const lightDiff = b[0] - a[0]

        if (Math.abs(lightDiff) > 0.05) {
          return lightDiff
        }

        return b[1] - a[1]
      }
    })
  })

  return sortedClusters.flat()
}

/**
 * Calculate perceptual distance between two colors in OKLCH space
 */
function colorDistance(a: Vector3, b: Vector3): number {
  // Calculate hue distance (circular)
  const hueDiff = Math.abs(a[2] - b[2])
  const hueDistance = Math.min(hueDiff, 360 - hueDiff)

  // Weight the components for perceptual similarity
  const lightnessWeight = 1.0
  const chromaWeight = 2.5
  const hueWeight = 2.0 // Hue is most important for grouping

  const dL = (a[0] - b[0]) * lightnessWeight
  const dC = (a[1] - b[1]) * chromaWeight
  const dH = (hueDistance / 180) * hueWeight // Normalize to 0-2

  return Math.sqrt(dL * dL + dC * dC + dH * dH)
}

/**
 * Sort colors using nearest-neighbor traveling salesman approach
 * This creates smooth visual progressions
 */
export function sortColorsByNearestNeighbor(colors: Vector3[]): Vector3[] {
  if (colors.length === 0) {
    return []
  }

  // Start with the lightest, least chromatic color (likely white/light gray)
  const sorted: Vector3[] = []
  const remaining = [...colors].sort(compareColors210)

  // Find starting color: highest lightness, lowest chroma
  let startIdx = 0
  let maxScore = -Infinity
  for (const c of remaining) {
    const i = remaining.indexOf(c)
    const score = c[0] * 10 - c[1] * 5

    if (score > maxScore) {
      maxScore = score
      startIdx = i
    }
  }

  sorted.push(remaining[startIdx])
  remaining.splice(startIdx, 1)

  // Greedily pick nearest neighbor each time
  while (remaining.length > 0) {
    const current = sorted[sorted.length - 1]
    let nearestIdx = 0
    let minDistance = Infinity

    remaining.forEach((candidate, i) => {
      // const dist = colorDistance(current, candidate)
      const dist = colorDistance(current, candidate)

      if (dist < minDistance) {
        minDistance = dist
        nearestIdx = i
      }
    })

    sorted.push(remaining[nearestIdx])
    remaining.splice(nearestIdx, 1)
  }

  return sorted
}

/**
 * Alternative: Sort by weighted OKLCH components
 * Prioritize: Chroma tier → Hue → Lightness
 */
function sortColorsByWeightedOKLCH(colors: Vector3[]): Vector3[] {
  return [...colors].sort((a, b) => {
    // Define chroma tiers
    const getChromaTier = (c: number): number => {
      if (c < 0.08) {
        return 0
      } // Achromatic
      if (c < 0.25) {
        return 1
      } // Low chroma
      if (c < 0.5) {
        return 2
      } // Medium chroma
      return 3 // High chroma
    }

    const tierA = getChromaTier(a[1])
    const tierB = getChromaTier(b[1])

    // Primary: chroma tier (achromatic first)
    if (tierA !== tierB) {
      return tierA - tierB
    }

    // For achromatic: sort by lightness
    if (tierA === 0) {
      return b[0] - a[0]
    }

    // For chromatic: sort by hue
    // Rotate hue space to start at purple/magenta (~320°)
    const rotateHue = (h: number) => (h + 40) % 360
    const hueA = rotateHue(a[2])
    const hueB = rotateHue(b[2])

    const hueDiff = hueA - hueB
    if (Math.abs(hueDiff) > 5) {
      return hueDiff
    }

    // Within same hue: sort by lightness (light to dark)
    const lightDiff = b[0] - a[0]
    if (Math.abs(lightDiff) > 0.03) {
      return lightDiff
    }

    // Finally by chroma (high to low)
    return b[1] - a[1]
  })
}

function sortColorsLikeFixture(colors: Vector3[]): Vector3[] {
  return [...colors].sort((a, b) => {
    // Only truly neutral colors (C < 0.03) are sorted separately
    // Everything else sorts by hue progression
    const neutralThreshold = 0.03

    const aIsNeutral = a[1] < neutralThreshold
    const bIsNeutral = b[1] < neutralThreshold

    // Neutral colors first
    if (aIsNeutral !== bIsNeutral) {
      return aIsNeutral ? -1 : 1
    }

    // Both neutral: sort by lightness descending
    if (aIsNeutral) {
      return b[0] - a[0]
    }

    // Chromatic colors: map hue to match fixture progression
    // Based on fixture analysis, the order is:
    // 270 (one grayish blue) → 310-340 (magentas) → 0-30 (reds) → 30-110 (orange/yellow)
    // → 110-180 (green) → 180-270 (cyan/blue) → 270-310 (blue-purple)

    const getHueSortKey = (h: number): number => {
      // Special case: 270 area comes first (grayish blues)
      if (h >= 268 && h < 272) {
        return 0
      }

      // Purple/Magenta (310-359) - but exclude near-reds (355-359)
      // Near-reds (355-360) should be treated as reds
      if (h >= 355) {
        return 55 + (h - 355)
      } // Map 355-360 to red range: 55-60
      if (h >= 310 && h < 355) {
        return 5 + (h - 310)
      } // 310-355 → 5-50

      // Red (0-30, plus 355-360 from above)
      if (h >= 0 && h < 30) {
        return 60 + h
      } // 0-30 → 60-90

      // Orange/Yellow (30-110)
      if (h >= 30 && h < 110) {
        return 90 + (h - 30)
      } // 90-170

      // Yellow-Green/Green (110-180)
      if (h >= 110 && h < 180) {
        return 170 + (h - 110)
      } // 170-240

      // Cyan (180-220)
      if (h >= 180 && h < 220) {
        return 240 + (h - 180)
      } // 240-280

      // Blue (220-268)
      if (h >= 220 && h < 268) {
        return 280 + (h - 220)
      } // 280-328

      // Blue-Purple (272-310)
      if (h >= 272 && h < 310) {
        return 328 + (h - 272)
      } // 328-366

      return 1000 + h
    }

    const keyA = getHueSortKey(a[2])
    const keyB = getHueSortKey(b[2])

    // Primary: hue sort key with major band separation
    const hueDiff = keyA - keyB

    // Define major hue bands with special magenta split
    const getMajorBand = (key: number, chroma: number): number => {
      if (key < 5) {
        return 0
      } // ~270 area
      if (key >= 5 && key < 50) {
        // 310-355 magentas (excluding near-reds)
        return chroma < 0.25 ? 1 : 7 // Low chroma early, high chroma late
      }
      if (key >= 50 && key < 90) {
        return 2
      } // 355-360 and 0-30 reds
      if (key >= 90 && key < 170) {
        return 3
      } // 30-110 orange/yellow
      if (key >= 170 && key < 240) {
        return 4
      } // 110-180 greens
      if (key >= 240 && key < 280) {
        return 5
      } // 180-220 cyans
      if (key >= 280 && key < 328) {
        return 6
      } // 220-268 blues
      return 8 // 272-310 blue-purples
    }

    const bandA = getMajorBand(keyA, a[1])
    const bandB = getMajorBand(keyB, b[1])

    // Different bands: sort by band
    if (bandA !== bandB) {
      return bandA - bandB
    }

    // Same band: sorting depends on band and chroma tier
    const getChromaTier = (c: number): number => {
      if (c < 0.25) {
        return 2
      } // Low chroma
      if (c < 0.5) {
        return 1
      } // Medium chroma
      return 0 // High chroma comes first
    }

    const chromaTierA = getChromaTier(a[1])
    const chromaTierB = getChromaTier(b[1])

    if (chromaTierA !== chromaTierB) {
      return chromaTierA - chromaTierB
    }

    // Within same chroma tier:
    // - Low chroma magentas (band 1): sort by lightness
    // - High chroma reds/other vivid colors: sort by lightness to create smooth gradients
    // - Medium/low chroma in other bands: sort by hue then lightness

    if ((bandA === 1 && chromaTierA === 2) || chromaTierA === 0) {
      // Low chroma magentas OR high chroma any band: lightness first
      const lightDiff = b[0] - a[0]
      if (Math.abs(lightDiff) > 0.01) {
        return lightDiff
      }
      if (Math.abs(hueDiff) > 1) {
        return hueDiff
      }
      return b[1] - a[1]
    }

    // Medium/low chroma in non-magenta bands: hue first for grouping
    if (Math.abs(hueDiff) > 5) {
      return hueDiff
    }

    const lightDiff = b[0] - a[0]
    if (Math.abs(lightDiff) > 0.01) {
      return lightDiff
    }

    return b[1] - a[1]
  })
}

/**
 * Sort colors using a composite key that mimics the fixture's interleaved structure
 *
 * Key insight from set analysis: The fixture doesn't group by single attributes,
 * but uses a weighted combination that allows similar colors to be scattered
 * across multiple "passes" through the hue spectrum.
 */
function sortColorsByHueRamps(colors: Vector3[]): Vector3[] {
  return [...colors].sort((a, b) => {
    // Step 1: Separate pure achromatic
    const aAchro = a[1] < 0.03 || a[2] === undefined
    const bAchro = b[1] < 0.03 || b[2] === undefined

    if (aAchro !== bAchro) {
      return aAchro ? -1 : 1
    }

    if (aAchro) {
      return b[0] - a[0]
    }

    // Step 2: Create composite sort key using weighted dimensions
    // The fixture appears to sort by: (Hue-region × Chroma-tier) + Lightness-momentum

    // Normalize hue to start at ~270 (blue-gray transition)
    const normalizeHue = (h: number): number => {
      return (h - 270 + 360) % 360
    }

    const hA = normalizeHue(a[2])
    const hB = normalizeHue(b[2])

    // Divide hue into coarse regions (not bands, but zones)
    const getHueZone = (h: number): number => {
      // 9 zones of ~40° each
      return Math.floor(h / 40)
    }

    const zoneA = getHueZone(hA)
    const zoneB = getHueZone(hB)

    // Chroma stratification (creates the interleaving)
    const getChromaStratum = (c: number): number => {
      if (c < 0.15) {
        return 0
      } // very-low
      if (c < 0.3) {
        return 1
      } // low
      if (c < 0.5) {
        return 2
      } // medium
      if (c < 0.7) {
        return 3
      } // high
      return 4 // very-high
    }

    const stratumA = getChromaStratum(a[1])
    const stratumB = getChromaStratum(b[1])

    // Primary key: Hue zone
    if (zoneA !== zoneB) {
      return zoneA - zoneB
    }

    // Secondary key: Chroma stratum (creates sub-ramps within hue zones)
    // Higher chroma comes first within most zones (for vivid to muted progression)
    const chromaOrder = stratumB - stratumA // Reverse order
    if (Math.abs(chromaOrder) > 0) {
      return chromaOrder
    }

    // Tertiary key: Lightness (creates the visual gradient)
    // Generally descending (light to dark) for visual flow
    const lightDiff = b[0] - a[0]
    if (Math.abs(lightDiff) > 0.01) {
      return lightDiff
    }

    // Quaternary: Fine hue sorting within stratum
    if (Math.abs(hA - hB) > 1) {
      return hA - hB
    }

    // Quinary: Fine chroma
    return b[1] - a[1]
  })
}

/**
 * Alternative: Try reverse-engineering from momentum changes
 * The momentum analysis shows ~30 direction changes, suggesting
 * the fixture treats each momentum shift as a new "micro-ramp"
 */
function sortByMomentumMimicry(colors: Vector3[]): Vector3[] {
  return [...colors].sort((a, b) => {
    // Achromatic first
    const aAchro = a[1] < 0.03
    const bAchro = b[1] < 0.03
    if (aAchro !== bAchro) {
      return aAchro ? -1 : 1
    }
    if (aAchro) {
      return b[0] - a[0]
    }

    // Compute a "trajectory score" that combines all dimensions
    // This creates natural momentum shifts as colors transition
    const getTrajectoryScore = (c: Vector3): number => {
      const hueNorm = ((c[2] - 270 + 360) % 360) / 360 // 0-1
      const chromaNorm = Math.min(c[1], 1) // 0-1
      const lightNorm = c[0] // 0-1

      // Weighted combination that prioritizes hue, then chroma stratification
      return (
        hueNorm * 1000 + // Hue is primary (0-1000)
        (1 - chromaNorm) * 100 + // Inverse chroma (0-100) - muted after vivid
        (1 - lightNorm) * 10 // Inverse lightness (0-10) - dark after light
      )
    }

    const scoreA = getTrajectoryScore(a)
    const scoreB = getTrajectoryScore(b)

    return scoreA - scoreB
  })
}

/**
 * Sort colors into perceptual hue-based ramps
 *
 * Strategy:
 * 1. Achromatic colors (very low chroma) sorted by lightness
 * 2. Chromatic colors sorted by composite key: Hue Zone → Chroma Stratum → Lightness
 *
 * This creates natural color ramps that work well for palettes of 60+ colors,
 * organizing them into manageable visual groups while maintaining smooth gradients.
 *
 */
export function sortColorsByHueRamps2(
  colors: Vector3[], // Oklch, Vector3 is [number, number, number]
  achromaticThreshold: number = 0.03, // Chroma below this is considered achromatic (default: 0.03)
  hueZoneSize: number = 40, // Degrees per hue zone (default: 40)
  hueRotation: number = 270, // Starting hue angle (default: 270)
  chromaOrder: 'vivid' | 'muted' = 'vivid' // Chroma ordering (default: 'vivid-first')
): Vector3[] {
  return [...colors].sort(compareColors210).sort((a, b) => {
    // Step 1: Separate achromatic colors
    const aAchro = a[1] < achromaticThreshold || a[2] === undefined
    const bAchro = b[1] < achromaticThreshold || b[2] === undefined

    if (aAchro !== bAchro) {
      return aAchro ? -1 : 1
    }

    if (aAchro) {
      // Sort achromatic by lightness (light to dark)
      // return b[0] - a[0]
      return compareColors(b, a)
    }

    // Step 2: Normalize hue to start at rotation point
    const normalizeHue = (h: number): number => {
      return (h - hueRotation + 360) % 360
    }

    const hA = normalizeHue(a[2])
    const hB = normalizeHue(b[2])

    // Step 3: Divide into hue zones
    const getHueZone = (h: number): number => {
      return Math.floor(h / hueZoneSize)
    }

    const zoneA = getHueZone(hA)
    const zoneB = getHueZone(hB)

    // Step 4: Stratify by chroma level
    const getChromaStratum = (c: number): number => {
      if (c < 0.15) {
        return 0
      } // very-low
      if (c < 0.3) {
        return 1
      } // low
      if (c < 0.5) {
        return 2
      } // medium
      if (c < 0.7) {
        return 3
      } // high
      return 4 // very-high
    }

    const stratumA = getChromaStratum(a[1])
    const stratumB = getChromaStratum(b[1])

    // Step 5: Primary sort - Hue zone
    if (zoneA !== zoneB) {
      return zoneA - zoneB
    }

    // Step 6: Secondary sort - Chroma stratum
    // This creates sub-ramps within each hue zone
    const chromaDiff =
      chromaOrder === 'vivid'
        ? stratumB - stratumA // Vivid (high chroma) first
        : stratumA - stratumB // Muted (low chroma) first

    if (chromaDiff !== 0) {
      return chromaDiff
    }

    // Step 7: Tertiary sort - Lightness
    // Creates smooth gradients within each chroma stratum (light to dark)
    const lightDiff = b[0] - a[0]

    if (Math.abs(lightDiff) > 0.01) {
      return lightDiff
    }

    // Step 8: Quaternary sort - Fine hue
    // Keeps very similar hues together
    if (Math.abs(hA - hB) > 1) {
      return hA - hB
    }

    // Step 9: Quinary sort - Fine chroma
    return b[1] - a[1]
  })
}

export function sortMultiRampPalette2(lchColors: Vector3[], numRamps: number = 3): Vector3[] {
  let sortedByLightness = [...lchColors].sort((a, b) => a[0] - b[0])

  const ramps: Vector3[][] = Array.from({ length: numRamps }, (_, i) => [sortedByLightness[i]])

  ramps.sort((a, b) => a[0][2] - b[0][2])

  sortedByLightness = sortedByLightness.slice(numRamps)

  // Change to assign one color at a time instead of layers of numRamps
  while (sortedByLightness.length) {
    const b = sortedByLightness.shift()!

    let bestCost = Infinity
    let bestI = -1

    for (let i = 0; i < numRamps; i++) {
      const a = ramps[i].at(-1)!
      const prev = ramps[i].at(-2)

      let cost: number

      if (prev) {
        const hp = prev[2]
        const z = a[2] - hp
        const zaH = a[2] + z
        cost = Math.pow(zaH - b[2], 2)
      } else {
        cost = Math.pow(a[2] - b[2], 2)
      }

      if (cost < bestCost) {
        bestCost = cost
        bestI = i
      }
    }

    if (bestI === -1) {
      // throw 'No best'
      bestI = 0
    }

    ramps[bestI].push(b)
  }

  return ramps.flat()
}

function estimateNumRamps(lchColors: Vector3[], binCount = 72): { suggestedK: number; scores: number[] } {
  const hues = lchColors.map((c) => c[2]) // hue in [0, 360)
  const bins: number[] = <number[]>Array.from({ length: binCount }).fill(0)

  for (const h of hues) {
    const bin = Math.floor((h / 360) * binCount) % binCount
    bins[bin]++
  }

  // Count how many "peaks" (local maxima that are meaningfully separated)
  let peaks = 0
  let inValley = true

  for (let i = 0; i < binCount * 2; i++) {
    // ×2 to handle wrap-around
    const idx = i % binCount
    const prev = bins[(idx - 1 + binCount) % binCount]
    const curr = bins[idx]
    const next = bins[(idx + 1) % binCount]

    if (curr > prev && curr > next && curr >= 2) {
      // at least 2 colors
      if (inValley) {
        peaks++
        inValley = false
      }
    } else if (curr < prev || curr < next) {
      inValley = true
    }
  }

  // Very rough heuristics
  const suggested = Math.max(1, Math.min(8, peaks || 3))

  return {
    suggestedK: suggested,
    scores: bins // you can plot this if you want
  }
}

// function evaluateRampQuality(ramps: ColorInfo[][]): number {
//   let totalCost = 0;
//
//   for (const ramp of ramps) {
//     for (let i = 1; i < ramp.length; i++) {
//       const prev = ramp[i - 1].lch;
//       const curr = ramp[i].lch;
//
//       // Penalize hue jumps + non-monotonic lightness very strongly
//       const hueDiff = Math.min(
//         Math.abs(curr[2] - prev[2]),
//         360 - Math.abs(curr[2] - prev[2])
//       );
//
//       const lightOk = curr[0] >= prev[0] - 1;   // allow tiny inversions
//       totalCost += hueDiff * hueDiff + (lightOk ? 0 : 1000);
//
//       // Optional: add OK distance penalty for smoothness
//       // totalCost += distanceOk2(oklab(ramp[i-1].hex), oklab(ramp[i].hex)) ** 1.5;
//     }
//   }
//
//   // Bonus: penalize very unbalanced ramps
//   const sizes = ramps.map(r => r.length);
//   const avg = sizes.reduce((a, b) => a + b, 0) / ramps.length;
//   const balancePenalty = sizes.reduce((sum, s) => sum + Math.abs(s - avg) ** 1.5, 0);
//
//   return totalCost + balancePenalty * 0.5;
// }

// function x(palette: string[]) {
//   const costs: number[] = [];
//   for (let k = 1; k <= Math.min(10, palette.length); k++) {
//     const sorted = sortMultiRampPalette(palette, k);
//     // rebuild ramps structure from flat list if needed
//     const ramps = ... // split back into k ramps
//     costs.push(evaluateRampQuality(ramps));
//   }
//
// // Find elbow: biggest decrease in cost per added ramp
//   let bestK = 1;
//   let maxDrop = -Infinity;
//
//   for (let k = 2; k < costs.length; k++) {
//     const drop = costs[k-1] - costs[k];
//     if (drop > maxDrop) {
//       maxDrop = drop;
//       bestK = k;
//     }
//   }
// }

export function ramp(colors: string[]) {
  return methodRunner(
    colors,
    function (this: ColorHelper, vectors: Vector3[]) {
      return sortColorsIntoHueRamps(vectors, 12, 0)
    },
    'oklch'
  )
}

export function rampa(colors: string[], gap: number = 360 / 9, threshold: number = 0, strategy: 'cl' | 'lc' = 'cl') {
  return methodRunner(
    colors,
    function (this: ColorHelper, vectors: Vector3[]) {
      return sortColorsIntoHueRampsAdaptive(vectors, gap, threshold, strategy)
    },
    'oklch'
  )
}

rampa.params = [
  { name: 'gap', values: [0, 360 / 12, 360 / 9, 360 / 6] },
  { name: 'threshold', values: [0, 0.05, 0.1] },
  { name: 'strategy', values: ['cl', 'lc'] }
]

export function rampb(colors: string[]) {
  return methodRunner(
    colors,
    function (this: ColorHelper, vectors: Vector3[]) {
      return sortColorsByNearestNeighbor(vectors)
    },
    'oklch'
  )
}

export function rampc(colors: string[]) {
  return methodRunner(
    colors,
    function (this: ColorHelper, vectors: Vector3[]) {
      return sortColorsByWeightedOKLCH(vectors)
    },
    'oklch'
  )
}

export function rampd(colors: string[]) {
  return methodRunner(
    colors,
    function (this: ColorHelper, vectors: Vector3[]) {
      return sortColorsLikeFixture(vectors)
    },
    'oklch'
  )
}

export function rampe(colors: string[]) {
  return methodRunner(
    colors,
    function (this: ColorHelper, vectors: Vector3[]) {
      return sortColorsByHueRamps(vectors)
    },
    'oklch'
  )
}

export function rampf(colors: string[]) {
  return methodRunner(
    colors,
    function (this: ColorHelper, vectors: Vector3[]) {
      return sortByMomentumMimicry(vectors)
    },
    'oklch'
  )
}

export function rampg(colors: string[], threshold: number, zone: number, rotation: number, order: 'vivid' | 'muted') {
  return methodRunner(
    colors,
    function (this: ColorHelper, vectors: Vector3[]) {
      return sortColorsByHueRamps2(vectors, threshold, zone, rotation, order)
    },
    'oklch'
  )
}

rampg.params = [
  { name: 'threshold', values: [0, 0.01, 0.03, 0.06, 0.09] },
  { name: 'zone', values: [20, 40, 60, 90, 120] },
  { name: 'rotation', values: [270, 0] },
  { name: 'order', values: ['vivid', 'muted'] }
]

export function ramph(colors: string[], ramps: number = 3) {
  return methodRunner(
    colors,
    function (this: ColorHelper, vectors: Vector3[]) {
      return sortMultiRampPalette2(vectors, ramps)
    },
    'oklch'
  )
}

ramph.params = [{ name: 'ramps', values: [2, 3, 4, 5, 6, 8, 8, 9, 12, 24] }]

ramph.valid = (colors: Vector3[], ramps: number) => {
  return colors.length > ramps
}

export function rampi(colors: string[]) {
  return methodRunner(
    colors,
    function (this: ColorHelper, vectors: Vector3[]) {
      const ramps = Math.min(vectors.length, estimateNumRamps(vectors).suggestedK)

      return sortMultiRampPalette2(vectors, ramps)
    },
    'oklch'
  )
}
