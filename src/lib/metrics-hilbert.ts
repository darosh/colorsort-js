import { hilbertIndex } from './sorting-methods/hilbert.ts'
import { Vector3 } from './vector.ts'
import { methodRunner } from './method-runner.ts'

export function metricsHilbert (colors: string[], model: 'rgb' | 'lab-norm' = 'rgb') {
  let indices

  methodRunner(
    colors,
    function (vectors: Vector3[]) {
      indices = vectors.map((v) => hilbertIndex(v))
    },
    model
  )

  let totalDistance = 0
  // @ts-ignore
  const minIndex = indices.reduce((acc, x) => Math.min(acc, x), Infinity)
  // @ts-ignore
  const maxIndex = indices.reduce((acc, x) => Math.max(acc, x), -Infinity)
  const distances = []

  // @ts-ignore
  for (let i = 1; i < indices.length; i++) {
    // @ts-ignore
    const dist = Math.abs(indices[i - 1] - indices[i])
    totalDistance += dist
    distances.push(dist)
  }

  const indexDistance = maxIndex - minIndex
  // @ts-ignore
  const meanDistance = totalDistance / (indices.length - 1)
  // @ts-ignore
  const devDistance = Math.sqrt(distances.reduce((acc, d) => acc + Math.pow(d - meanDistance, 2), 0) / (indices.length - 1))

  return {
    totalDistance,
    minIndex,
    maxIndex,
    indexDistance,
    // @ts-ignore
    expectedMean: indexDistance / indices.length,
    meanDistance,
    devDistance
  }
}
