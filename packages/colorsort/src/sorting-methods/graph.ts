import { compareColors, Vector3 } from '../vector.ts'
import { relativeDifference } from '../type-relative.ts'
import { detectPaletteType } from '../type-detect.ts'
import { calculateAdaptiveWeights, calculateVariances } from '../type-variances.ts'
import { ColorHelperDelta, Distance3, methodRunner } from '../method-runner.ts'
import { tspVectors } from '../uni-tsp.ts'
import { deltaE, lch } from '../color.ts'

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
      const preSorted = [...data].sort()
      const vectors = graphDeltaE(preSorted, this.delta)

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
      const preSorted = [...data].sort(compareColors)
      const weights = relativeDifference(preSorted)
      return graphDeltaE(preSorted, (a, b) => this.delta(a, b, ...weights))
    },
    'lch',
    { fn: deltaE, color: true }
  )
}

export function graphWeightedPlusPlus(colors: string[]) {
  const lchColors = colors.map((c) => lch(c))
  const { Kl, Kc, Kh } = detectPaletteType(lchColors)
  const weights = [Kl, Kc, Kh]

  return methodRunner(
    colors,
    function (this: ColorHelperDelta, data: Vector3[]) {
      const preSorted = [...data].sort()
      return graphDeltaE(preSorted, (a, b) => this.delta(a, b, ...weights))
    },
    'hex',
    deltaE
  )
}

export function graphWeightedAdaptive1(colors: string[]) {
  const lchColors = colors.map((c) => lch(c))
  const variances = calculateVariances(lchColors)
  const { Kc, Kh, Kl } = calculateAdaptiveWeights(variances)
  const weights = [Kl, Kc, Kh]

  return methodRunner(
    colors,
    function (this: ColorHelperDelta, data: Vector3[]) {
      const preSorted = [...data].sort()
      return graphDeltaE(preSorted, (a, b) => this.delta(a, b, ...weights))
    },
    'hex',
    deltaE
  )
}

export function graphWeightedAdaptive2(colors: string[]) {
  const lchColors = colors.map((c) => lch(c))
  const variances = calculateVariances(lchColors)
  const { Kc, Kh, Kl } = calculateAdaptiveWeights(variances)
  const weights = [Kl, Kc, Kh + 0.5]

  return methodRunner(
    colors,
    function (this: ColorHelperDelta, data: Vector3[]) {
      const preSorted = [...data].sort()
      return graphDeltaE(preSorted, (a: Vector3, b: Vector3) => this.delta(a, b, ...weights))
    },
    'hex',
    deltaE
  )
}
