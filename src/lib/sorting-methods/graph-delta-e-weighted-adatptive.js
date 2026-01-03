import { graphDeltaE } from './graph-delta-e.js'
import { calculateVariances } from '../variances.js'

function calculateAdaptiveWeights(colors, variances) {
  const total = Math.max(Number.EPSILON, variances.L + variances.C + (variances.H ?? 0))

  return {
    Kl: (total - variances.L) / (2 * total),
    Kc: (total - variances.C) / (2 * total),
    Kh: (total - variances.H) / (2 * total)
  }
}
export function graphDeltaEWeightedAdaptive1(colors) {
  const variances = calculateVariances(colors)
  const { Kc, Kh, Kl } = calculateAdaptiveWeights(colors, variances)

  return graphDeltaE(colors, [Kl, Kc, Kh])
}

export function graphDeltaEWeightedAdaptive2(colors) {
  const variances = calculateVariances(colors)
  const { Kc, Kh, Kl } = calculateAdaptiveWeights(colors, variances)

  return graphDeltaE(colors, [Kl, Kc, Kh + 0.5])
}
