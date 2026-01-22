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
