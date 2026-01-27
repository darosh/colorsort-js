export function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))

  if (magA === 0 || magB === 0) {
    return 0
  }
  return dotProduct / (magA * magB)
}

export function manhattanDistance(fp1: number[], fp2: number[]) {
  return fp1.reduce((sum, val, i) => sum + Math.abs(val - fp2[i]), 0)
}

export function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0))
}

export function gaussianSimilarity(a: number, b: number, sigma: number): number {
  // Gaussian kernel: exp(-distance^2 / (2 * sigma^2))
  // Returns 1 when values are identical, decreases smoothly as they differ
  const distance = Math.abs(a - b)
  return Math.exp(-(distance * distance) / (2 * sigma * sigma))
}

export function pearsonCorrelation(a: number[], b: number[]): number {
  const n = a.length
  if (n !== b.length || n === 0) {
    return 0
  }

  const meanA = a.reduce((sum, x) => sum + x, 0) / n
  const meanB = b.reduce((sum, x) => sum + x, 0) / n

  let numerator = 0
  let sumSqA = 0
  let sumSqB = 0

  for (let i = 0; i < n; i++) {
    const diffA = a[i] - meanA
    const diffB = b[i] - meanB
    numerator += diffA * diffB
    sumSqA += diffA * diffA
    sumSqB += diffB * diffB
  }

  const denominator = Math.sqrt(sumSqA * sumSqB)
  if (denominator === 0) {
    return 0
  }

  // Pearson returns -1 to 1, convert to 0 to 1
  return (numerator / denominator + 1) / 2
}

export function fingerprintAverage(fingerprints: number[][]): number[] {
  return fingerprints.reduce((acc, f) => acc.map((v, i) => v + f[i]), <number[]>Array.from({ length: fingerprints[0].length }).fill(0)).map((x) => x / fingerprints.length)
}

export function fingerprintMedian(fingerprints: number[][]): number[] {
  if (fingerprints.length === 0) {
    return []
  }

  const length = fingerprints[0].length
  const result: number[] = []

  for (let i = 0; i < length; i++) {
    const values = fingerprints.map((fp) => fp[i]).sort((a, b) => a - b)
    const mid = Math.floor(values.length / 2)
    result[i] = values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid]
  }

  return result
}

export function fingerprintAverageWithoutOutliers(fingerprints: number[][]): number[] {
  if (fingerprints.length === 0) {
    return []
  }

  if (fingerprints.length === 1) {
    return fingerprints[0]
  }

  // First, calculate distance of each fingerprint from the median
  const median = fingerprintMedian(fingerprints)
  const distances = fingerprints.map((fp) => Math.sqrt(fp.reduce((sum, val, i) => sum + Math.pow(val - median[i], 2), 0)))

  // Calculate IQR for distances
  const sortedDistances = [...distances].sort((a, b) => a - b)
  const q1 = sortedDistances[Math.floor(sortedDistances.length * 0.25)]
  const q3 = sortedDistances[Math.floor(sortedDistances.length * 0.75)]
  const iqr = q3 - q1
  const threshold = q3 + 1.5 * iqr

  // Filter out outliers
  const filtered = fingerprints.filter((_, i) => distances[i] <= threshold)

  if (!filtered.length) {
    return fingerprintAverage(fingerprints)
  }

  // Return average of remaining
  return fingerprintAverage(filtered)
}

export function fingerprintAverageMAD(fingerprints: number[][], madThreshold = 3): number[] {
  if (fingerprints.length === 0) {
    return []
  }

  const median = fingerprintMedian(fingerprints)

  // Calculate MAD
  const deviations = fingerprints.map((fp) => Math.sqrt(fp.reduce((sum, val, i) => sum + Math.pow(val - median[i], 2), 0)))

  const medianDeviation = [...deviations].sort((a, b) => a - b)[Math.floor(deviations.length / 2)]
  const mad = medianDeviation * 1.4826 // scale factor for normal distribution

  // Filter fingerprints within threshold
  const filtered = fingerprints.filter((_, i) => deviations[i] <= mad * madThreshold)

  return fingerprintAverage(filtered.length ? filtered : fingerprints)
}

export function fingerprintAveragePercentile(fingerprints: number[][], keepPercentile = 0.8): number[] {
  if (fingerprints.length === 0) {
    return []
  }

  const median = fingerprintMedian(fingerprints)

  // Calculate distance from median for each fingerprint
  const withDistances = fingerprints.map((fp) => ({
    fp,
    distance: Math.sqrt(fp.reduce((sum, val, i) => sum + Math.pow(val - median[i], 2), 0))
  }))

  // Sort by distance and keep closest X%
  withDistances.sort((a, b) => a.distance - b.distance)
  const keepCount = Math.ceil(withDistances.length * keepPercentile)
  const filtered = withDistances.slice(0, keepCount).map((x) => x.fp)

  return fingerprintAverage(filtered.length ? filtered : fingerprints)
}
