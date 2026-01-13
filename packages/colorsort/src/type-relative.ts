import { Vector3 } from './vector.ts'

export function relativeDifference(palette: Vector3[]) {
  let sumL = 0,
    sumC = 0,
    sumH = 0

  for (const [L, C, H] of palette) {
    sumL += L
    sumC += C
    sumH += H || 0
  }

  const avgL = sumL / palette.length
  const avgC = sumC / palette.length
  const avgH = sumH / palette.length

  let relativeDifferenceL = 0,
    relativeDifferenceC = 0,
    relativeDifferenceH = 0

  // const relativeDifferences = []

  for (const [L, C, H] of palette) {
    const dL = Math.abs(L - avgL) / (L + avgL) || 0
    const dC = Math.abs(C - avgC) / (C + avgC) || 0
    const dH = Math.abs(H - avgH) / (H + avgH) || 0

    relativeDifferenceL += dL
    relativeDifferenceC += dC
    relativeDifferenceH += dH

    // relativeDifferences.push(dL + dC + dH)
  }

  return [relativeDifferenceL, relativeDifferenceC, relativeDifferenceH]
}
