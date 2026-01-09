import { tspVectors, Vector3 } from '../vector.ts'
import { relativeDifference } from '../metrics-relative.ts'
import { detectPaletteType } from '../metrics-type.ts'
import { calculateAdaptiveWeights, calculateVariances } from '../metrics-variances.ts'
import { ColorHelper, DistanceFn, methodRunner } from '../method-runner.ts'

export function graphDeltaE(colors: Vector3[], deltaE: DistanceFn): Vector3[] {
  const graph = new Map()

  for (let i = 0; i < colors.length; i++) {
    const node = new Set()

    for (let j = 0; j < colors.length; j++) {
      if (i !== j) {
        node.add({
          color: colors[j],
          distance: deltaE(colors[i], colors[j])
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
    function (this: ColorHelper, data: Vector3[]) {
      const vectors = graphDeltaE(data, this.deltaE)

      if (post === 'raw') {
        return vectors
      }

      return tspVectors(vectors, this.deltaE)
    },
    'hex'
  )
}

graph.params = [{ name: 'post', values: ['raw', 'tsp'] }]

export function graphWeighted(colors: string[]) {
  return methodRunner(
    colors,
    function (this: ColorHelper, data: Vector3[]) {
      const weights = relativeDifference(data)
      return graphDeltaE(data, (a, b) => this.deltaE(a, b, ...weights))
    },
    'lch'
  )
}

export function graphWeightedPlusPlus(colors: string[]) {
  const { Kl, Kc, Kh } = detectPaletteType(colors)
  const weights = [Kl, Kc, Kh]

  return methodRunner(
    colors,
    function (this: ColorHelper, data: Vector3[]) {
      return graphDeltaE(data, (a, b) => this.deltaE(a, b, ...weights))
    },
    'hex'
  )
}

export function graphWeightedAdaptive1(colors: string[]) {
  const variances = calculateVariances(colors)
  const { Kc, Kh, Kl } = calculateAdaptiveWeights(variances)
  const weights = [Kl, Kc, Kh]

  return methodRunner(
    colors,
    function (this: ColorHelper, data: Vector3[]) {
      return graphDeltaE(data, (a, b) => this.deltaE(a, b, ...weights))
    },
    'hex'
  )
}

export function graphWeightedAdaptive2(colors: string[]) {
  const variances = calculateVariances(colors)
  const { Kc, Kh, Kl } = calculateAdaptiveWeights(variances)
  const weights = [Kl, Kc, Kh + 0.5]

  return methodRunner(
    colors,
    function (this: ColorHelper, data: Vector3[]) {
      return graphDeltaE(data, (a, b) => this.deltaE(a, b, ...weights))
    },
    'hex'
  )
}
