import { Vector3 } from './vector.ts'
import { oklch2oklab } from './color.ts'

export function snapInterpolator(values: number[], samples: number) {
  const step = (values.length - 1) / (samples - 1)

  // sample is 0 to (samples - 1)
  return (sample: number) => {
    const pos = sample * step
    const idx1 = Math.floor(pos)
    const idx2 = Math.min(idx1 + 1, values.length - 1)
    const frac = pos - idx1
    const snap = Math.floor((sample + 1) * step) > idx1 && (sample + 1) * step !== idx2

    if (snap) {
      return values[idx2]
    }

    {
      const s = sample - 1
      const pos = s * step
      const idx1 = Math.floor(pos)
      const idx2 = Math.min(idx1 + 1, values.length - 1)
      const snap = Math.floor((s + 1) * step) > idx1 && (s + 1) * step !== idx2

      if (snap) {
        return values[idx2]
      }
    }

    return values[idx1] * (1 - frac) + values[idx2] * frac
  }
}

export function resamplePalette(colors: Vector3[], samples: number = 256): Vector3[] {
  if (colors.length < 2) {
    return colors
  }

  const result: Vector3[] = []
  const labs = colors.map(oklch2oklab)

  const iL = snapInterpolator(
    labs.map((c) => c[0]),
    samples
  )
  const ia = snapInterpolator(
    labs.map((c) => c[1]),
    samples
  )
  const ib = snapInterpolator(
    labs.map((c) => c[2]),
    samples
  )

  for (let i = 0; i < samples; i++) {
    const interpolated: Vector3 = [iL(i), ia(i), ib(i)]

    // Convert back to Oklch for storage
    const L = interpolated[0]
    const C = Math.sqrt(interpolated[1] ** 2 + interpolated[2] ** 2)
    const H = ((Math.atan2(interpolated[2], interpolated[1]) * 180) / Math.PI + 360) % 360

    result.push([L, C, H])
  }

  return result
}

export function downsamplePalette(colors: Vector3[], targetSize: number): Vector3[] {
  if (colors.length === targetSize) {
    return colors
  }

  const result: Vector3[] = []
  const n = colors.length
  const step = (n - 1) / (targetSize - 1)

  for (let i = 0; i < targetSize; i++) {
    const pos = i * step
    const idx1 = Math.floor(pos)
    const idx2 = Math.min(idx1 + 1, n - 1)
    const frac = pos - idx1

    const lab1 = oklch2oklab(colors[idx1])
    const lab2 = oklch2oklab(colors[idx2])

    const lab: [number, number, number] = [lab1[0] * (1 - frac) + lab2[0] * frac, lab1[1] * (1 - frac) + lab2[1] * frac, lab1[2] * (1 - frac) + lab2[2] * frac]

    const L = lab[0]
    const a = lab[1]
    const b = lab[2]
    const C = Math.sqrt(a * a + b * b)
    const H = ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360

    result.push([L, C, H])
  }

  return result
}
