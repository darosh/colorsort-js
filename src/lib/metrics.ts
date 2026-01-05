import { distance, dot, normalize, subtract, Vector3 } from './vector.ts'
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

export type MetricsLch<T> = { L: T; C: T; H: T }

export type MetricsEx<T> = {
  totalDistance: T
  avgAngleChange: T
  maxAngleChange: T
  meanDistance: T
  devDistance: T
  totalCurveDistance: T
  meanCurveDistance: T
  devCurveDistance: T
  lchAvgChange: MetricsLch<T>
  lchMaxChange: MetricsLch<T>
  lchDeviation: MetricsLch<T>
  perceptualUniformity: T
  curveUniformity: T
  hueSpread: T
  chromaRange: T
  lightnessRange: T
  harmonicScore: T
  harmonicCurveScore: T
}

export function metricsEx(colors: string[]): MetricsEx<number> {
  const vectors = colors.map((c) => oklab(c))
  const lchColors = colors.map((c) => chroma(c).lch())

  if (vectors.length < 2) {
    return {
      totalDistance: 0,
      avgAngleChange: 0,
      maxAngleChange: 0,
      meanDistance: 0,
      devDistance: 0,
      totalCurveDistance: 0,
      meanCurveDistance: 0,
      devCurveDistance: 0,
      lchAvgChange: { L: 0, C: 0, H: 0 },
      lchMaxChange: { L: 0, C: 0, H: 0 },
      lchDeviation: { L: 0, C: 0, H: 0 },
      perceptualUniformity: 0,
      curveUniformity: 0,
      hueSpread: 0,
      chromaRange: 0,
      lightnessRange: 0,
      harmonicScore: 0,
      harmonicCurveScore: 0
    }
  }

  let totalDistance = 0
  let totalCurveDistance = 0
  let angleChanges = []
  let prevDirection = null
  const distances = []
  const curveDistances = []

  // Extend endpoints for Catmull-Rom (duplicate first/last points)
  const extendedVectors = [vectors[0], ...vectors, vectors[vectors.length - 1]]

  // LCH component changes
  const lChanges = []
  const cChanges = []
  const hChanges = []

  for (let i = 1; i < vectors.length; i++) {
    const dist = distance(vectors[i - 1], vectors[i])
    totalDistance += dist
    distances.push(dist)

    const curveDist = curveLengthBetween(extendedVectors[i - 1], extendedVectors[i], extendedVectors[i + 1], extendedVectors[i + 2])
    totalCurveDistance += curveDist
    curveDistances.push(curveDist)

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

  const meanCurveDistance = totalCurveDistance / (vectors.length - 1)

  const devCurveDistance = Math.sqrt(curveDistances.reduce((acc, d) => acc + Math.pow(d - meanCurveDistance, 2), 0) / (vectors.length - 1))

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
  const curveUniformity = 1 / (1 + devCurveDistance)

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
  const harmonicCurveScore = curveUniformity * 0.4 + Math.min(hueSpread / 180, 1) * 0.3 + (1 / (1 + lchDeviation.H / 45)) * 0.3

  return {
    totalDistance,
    avgAngleChange,
    maxAngleChange,
    meanDistance,
    devDistance,
    totalCurveDistance,
    meanCurveDistance,
    devCurveDistance,
    lchAvgChange,
    lchMaxChange,
    lchDeviation,
    perceptualUniformity,
    curveUniformity,
    hueSpread,
    chromaRange,
    lightnessRange,
    harmonicScore,
    harmonicCurveScore
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

function catmullRom(p0: number[], p1: number[], p2: number[], p3: number[], t: number): number[] {
  const t2 = t * t
  const t3 = t2 * t

  return [
    0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),

    0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),

    0.5 * (2 * p1[2] + (-p0[2] + p2[2]) * t + (2 * p0[2] - 5 * p1[2] + 4 * p2[2] - p3[2]) * t2 + (-p0[2] + 3 * p1[2] - 3 * p2[2] + p3[2]) * t3)
  ]
}

// Calculate curve length between two points using sampling
function curveLengthBetween(p0: Vector3, p1: Vector3, p2: Vector3, p3: Vector3, samples = 12): number {
  let length = 0
  let prevPoint = p1

  for (let i = 1; i <= samples; i++) {
    const t = i / samples
    const point = <Vector3>catmullRom(p0, p1, p2, p3, t)
    length += distance(prevPoint, point)
    prevPoint = point
  }

  return length
}

const asc = (a: number, b: number) => a - b
const dsc = (a: number, b: number) => b - a

export function getMetricsExRange(list: MetricsEx<number>[]): MetricsEx<[number, number]> {
  const range: MetricsEx<number[]> = {
    totalDistance: [],
    avgAngleChange: [],
    maxAngleChange: [],
    meanDistance: [],
    devDistance: [],
    totalCurveDistance: [],
    meanCurveDistance: [],
    devCurveDistance: [],
    lchAvgChange: { L: [], C: [], H: [] },
    lchMaxChange: { L: [], C: [], H: [] },
    lchDeviation: { L: [], C: [], H: [] },
    perceptualUniformity: [],
    curveUniformity: [],
    hueSpread: [],
    chromaRange: [],
    lightnessRange: [],
    harmonicScore: [],
    harmonicCurveScore: []
  }

  for (const i of list) {
    range.totalDistance.push(i.totalDistance)
    range.avgAngleChange.push(i.avgAngleChange)
    range.maxAngleChange.push(i.maxAngleChange)
    range.meanDistance.push(i.meanDistance)
    range.devDistance.push(i.devDistance)
    range.totalCurveDistance.push(i.totalCurveDistance)
    range.meanCurveDistance.push(i.meanCurveDistance)
    range.devCurveDistance.push(i.devCurveDistance)
    range.lchAvgChange.L.push(i.lchAvgChange.L)
    range.lchAvgChange.C.push(i.lchAvgChange.C)
    range.lchAvgChange.H.push(i.lchAvgChange.H)
    range.lchMaxChange.L.push(i.lchMaxChange.L)
    range.lchMaxChange.C.push(i.lchMaxChange.C)
    range.lchMaxChange.H.push(i.lchMaxChange.H)
    range.lchDeviation.L.push(i.lchDeviation.L)
    range.lchDeviation.C.push(i.lchDeviation.C)
    range.lchDeviation.H.push(i.lchDeviation.H)
    range.perceptualUniformity.push(i.perceptualUniformity)
    range.curveUniformity.push(i.curveUniformity)
    range.hueSpread.push(i.hueSpread)
    range.chromaRange.push(i.chromaRange)
    range.lightnessRange.push(i.lightnessRange)
    range.harmonicScore.push(i.harmonicScore)
    range.harmonicCurveScore.push(i.harmonicCurveScore)
  }

  range.totalDistance.sort(asc)
  range.avgAngleChange.sort(asc)
  range.maxAngleChange.sort(asc)
  range.meanDistance.sort(asc)
  range.devDistance.sort(asc)
  range.totalCurveDistance.sort(asc)
  range.meanCurveDistance.sort(asc)
  range.devCurveDistance.sort(asc)
  range.lchAvgChange.L.sort(asc)
  range.lchAvgChange.C.sort(asc)
  range.lchAvgChange.H.sort(asc)
  range.lchMaxChange.L.sort(asc)
  range.lchMaxChange.C.sort(asc)
  range.lchMaxChange.H.sort(asc)
  range.lchDeviation.L.sort(asc)
  range.lchDeviation.C.sort(asc)
  range.lchDeviation.H.sort(asc)
  range.perceptualUniformity.sort(dsc)
  range.curveUniformity.sort(dsc)
  range.hueSpread.sort(asc)
  range.chromaRange.sort(asc)
  range.lightnessRange.sort(asc)
  range.harmonicScore.sort(dsc)
  range.harmonicCurveScore.sort(dsc)

  return <MetricsEx<[number, number]>>{
    totalDistance: [range.totalDistance[0], <number>range.totalDistance.at(-1)],
    avgAngleChange: [range.avgAngleChange[0], <number>range.avgAngleChange.at(-1)],
    maxAngleChange: [range.maxAngleChange[0], <number>range.maxAngleChange.at(-1)],
    meanDistance: [range.meanDistance[0], <number>range.meanDistance.at(-1)],
    devDistance: [range.devDistance[0], <number>range.devDistance.at(-1)],
    totalCurveDistance: [range.totalCurveDistance[0], <number>range.totalCurveDistance.at(-1)],
    meanCurveDistance: [range.meanCurveDistance[0], <number>range.meanCurveDistance.at(-1)],
    devCurveDistance: [range.devCurveDistance[0], <number>range.devCurveDistance.at(-1)],
    lchAvgChange: {
      L: [range.lchAvgChange.L[0], <number>range.lchAvgChange.L.at(-1)],
      C: [range.lchAvgChange.C[0], <number>range.lchAvgChange.C.at(-1)],
      H: [range.lchAvgChange.H[0], <number>range.lchAvgChange.H.at(-1)]
    },
    lchMaxChange: {
      L: [range.lchMaxChange.L[0], <number>range.lchMaxChange.L.at(-1)],
      C: [range.lchMaxChange.C[0], <number>range.lchMaxChange.C.at(-1)],
      H: [range.lchMaxChange.H[0], <number>range.lchMaxChange.H.at(-1)]
    },
    lchDeviation: {
      L: [range.lchDeviation.L[0], <number>range.lchDeviation.L.at(-1)],
      C: [range.lchDeviation.C[0], <number>range.lchDeviation.C.at(-1)],
      H: [range.lchDeviation.H[0], <number>range.lchDeviation.H.at(-1)]
    },
    perceptualUniformity: [range.perceptualUniformity[0], <number>range.perceptualUniformity.at(-1)],
    curveUniformity: [range.curveUniformity[0], <number>range.curveUniformity.at(-1)],
    hueSpread: [range.hueSpread[0], <number>range.hueSpread.at(-1)],
    chromaRange: [range.chromaRange[0], <number>range.chromaRange.at(-1)],
    lightnessRange: [range.lightnessRange[0], <number>range.lightnessRange.at(-1)],
    harmonicScore: [range.harmonicScore[0], <number>range.harmonicScore.at(-1)],
    harmonicCurveScore: [range.harmonicCurveScore[0], <number>range.harmonicCurveScore.at(-1)]
  }
}

function interpolate(val: number, [min, max]: [number, number]): number {
  if (max === min) {
    return 0
  }
  return Math.max(0, Math.min(1, (val - min) / (max - min)))
}

function interpolateLch(val: MetricsLch<number>, rng: MetricsLch<[number, number]>): MetricsLch<number> {
  return {
    L: interpolate(val.L, rng.L),
    C: interpolate(val.C, rng.C),
    H: interpolate(val.H, rng.H)
  }
}

export function metricsExQuality(value: MetricsEx<number>, range: MetricsEx<[number, number]>): MetricsEx<number> {
  return {
    totalDistance: interpolate(value.totalDistance, range.totalDistance),
    avgAngleChange: interpolate(value.avgAngleChange, range.avgAngleChange),
    maxAngleChange: interpolate(value.maxAngleChange, range.maxAngleChange),
    meanDistance: interpolate(value.meanDistance, range.meanDistance),
    devDistance: interpolate(value.devDistance, range.devDistance),
    totalCurveDistance: interpolate(value.totalCurveDistance, range.totalCurveDistance),
    meanCurveDistance: interpolate(value.meanCurveDistance, range.meanCurveDistance),
    devCurveDistance: interpolate(value.devCurveDistance, range.devCurveDistance),
    lchAvgChange: interpolateLch(value.lchAvgChange, range.lchAvgChange),
    lchMaxChange: interpolateLch(value.lchMaxChange, range.lchMaxChange),
    lchDeviation: interpolateLch(value.lchDeviation, range.lchDeviation),
    perceptualUniformity: interpolate(value.perceptualUniformity, range.perceptualUniformity),
    curveUniformity: interpolate(value.curveUniformity, range.curveUniformity),
    hueSpread: interpolate(value.hueSpread, range.hueSpread),
    chromaRange: interpolate(value.chromaRange, range.chromaRange),
    lightnessRange: interpolate(value.lightnessRange, range.lightnessRange),
    harmonicScore: interpolate(value.harmonicScore, range.harmonicScore),
    harmonicCurveScore: interpolate(value.harmonicCurveScore, range.harmonicCurveScore)
  }
}
