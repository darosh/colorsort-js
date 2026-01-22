export function variance(arr: number[]) {
  const m = mean(arr)
  return mean(arr.map((x) => (x - m) ** 2))
}

export function mean(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

export function energy(magnitudes: number[]) {
  return magnitudes.reduce((sum, m) => sum + m * m, 0)
}

export function highFreqRatio(magnitudes: number[]) {
  const cutoff = Math.floor(magnitudes.length * 0.4)
  const highFreqEnergy = magnitudes.slice(cutoff).reduce((sum, m) => sum + m * m, 0)
  const totalEnergy = energy(magnitudes)
  return totalEnergy > 0 ? highFreqEnergy / totalEnergy : 0
}

export function round2(x: number) {
  return Math.round((x || 0) * 100) / 100
}

export function round3(x: number) {
  return Math.round((x || 0) * 1000) / 1000
}

export function round4(x: number) {
  return Math.round((x || 0) * 10000) / 10000
}

/**
 * Interpolate NaN values in a signal using surrounding valid values
 * This prevents false discontinuities in FFT when achromatic colors produce NaN
 */
export function interpolateNaNs(signal: number[]): number[] {
  const result = [...signal]

  for (let i = 0; i < result.length; i++) {
    if (!isFinite(result[i])) {
      // Find previous valid value
      let prevIdx = i - 1
      while (prevIdx >= 0 && !isFinite(result[prevIdx])) {
        prevIdx--
      }

      // Find next valid value
      let nextIdx = i + 1
      while (nextIdx < result.length && !isFinite(result[nextIdx])) {
        nextIdx++
      }

      // Interpolate
      if (prevIdx >= 0 && nextIdx < result.length) {
        // Both neighbors exist - linear interpolation
        const prevVal = result[prevIdx]
        const nextVal = result[nextIdx]
        const span = nextIdx - prevIdx
        const offset = i - prevIdx
        result[i] = prevVal + (nextVal - prevVal) * (offset / span)
      } else if (prevIdx >= 0) {
        // Only previous exists - use it
        result[i] = result[prevIdx]
      } else if (nextIdx < result.length) {
        // Only next exists - use it
        result[i] = result[nextIdx]
      } else {
        // No valid values at all - use 0
        result[i] = 0
      }
    }
  }

  return result
}
