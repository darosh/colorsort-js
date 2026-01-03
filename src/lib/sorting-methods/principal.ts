import { colorVectors, dot, normalize, subtract, Vector3 } from '../vector.ts'

function mean(vectors: Vector3[]): Vector3 {
  const sum = vectors.reduce((acc, v) => [acc[0] + v[0], acc[1] + v[1], acc[2] + v[2]], [0, 0, 0] as Vector3)
  return [sum[0] / vectors.length, sum[1] / vectors.length, sum[2] / vectors.length]
}

function covariance(vectors: Vector3[], meanVec: Vector3): number[][] {
  const n = vectors.length
  const cov = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ]

  for (const v of vectors) {
    const diff = subtract(v, meanVec)
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        cov[i][j] += (diff[i] * diff[j]) / n
      }
    }
  }

  return cov
}

// Simple power iteration for largest eigenvector
function principalComponent(cov: number[][]): Vector3 {
  let v: Vector3 = [1, 1, 1]

  for (let iter = 0; iter < 100; iter++) {
    const newV: Vector3 = [cov[0][0] * v[0] + cov[0][1] * v[1] + cov[0][2] * v[2], cov[1][0] * v[0] + cov[1][1] * v[1] + cov[1][2] * v[2], cov[2][0] * v[0] + cov[2][1] * v[1] + cov[2][2] * v[2]]
    v = normalize(newV)
  }

  return v
}

export function sortByPrincipalComponent(colors: Vector3[]): Vector3[] {
  if (colors.length === 0) {
    return []
  }

  const meanVec = mean(colors)
  const cov = covariance(colors, meanVec)
  const pc = principalComponent(cov)

  // Sort by projection onto principal component
  return [...colors].sort((a, b) => {
    const projA = dot(subtract(a, meanVec), pc)
    const projB = dot(subtract(b, meanVec), pc)
    return projA - projB
  })
}

export function principalRgb(colors: string[]) {
  return colorVectors(colors, sortByPrincipalComponent, 'gl')
}

export function principalLab(colors: string[]) {
  return colorVectors(colors, sortByPrincipalComponent, 'lab')
}

export function principalOklab(colors: string[]) {
  return colorVectors(colors, sortByPrincipalComponent, 'oklab')
}
