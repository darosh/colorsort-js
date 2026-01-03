import chroma from 'chroma-js'

import { graphDeltaE } from './graph-delta-e.js'

function relativeDifference(palette) {
  let sumL = 0,
    sumC = 0,
    sumH = 0

  for (const [L, C, H] of palette) {
    sumL += L
    sumC += C
    sumH += H
  }

  const avgL = sumL / palette.length
  const avgC = sumC / palette.length
  const avgH = sumH / palette.length

  let relativeDifferenceL = 0,
    relativeDifferenceC = 0,
    relativeDifferenceH = 0
  const relativeDifferences = []

  for (const [L, C, H] of palette) {
    const dL = Math.abs(L - avgL) / (L + avgL) || 0
    const dC = Math.abs(C - avgC) / (C + avgC) || 0
    const dH = Math.abs(H - avgH) / (H + avgH) || 0

    relativeDifferenceL += dL
    relativeDifferenceC += dC
    relativeDifferenceH += dH
    relativeDifferences.push(dL + dC + dH)
  }

  return [relativeDifferenceL, relativeDifferenceC, relativeDifferenceH, relativeDifferences]
}

export function graphDeltaEWeighted(colors) {
  const relativeWeights = relativeDifference(
    colors.map((c) =>
      chroma(c)
        .lch()
        .map((v) => v || 0)
    )
  )

  return graphDeltaE(colors, relativeWeights)
}
