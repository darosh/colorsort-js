import { calculateVariances, MetricsVariances } from './metrics-variances.ts'
import { lch } from './color.ts'

export type PaletteType = {
  Kl: number
  Kc: number
  Kh: number
  type: string
  data: MetricsVariances & {
    lightnessRange: number
    chromaRange: number
    hueSpread: number
  }
}

export function detectPaletteType(colors: string[]): PaletteType {
  const variances = calculateVariances(colors)

  // Also get the actual ranges for context
  // const labColors = colors.map((color) => chroma(color).lab())
  // const lchColors = labColors.map((lab) => chroma.lab(lab).lch())
  const lchColors = colors.map((c) => lch(c))

  const lightnesses = lchColors.map(([L]) => L)
  const chromas = lchColors.map(([, C]) => C)
  const hues = lchColors.map(([, , H]) => H)

  const lightnessRange = Math.max(...lightnesses) - Math.min(...lightnesses)
  const chromaRange = Math.max(...chromas) - Math.min(...chromas)
  const hueSpread = calculateHueSpread(hues.filter((h) => !Number.isNaN(h)))

  // High variance/range = palette explores this dimension
  // Low variance/range = palette is uniform in this dimension

  const data = {
    ...variances,
    lightnessRange,
    chromaRange,
    hueSpread
  }

  // if (hueSpread > 180 && variances.H > 70 && lightnessRange < 80) {
  if (hueSpread > 180 && variances.H > 70 && variances.L < 80) {
    // Rainbow palette - wide hue range, narrow lightness
    // Prioritize hue differences
    return { Kl: 0.5, Kc: 1, Kh: 2, type: 'Rainbow', data }
  }

  if (lightnessRange > 50 && variances.L > 20 && hueSpread < 30) {
    // Monochromatic gradient - wide lightness range, narrow hue
    // Prioritize lightness differences
    return { Kl: 2, Kc: 0.5, Kh: 0.5, type: 'Monochromatic', data }
  }

  if (chromaRange > 50 && variances.C > 15 && hueSpread < 60) {
    // Saturation-focused palette - wide chroma range
    // Prioritize chroma differences
    return { Kl: 0.5, Kc: 2, Kh: 1, type: 'Wide Chroma', data }
  }

  if (variances.H < 15 && variances.L < 15 && variances.C < 15) {
    // Very uniform palette - all dimensions have low variance
    // Slightly emphasize all differences equally
    return { Kl: 1.2, Kc: 1.2, Kh: 1.2, type: 'Uniform', data }
  }

  // Balanced palette - use standard weights
  return { Kl: 1, Kc: 1, Kh: 1, type: 'Balanced', data }
}

// Helper: Calculate hue spread (accounting for circularity)
function calculateHueSpread(hues: number[]) {
  if (hues.length === 0) {
    return 0
  }

  // Sort hues
  const sorted = [...hues].sort((a, b) => a - b)

  // Find largest gap between consecutive hues
  let maxGap = 0
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = sorted[i + 1] - sorted[i]
    maxGap = Math.max(maxGap, gap)
  }

  // Check wrap-around gap
  const wrapGap = 360 - (sorted[sorted.length - 1] - sorted[0])
  maxGap = Math.max(maxGap, wrapGap)

  // Spread is 360 minus the largest gap
  return 360 - maxGap
}
