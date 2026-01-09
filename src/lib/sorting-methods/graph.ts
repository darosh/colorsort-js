import { Vector3 } from '../vector.ts'
import { relativeDifference } from '../metrics-relative.ts'
import { detectPaletteType } from '../metrics-type.ts'
import { calculateAdaptiveWeights, calculateVariances } from '../metrics-variances.ts'
import { ColorHelperDelta, Distance3, methodRunner } from '../method-runner.ts'
import { tspVectors } from '../uni-tsp.ts'
import { deltaE } from '../color.ts'

export function graphDeltaE(colors: Vector3[], delta: Distance3): Vector3[] {
  const graph = new Map()

  for (let i = 0; i < colors.length; i++) {
    const node = new Set()

    for (let j = 0; j < colors.length; j++) {
      if (i !== j) {
        node.add({
          color: colors[j],
          distance: delta(colors[i], colors[j])
        })
      }
    }

    graph.set(colors[i], node)
  }

  const sortedColors: Vector3[] = []
  const visitedColors = new Set()

  function traverse(node: Vector3) {
    sortedColors.push(node)
    visitedColors.add(node)

    const neighbors = [...graph.get(node)].sort((a, b) => a.distance - b.distance)

    for (const neighbor of neighbors) {
      if (!visitedColors.has(neighbor.color)) {
        traverse(neighbor.color)
      }
    }
  }

  traverse(colors[0])

  return sortedColors
}

export function graph(colors: string[], post: 'tsp' | 'raw' = 'raw') {
  return methodRunner(
    colors,
    function (this: ColorHelperDelta, data: Vector3[]) {
      const vectors = graphDeltaE(data, this.delta)

      if (post === 'raw') {
        return vectors
      }

      return tspVectors(vectors, this.delta)
    },
    'hex',
    deltaE
  )
}

graph.params = [{ name: 'post', values: ['raw', 'tsp'] }]

export function graphWeighted(colors: string[]) {
  return methodRunner(
    colors,
    function (this: ColorHelperDelta, data: Vector3[]) {
      const weights = relativeDifference(data)
      return graphDeltaE(data, (a, b) => this.delta(a, b, ...weights))
    },
    'lch',
    { fn: deltaE, color: true }
  )
}

export function graphWeightedPlusPlus(colors: string[]) {
  const { Kl, Kc, Kh } = detectPaletteType(colors)
  const weights = [Kl, Kc, Kh]

  return methodRunner(
    colors,
    function (this: ColorHelperDelta, data: Vector3[]) {
      return graphDeltaE(data, (a, b) => this.delta(a, b, ...weights))
    },
    'hex',
    deltaE
  )
}

export function graphWeightedAdaptive1(colors: string[]) {
  const variances = calculateVariances(colors)
  const { Kc, Kh, Kl } = calculateAdaptiveWeights(variances)
  const weights = [Kl, Kc, Kh]

  return methodRunner(
    colors,
    function (this: ColorHelperDelta, data: Vector3[]) {
      return graphDeltaE(data, (a, b) => this.delta(a, b, ...weights))
    },
    'hex',
    deltaE
  )
}

export function graphWeightedAdaptive2(colors: string[]) {
  const variances = calculateVariances(colors)
  const { Kc, Kh, Kl } = calculateAdaptiveWeights(variances)
  const weights = [Kl, Kc, Kh + 0.5]

  return methodRunner(
    colors,
    function (this: ColorHelperDelta, data: Vector3[]) {
      return graphDeltaE(data, (a: Vector3, b: Vector3) => this.delta(a, b, ...weights))
    },
    'hex',
    deltaE
  )
}
