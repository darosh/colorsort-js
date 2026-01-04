import { distance, dot, normalize, subtract } from './vector.ts'
import { oklab } from './oklab.js'
import chroma from 'chroma-js'

export function metrics(colors: string[]) {
  const vectors = colors.map((c) => oklab(c))

  if (vectors.length < 2) {
    return { totalDistance: 0, avgAngleChange: 0, maxAngleChange: 0, meanDistance: 0, devDistance: 0 }
  }

  let totalDistance = 0
  let angleChanges = []
  let prevDirection = null

  const distances = []

  for (let i = 1; i < vectors.length; i++) {
    const dist = distance(vectors[i - 1], vectors[i])
    totalDistance += dist
    distances.push(dist)

    const direction = normalize(subtract(vectors[i], vectors[i - 1]))

    if (prevDirection && dist > 0) {
      const dotProd = Math.max(-1, Math.min(1, dot(prevDirection, direction)))
      const angle = Math.acos(dotProd) * (180 / Math.PI)
      angleChanges.push(angle)
    }

    prevDirection = direction
  }

  const meanDistance = totalDistance / (vectors.length - 1)

  const devDistance = Math.sqrt(distances.reduce((acc, d) => acc + Math.pow(d - meanDistance, 2), 0) / (vectors.length - 1))

  const avgAngleChange = angleChanges.length > 0 ? angleChanges.reduce((a, b) => a + b, 0) / angleChanges.length : 0

  const maxAngleChange = angleChanges.length > 0 ? Math.max(...angleChanges) : 0

  return { totalDistance, avgAngleChange, maxAngleChange, meanDistance, devDistance }
}

export function metricsEx(colors: string[]) {
  const vectors = colors.map((c) => oklab(c))
  const lchColors = colors.map((c) => chroma(c).lch())

  if (vectors.length < 2) {
    return {
      totalDistance: 0,
      avgAngleChange: 0,
      maxAngleChange: 0,
      meanDistance: 0,
      devDistance: 0,
      lchAvgChange: { L: 0, C: 0, H: 0 },
      lchMaxChange: { L: 0, C: 0, H: 0 },
      lchDeviation: { L: 0, C: 0, H: 0 },
      perceptualUniformity: 0,
      hueSpread: 0,
      chromaRange: 0,
      lightnessRange: 0,
      harmonicScore: 0
    }
  }

  let totalDistance = 0
  let angleChanges = []
  let prevDirection = null
  const distances = []

  // LCH component changes
  const lChanges = []
  const cChanges = []
  const hChanges = []

  for (let i = 1; i < vectors.length; i++) {
    const dist = distance(vectors[i - 1], vectors[i])
    totalDistance += dist
    distances.push(dist)

    const direction = normalize(subtract(vectors[i], vectors[i - 1]))

    if (prevDirection && dist > 0) {
      const dotProd = Math.max(-1, Math.min(1, dot(prevDirection, direction)))
      const angle = Math.acos(dotProd) * (180 / Math.PI)
      angleChanges.push(angle)
    }

    prevDirection = direction

    // LCH changes
    const [L1, C1, H1] = lchColors[i - 1]
    const [L2, C2, H2] = lchColors[i]

    lChanges.push(Math.abs(L2 - L1))
    cChanges.push(Math.abs(C2 - C1))

    // Handle hue wraparound (circular 0-360) and NaN for achromatic colors
    if (!isNaN(H1) && !isNaN(H2)) {
      let hDiff = Math.abs(H2 - H1)
      if (hDiff > 180) {
        hDiff = 360 - hDiff
      }
      hChanges.push(hDiff)
    } else if (isNaN(H1) && isNaN(H2)) {
      // Both achromatic - no hue change
      hChanges.push(0)
    } else {
      // One is achromatic, one is chromatic - this is a significant change
      // You could either skip it or treat it as a large change
      // Option 1: Skip (don't push anything)
      // Option 2: Push a penalty value
      hChanges.push(90) // Moderate penalty, or use 180 for max penalty
    }
  }

  const meanDistance = totalDistance / (vectors.length - 1)
  const devDistance = Math.sqrt(distances.reduce((acc, d) => acc + Math.pow(d - meanDistance, 2), 0) / (vectors.length - 1))

  const avgAngleChange = angleChanges.length > 0 ? angleChanges.reduce((a, b) => a + b, 0) / angleChanges.length : 0

  const maxAngleChange = angleChanges.length > 0 ? Math.max(...angleChanges) : 0

  // LCH metrics
  const lchAvgChange = {
    L: lChanges.reduce((a, b) => a + b, 0) / lChanges.length,
    C: cChanges.reduce((a, b) => a + b, 0) / cChanges.length,
    H: hChanges.reduce((a, b) => a + b, 0) / hChanges.length
  }

  const lchMaxChange = {
    L: Math.max(...lChanges),
    C: Math.max(...cChanges),
    H: Math.max(...hChanges)
  }

  // Standard deviation for each LCH component
  const lMean = lchAvgChange.L
  const cMean = lchAvgChange.C
  const hMean = lchAvgChange.H

  const lchDeviation = {
    L: Math.sqrt(lChanges.reduce((acc, d) => acc + Math.pow(d - lMean, 2), 0) / lChanges.length),
    C: Math.sqrt(cChanges.reduce((acc, d) => acc + Math.pow(d - cMean, 2), 0) / cChanges.length),
    H: Math.sqrt(hChanges.reduce((acc, d) => acc + Math.pow(d - hMean, 2), 0) / hChanges.length)
  }

  // Perceptual uniformity: lower deviation from mean distance = more uniform
  const perceptualUniformity = 1 / (1 + devDistance)

  // Hue spread: how well distributed are hues across the color wheel
  const hues = lchColors.map(([, , h]) => h).filter((h) => !isNaN(h))
  const hueSpread = hues.length > 1 ? calculateHueSpread(hues) : 0

  // Chroma and lightness range
  const chromas = lchColors.map(([, c]) => c)
  const lightnesses = lchColors.map(([l]) => l)

  const chromaRange = Math.max(...chromas) - Math.min(...chromas)
  const lightnessRange = Math.max(...lightnesses) - Math.min(...lightnesses)

  // Harmonic score: combines uniform spacing with good hue distribution
  const harmonicScore = perceptualUniformity * 0.4 + Math.min(hueSpread / 180, 1) * 0.3 + (1 / (1 + lchDeviation.H / 45)) * 0.3

  return {
    totalDistance,
    avgAngleChange,
    maxAngleChange,
    meanDistance,
    devDistance,
    lchAvgChange,
    lchMaxChange,
    lchDeviation,
    perceptualUniformity,
    hueSpread,
    chromaRange,
    lightnessRange,
    harmonicScore
  }
}

function calculateHueSpread(hues: number[]): number {
  if (hues.length < 2) {
    return 0
  }

  // Sort hues and calculate gaps
  const sorted = [...hues] //.sort((a, b) => a - b)
  const gaps = []

  for (let i = 1; i < sorted.length; i++) {
    gaps.push(sorted[i] - sorted[i - 1])
  }
  // Add wraparound gap
  gaps.push(360 - sorted[sorted.length - 1] + sorted[0])

  // Return the average gap (ideal spread = 360 / n colors)
  return gaps.reduce((a, b) => a + b, 0) / gaps.length
}
