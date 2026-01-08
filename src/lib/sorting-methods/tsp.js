import chroma from 'chroma-js'
import { graphDeltaE } from './graph-delta-e.js'
import { oklab } from '../color.ts'
import { principalOklab } from '@/lib/sorting-methods/principal.ts'

function deltaE(a, b) {
  return chroma.deltaE(a, b)
}

export function tsp(colors, distance = deltaE) {
  let improved = true

  while (improved) {
    improved = false

    for (let i = 0; i < colors.length - 2; i++) {
      for (let j = i + 1; j < colors.length - 1; j++) {
        const d1 = distance(colors[i], colors[i + 1]) + distance(colors[j], colors[j + 1])
        const d2 = distance(colors[i], colors[j]) + distance(colors[i + 1], colors[j + 1])

        if (d2 < d1) {
          colors = [...colors.slice(0, i + 1), ...colors.slice(i + 1, j + 1).reverse(), ...colors.slice(j + 1)]
          improved = true
        }
      }
    }
  }

  return colors
}

export function graphDeltaETsp(colors) {
  let path = graphDeltaE(colors)

  return tsp(path)
}

function computeOKLabStats(colors) {
  const labs = colors.map((c) => oklab(c))
  const n = labs.length

  const mean = labs.reduce((acc, l) => [acc[0] + l[0], acc[1] + l[1], acc[2] + l[2]], [0, 0, 0]).map((v) => v / n)

  const variance = labs.reduce((acc, l) => [acc[0] + (l[0] - mean[0]) ** 2, acc[1] + (l[1] - mean[1]) ** 2, acc[2] + (l[2] - mean[2]) ** 2], [0, 0, 0])

  return variance.map((v) => Math.sqrt(v / n) || 1e-6)
}

function adaptiveOKLabDistanceFactory(colors) {
  const WHAT_A_SIGMA = computeOKLabStats(colors)

  return (a, b) => {
    const A = oklab(a)
    const B = oklab(b)
    return Math.hypot((A[0] - B[0]) / WHAT_A_SIGMA[0], (A[1] - B[1]) / WHAT_A_SIGMA[1], (A[2] - B[2]) / WHAT_A_SIGMA[2])
  }
}
export function adaptiveTsp(colors) {
  const distance = adaptiveOKLabDistanceFactory(colors)
  const path = principalOklab(colors)

  return tsp(path, distance)
}
