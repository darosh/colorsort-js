import chroma from 'chroma-js'
import { closest, colorVectors, distance, dot, inlinest, normalize, subtract, Vector3 } from '../vector.ts'
import { oklab2hex } from '../oklab.ts'
// @ts-ignore
import { detectPaletteType } from '../types.js'

function calculateScore(from: Vector3, to: Vector3, prevDirection: Vector3, momentumWeight: number = 1e6) {
  const dist = distance(from, to)
  const direction = normalize(subtract(to, from))
  let score = dist

  if (prevDirection) {
    const alignment = dot(prevDirection, direction)
    const momentumBonus = (1 - alignment) * momentumWeight
    score = dist * (1 + momentumBonus)
  }

  return { score, direction }
}

function calculateScoreDeltaE(from: Vector3, to: Vector3, prevDirection: Vector3, weights: [number, number, number] = [1, 1, 1], momentumWeight: number = 1e6) {
  const delta = chroma.deltaE(oklab2hex(from), oklab2hex(to), ...weights)
  const dist = (distance(from, to) * delta) / 128

  const direction = normalize(subtract(to, from))
  let score = dist

  if (prevDirection) {
    const alignment = dot(prevDirection, direction)
    const momentumBonus = (1 - alignment) * momentumWeight
    score = dist * (1 + momentumBonus)
  }

  return { score, direction }
}

function momentumBidiSort(
  data: Vector3[],
  start: [Vector3, Vector3],
  scoring: (
    a: Vector3,
    b: Vector3,
    c: Vector3
  ) => {
    score: number
    direction: Vector3
  }
) {
  const remaining = new Set(data)
  const sorted = []

  // Start with closest two colors
  let [first, last] = start

  sorted.push(first, last)
  remaining.delete(first)
  remaining.delete(last)

  let prevDirectionStart = normalize(subtract(first, last))
  let prevDirectionEnd = normalize(subtract(last, first))

  while (remaining.size > 0) {
    // Find two best candidates overall
    let candidates = []

    for (const candidate of remaining) {
      const scoreStart = scoring(first, candidate, prevDirectionStart)
      const scoreEnd = scoring(last, candidate, prevDirectionEnd)
      const minScore = Math.min(scoreStart.score, scoreEnd.score)
      candidates.push({ candidate, scoreStart, scoreEnd, minScore })
    }

    // Sort to get the two best candidates by their minimum score
    candidates.sort((a, b) => a.minScore - b.minScore)

    // Take the best candidate and determine if it fits better at start or end
    const best = candidates[0]

    if (best.scoreStart.score <= best.scoreEnd.score) {
      // Add to start
      sorted.unshift(best.candidate)
      prevDirectionStart = best.scoreStart.direction
      first = best.candidate
    } else {
      // Add to end
      sorted.push(best.candidate)
      prevDirectionEnd = best.scoreEnd.direction
      last = best.candidate
    }

    remaining.delete(best.candidate)
  }

  return sorted
}

export function momentumClosestOklab(colors: string[]) {
  return colorVectors(colors, (data: Vector3[]) => momentumBidiSort(data, closest(data), calculateScore), 'oklab')
}

export function momentumInlinestOklab(colors: string[]) {
  return colorVectors(colors, (data: Vector3[]) => momentumBidiSort(data, inlinest(data), calculateScore), 'oklab')
}

export function momentumInlinestDeltaEOklab(colors: string[]) {
  return colorVectors(colors, (data: Vector3[]) => momentumBidiSort(data, inlinest(data), calculateScoreDeltaE), 'oklab')
}

export function momentumInlinestDeltaEPlusOklab(colors: string[]) {
  const { Kl, Kc, Kh } = detectPaletteType(colors)
  const weights = <[number, number, number]>[Kl, Kc, Kh]
  const scoring = (a: Vector3, b: Vector3, c: Vector3) => calculateScoreDeltaE(a, b, c, weights)

  return colorVectors(colors, (data: Vector3[]) => momentumBidiSort(data, inlinest(data), scoring), 'oklab')
}
