import { nonH } from './color.ts'
import { Vector3 } from './vector.ts'

export type TypeVariances = {
  L: number
  C: number
  H: number
  meanL: number
  meanC: number
  meanH: number
}

export function calculateVariances(lchColors: Vector3[]): TypeVariances {
  // const lchColors = colors.map((c) => lch(c))

  // Calculate means
  // const meanA = labColors.reduce((sum, c) => sum + c.a, 0) / labColors.length;
  // const meanB = labColors.reduce((sum, c) => sum + c.b, 0) / labColors.length;

  // Convert to LCH to get chroma and hue
  const meanL = lchColors.reduce((sum, [L]) => sum + L, 0) / lchColors.length

  const meanC = lchColors.reduce((sum, [, C]) => sum + C, 0) / lchColors.length

  // Hue is circular, so we need circular mean
  const meanH = circularMean(lchColors.map(([, , H]) => H).filter((a) => !nonH(a)))

  // Calculate variances
  const varianceL = lchColors.reduce((sum, [L]) => sum + Math.pow(L - meanL, 2), 0) / lchColors.length

  const varianceC = lchColors.reduce((sum, [, C]) => sum + Math.pow(C - meanC, 2), 0) / lchColors.length

  // Circular variance for hue
  const varianceH = circularVariance(
    lchColors.map(([, , H]) => H).filter((a) => !nonH(a)),
    meanH
  )

  return {
    L: Math.sqrt(varianceL),
    C: Math.sqrt(varianceC),
    H: Math.sqrt(varianceH),
    meanL,
    meanC,
    meanH
  }
}

// Helper: Circular mean for hue angles
function circularMean(angles: number[]) {
  if (angles.length === 0) {
    return 0
  }

  const rad = angles.filter((a) => !nonH(a)).map((a) => (a * Math.PI) / 180)
  const sinSum = rad.reduce((sum, a) => sum + Math.sin(a), 0)
  const cosSum = rad.reduce((sum, a) => sum + Math.cos(a), 0)

  let mean = Math.atan2(sinSum / angles.length, cosSum / angles.length) * (180 / Math.PI)

  if (mean < 0) {
    mean += 360
  }

  return mean
}

// Helper: Circular variance for hue
function circularVariance(angles: number[], mean: number) {
  if (angles.length === 0) {
    return 0
  }

  const diffs = angles.map((angle) => {
    let diff = angle - mean
    // Handle wrap-around (e.g., 350° and 10° are only 20° apart)
    if (diff > 180) {
      diff -= 360
    }
    if (diff < -180) {
      diff += 360
    }
    return diff * diff
  })

  return diffs.reduce((sum, d) => sum + d, 0) / angles.length
}

export function calculateAdaptiveWeights(variances: { L: number; C: number; H: number }) {
  const total = Math.max(Number.EPSILON, variances.L + variances.C + (variances.H ?? 0))

  return {
    Kl: (total - variances.L) / (2 * total),
    Kc: (total - variances.C) / (2 * total),
    Kh: (total - variances.H) / (2 * total)
  }
}
