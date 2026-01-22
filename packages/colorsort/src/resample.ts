import { Vector3 } from './vector.ts'

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

export function resamplePaletteSnap(labColors: Vector3[], samples: number = 256): Vector3[] {
  if (labColors.length < 2) {
    return labColors
  }

  const result: Vector3[] = []

  const iL = snapInterpolator(
    labColors.map((c) => c[0]),
    samples
  )
  const ia = snapInterpolator(
    labColors.map((c) => c[1]),
    samples
  )
  const ib = snapInterpolator(
    labColors.map((c) => c[2]),
    samples
  )

  for (let i = 0; i < samples; i++) {
    result.push([iL(i), ia(i), ib(i)])
  }

  return result
}

export function downsamplePalette(labColors: Vector3[], targetSize: number): Vector3[] {
  if (labColors.length === targetSize) {
    return labColors
  }

  const result: Vector3[] = []
  const n = labColors.length
  const step = (n - 1) / (targetSize - 1)

  for (let i = 0; i < targetSize; i++) {
    const pos = i * step
    const idx1 = Math.floor(pos)
    const idx2 = Math.min(idx1 + 1, n - 1)
    const frac = pos - idx1

    const lab1 = labColors[idx1]
    const lab2 = labColors[idx2]

    result.push([lab1[0] * (1 - frac) + lab2[0] * frac, lab1[1] * (1 - frac) + lab2[1] * frac, lab1[2] * (1 - frac) + lab2[2] * frac])
  }

  return result
}

export function resamplePaletteLinear(labColors: Vector3[], samples: number = 256): Vector3[] {
  if (labColors.length < 2) {
    return labColors
  }

  const result: Vector3[] = []
  const step = (labColors.length - 1) / (samples - 1)

  for (let i = 0; i < samples; i++) {
    const pos = i * step
    const idx1 = Math.floor(pos)
    const idx2 = Math.min(idx1 + 1, labColors.length - 1)
    const frac = pos - idx1

    // Interpolate in Oklab space (no hue wraparound issues!)
    const lab1 = labColors[idx1]
    const lab2 = labColors[idx2]

    result.push([
      lab1[0] * (1 - frac) + lab2[0] * frac, // L
      lab1[1] * (1 - frac) + lab2[1] * frac, // a
      lab1[2] * (1 - frac) + lab2[2] * frac // b
    ])
  }

  return result
}
