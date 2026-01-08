import { ColorHelper, colorVectors, dot, normalize, subtract, tspVectors, Vector3 } from '../vector.ts'
import { oklab } from '../color.ts'

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

function oklabStats(labs: Vector3[]) {
  const n = labs.length
  const mean = labs.reduce((acc, l) => [acc[0] + l[0], acc[1] + l[1], acc[2] + l[2]], [0, 0, 0]).map((v) => v / n)
  const variance = labs.reduce((acc, l) => [acc[0] + (l[0] - mean[0]) ** 2, acc[1] + (l[1] - mean[1]) ** 2, acc[2] + (l[2] - mean[2]) ** 2], [0, 0, 0])

  return variance.map((v) => Math.sqrt(v / n) || 1e-6)
}

function adaptiveOklabDistanceFactory(colors: Vector3[]) {
  const WHAT_A_SIGMA = oklabStats(colors)

  return (A: Vector3, B: Vector3) => {
    return Math.hypot((A[0] - B[0]) / WHAT_A_SIGMA[0], (A[1] - B[1]) / WHAT_A_SIGMA[1], (A[2] - B[2]) / WHAT_A_SIGMA[2])
  }
}

export function principal(colors: string[], model: 'gl' | 'lab' | 'oklab', post: 'raw' | 'tsp' | 'tsp-adapt' = 'raw') {
  return colorVectors(
    colors,
    function (this: ColorHelper, data: Vector3[]) {
      const vec = sortByPrincipalComponent(data)

      if (post === 'raw') {
        return vec
      }

      let distance = this.distance
      let toColor = this.toColor

      if (post === 'tsp-adapt') {
        if (model === 'oklab') {
          distance = adaptiveOklabDistanceFactory(data)
        } else {
          const oklabs = colors.map((c) => oklab(c))
          const okdist = adaptiveOklabDistanceFactory(oklabs)
          distance = (a, b) => okdist(oklab(toColor(a)), oklab(toColor(b)))
        }
      }

      return tspVectors(vec, distance)
    },
    model
  )
}

principal.params = [
  { name: 'model', values: ['gl', 'lab', 'oklab'] },
  { name: 'post', values: ['raw', 'tsp', 'tsp-adapt'] }
]
