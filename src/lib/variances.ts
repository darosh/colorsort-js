import chroma from 'chroma-js'

export type Variances = {
  L: number
  C: number
  H: number
  meanC: number
  meanH: number
}

export function calculateVariances(colors: string[]): Variances {
  // Convert all colors to LAB color space
  // Assuming colors are in a format you can convert (RGB, hex, etc.)
  const labColors = colors.map((color) => chroma(color).lab())

  // Calculate means
  const meanL = labColors.reduce((sum, [L]) => sum + L, 0) / labColors.length
  // const meanA = labColors.reduce((sum, c) => sum + c.a, 0) / labColors.length;
  // const meanB = labColors.reduce((sum, c) => sum + c.b, 0) / labColors.length;

  // Convert to LCH to get chroma and hue
  const lchColors = labColors.map((lab) => chroma.lab(...lab).lch())

  const meanC = lchColors.reduce((sum, [, C]) => sum + C, 0) / lchColors.length

  // Hue is circular, so we need circular mean
  const meanH = circularMean(lchColors.map(([, , H]) => H).filter((a) => !Number.isNaN(a)))

  // Calculate variances
  const varianceL = labColors.reduce((sum, [L]) => sum + Math.pow(L - meanL, 2), 0) / labColors.length

  const varianceC = lchColors.reduce((sum, [, C]) => sum + Math.pow(C - meanC, 2), 0) / lchColors.length

  // Circular variance for hue
  const varianceH = circularVariance(
    lchColors.map(([, , H]) => H).filter((a) => !Number.isNaN(a)),
    meanH
  )

  return {
    L: Math.sqrt(varianceL),
    C: Math.sqrt(varianceC),
    H: Math.sqrt(varianceH),
    meanC,
    meanH
  }
}

// Helper: Circular mean for hue angles
function circularMean(angles: number[]) {
  if (angles.length === 0) {
    return 0
  }

  const rad = angles.filter((a) => !Number.isNaN(a)).map((a) => (a * Math.PI) / 180)
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
