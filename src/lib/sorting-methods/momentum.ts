import { dot, normalize, subtract, Vector3 } from '../vector.ts'
import { detectPaletteType } from '../metrics-type.ts'
import { metrics } from '../metrics.ts'
import { ColorHelper, DistanceFn, methodRunner } from '../method-runner.ts'
import { tspVectors } from '../uni-tsp.ts'
import { closest, closestList, inlinest } from '../uni-neighbors.ts'

function calculateScore(from: Vector3, to: Vector3, prevDirection: Vector3, distanceFn: DistanceFn, momentumWeight: number = 1e6) {
  const dist = distanceFn(from, to)
  const direction = normalize(subtract(to, from))
  let score = dist

  if (prevDirection) {
    const alignment = dot(prevDirection, direction)
    const momentumBonus = (1 - alignment) * momentumWeight
    score = dist * (1 + momentumBonus)
  }

  return { score, direction }
}

function calculateScoreDeltaE(from: Vector3, to: Vector3, prevDirection: Vector3, distance: DistanceFn, deltaE: DistanceFn, momentumWeight: number = 1e6) {
  const delta = deltaE(from, to)
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

type ScoringFn = (
  a: Vector3,
  b: Vector3,
  c: Vector3
) => {
  score: number
  direction: Vector3
}

function momentumBidiSort(data: Vector3[], start: [Vector3, Vector3], scoring: ScoringFn) {
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
  return methodRunner(
    colors,
    function (this: ColorHelper, data: Vector3[]) {
      const scoring: ScoringFn = (a: Vector3, b: Vector3, c: Vector3) => calculateScore(a, b, c, this.distance)
      return momentumBidiSort(data, closest(data), scoring)
    },
    'oklab'
  )
}

export function momentumClosestBestOklab(colors: string[], post: 'raw' | 'tsp' = 'raw') {
  return methodRunner(
    colors,
    function (this: ColorHelper, data: Vector3[]) {
      const list = closestList(data).slice(0, 128)
      const scoring: ScoringFn = (a: Vector3, b: Vector3, c: Vector3) => calculateScore(a, b, c, this.distance)

      const result = list.map((start) => {
        const vectors = momentumBidiSort(data, start, scoring)

        return {
          vectors,
          // @ts-ignore
          metrics: metrics(this.toColors(vectors))
        }
      })

      result.sort((a, b) => a.metrics.totalDistance - b.metrics.totalDistance)

      return post === 'tsp' ? tspVectors(result[0].vectors, this.distance) : result[0].vectors
    },
    'oklab'
  )
}

momentumClosestBestOklab.params = [{ name: 'post', values: ['raw', 'tsp'] }]

export function momentumClosestBestDeltaEOklab(colors: string[]) {
  return methodRunner(
    colors,
    function (this: ColorHelper, data: Vector3[]) {
      const list = closestList(data).slice(0, 128)
      const de = (a: Vector3, b: Vector3) => this.deltaE(a, b)
      const scoring: ScoringFn = (a: Vector3, b: Vector3, c: Vector3) => calculateScoreDeltaE(a, b, c, this.distance, de)

      const result = list.map((start) => {
        const vectors = momentumBidiSort(data, start, scoring)

        return {
          vectors,
          // @ts-ignore
          metrics: metrics(this.toColors(vectors))
        }
      })

      result.sort((a, b) => a.metrics.totalDistance - b.metrics.totalDistance)

      return result[0].vectors
    },
    'oklab'
  )
}

export function momentumInlinestOklab(colors: string[]) {
  return methodRunner(
    colors,
    function (this: ColorHelper, data: Vector3[]) {
      const scoring: ScoringFn = (a: Vector3, b: Vector3, c: Vector3) => calculateScore(a, b, c, this.distance)
      return momentumBidiSort(data, inlinest(data, this), scoring)
    },
    'oklab'
  )
}

export function momentumInlinestDeltaEOklab(colors: string[]) {
  return methodRunner(
    colors,
    function (this: ColorHelper, data: Vector3[]) {
      const de = (a: Vector3, b: Vector3) => this.deltaE(a, b)
      const scoring: ScoringFn = (a: Vector3, b: Vector3, c: Vector3) => calculateScoreDeltaE(a, b, c, this.distance, de)
      return momentumBidiSort(data, inlinest(data, this), scoring)
    },
    'oklab'
  )
}

export function momentumInlinestDeltaEPlusOklab(colors: string[]) {
  const { Kl, Kc, Kh } = detectPaletteType(colors)
  const weights = <[number, number, number]>[Kl, Kc, Kh]

  return methodRunner(
    colors,
    function (this: ColorHelper, data: Vector3[]) {
      const de = (a: Vector3, b: Vector3) => this.deltaE(a, b, ...weights)
      const scoring: ScoringFn = (a: Vector3, b: Vector3, c: Vector3) => calculateScoreDeltaE(a, b, c, this.distance, de)
      return momentumBidiSort(data, inlinest(data, this), scoring)
    },
    'oklab'
  )
}
