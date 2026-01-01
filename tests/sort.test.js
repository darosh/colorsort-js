import { test } from 'vitest'
import chroma from 'chroma-js'
import { sortAll } from '../src/sort.js'
import { palettes } from '../src/paletes.js'
import { representations, sortingMethods } from '../src/sorings.js'

const P = [
  '#060608',
  '#141013',
  '#3b1725',
  '#73172d',
  '#b4202a',
  '#df3e23',
  '#fa6a0a',
  '#f9a31b',
  '#ffd541',
  '#fffc40',
  '#d6f264',
  '#9cdb43',
  '#59c135',
  '#14a02e',
  '#1a7a3e',
  '#24523b',
  '#122020',
  '#143464',
  '#285cc4',
  '#249fde',
  '#20d6c7',
  '#a6fcdb',
  '#ffffff',
  '#fef3c0',
  '#fad6b8',
  '#f5a097',
  '#e86a73',
  '#bc4a9b',
  '#793a80',
  '#403353',
  '#242234',
  '#221c1a',
  '#322b28',
  '#71413b',
  '#bb7547',
  '#dba463',
  '#f4d29c',
  '#dae0ea',
  '#b3b9d1',
  '#8b93af',
  '#6d758d',
  '#4a5462',
  '#333941',
  '#422433',
  '#5b3138',
  '#8e5252',
  '#ba756a',
  '#e9b5a3',
  '#e3e6ff',
  '#b9bffb',
  '#849be4',
  '#588dbe',
  '#477d85',
  '#23674e',
  '#328464',
  '#5daf8d',
  '#92dcba',
  '#cdf7e2',
  '#e4d2aa',
  '#c7b08b',
  '#a08662',
  '#796755',
  '#5a4e44',
  '#423934'
]
//.sort((a, b) => a.localeCompare(b));

// const T = [
//   '#060608',
//   '#141013',
//   '#221c1a',
//   '#322b28',
//   '#423934',
//   '#333941',
//   '#403353',
//   '#4a5462',
//   '#477d85',
//   '#5daf8d',
//   '#92dcba',
//   '#a6fcdb',
//   '#cdf7e2',
//   '#dae0ea',
//   '#e3e6ff',
//   '#ffffff',
//   '#fef3c0',
//   '#fad6b8',
//   '#e4d2aa',
//   '#f4d29c',
//   '#e9b5a3',
//   '#f5a097',
//   '#e86a73',
//   '#ba756a',
//   '#a08662',
//   '#796755',
//   '#5a4e44',
//   '#5b3138',
//   '#422433',
//   '#3b1725',
//   '#242234',
//   '#122020',
//   '#24523b',
//   '#23674e',
//   '#1a7a3e',
//   '#14a02e',
//   '#59c135',
//   '#9cdb43',
//   '#d6f264',
//   '#fffc40',
//   '#ffd541',
//   '#f9a31b',
//   '#fa6a0a',
//   '#df3e23',
//   '#b4202a',
//   '#73172d',
//   '#71413b',
//   '#8e5252',
//   '#bb7547',
//   '#dba463',
//   '#c7b08b',
//   '#b3b9d1',
//   '#b9bffb',
//   '#849be4',
//   '#588dbe',
//   '#6d758d',
//   '#793a80',
//   '#bc4a9b',
//   '#8b93af',
//   '#20d6c7',
//   '#249fde',
//   '#285cc4',
//   '#143464',
//   '#328464',
// ];

function distance(a, b) {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  const dz = a[2] - b[2]
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

function normalize(v) {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
  if (len === 0) {
    return [0, 0, 0]
  }
  return [v[0] / len, v[1] / len, v[2] / len]
}

function subtract(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

export function sortWithMomentum(colors, momentumWeight = 0.6) {
  if (colors.length === 0) {
    return []
  }

  const remaining = new Set(colors)
  const sorted = []

  // // Start with the darkest color (closest to origin)
  // let current = colors.reduce((min, c) =>
  //   c[0] + c[1] + c[2] < min[0] + min[1] + min[2] ? c : min,
  // );

  let current = colors[0]
  sorted.push(current)
  remaining.delete(current)

  current = colors[1]
  sorted.push(current)
  remaining.delete(current)

  // let prevDirection = null;
  let prevDirection = normalize(subtract(colors[0], colors[1]))

  while (remaining.size > 0) {
    let best = null
    let bestScore = Infinity

    for (const candidate of remaining) {
      const dist = distance(current, candidate)
      const direction = normalize(subtract(candidate, current))

      let score = dist

      // Apply momentum bonus
      if (prevDirection) {
        const alignment = dot(prevDirection, direction)
        // alignment ranges from -1 (opposite) to 1 (same direction)
        // We want to reward positive alignment
        const momentumBonus = (1 - alignment) * momentumWeight
        score = dist * (1 + momentumBonus)
      }

      if (score < bestScore) {
        bestScore = score
        best = candidate
      }
    }

    if (best) {
      prevDirection = normalize(subtract(best, current))
      current = best
      sorted.push(current)
      remaining.delete(current)
    }
  }

  return sorted
}

export function analyzeSort(colors) {
  if (colors.length < 2) {
    return { totalDistance: 0, avgAngleChange: 0, maxAngleChange: 0 }
  }

  let totalDistance = 0
  let angleChanges = []
  let prevDirection = null

  for (let i = 1; i < colors.length; i++) {
    const dist = distance(colors[i - 1], colors[i])
    totalDistance += dist

    const direction = normalize(subtract(colors[i], colors[i - 1]))

    if (prevDirection && dist > 0) {
      const dotProd = Math.max(-1, Math.min(1, dot(prevDirection, direction)))
      const angle = Math.acos(dotProd) * (180 / Math.PI)
      angleChanges.push(angle)
    }

    prevDirection = direction
  }

  const avgAngleChange = angleChanges.length > 0 ? angleChanges.reduce((a, b) => a + b, 0) / angleChanges.length : 0

  const maxAngleChange = angleChanges.length > 0 ? Math.max(...angleChanges) : 0

  return { totalDistance, avgAngleChange, maxAngleChange }
}

test('A', () => {
  const R = P.map((c) => chroma(c).rgb())
  const S = sortWithMomentum(R, 100)
  const H = S.map((c) => chroma(c).hex())

  console.log(H)

  console.log('Metrics:', analyzeSort(S))
  console.log('Metrics:', analyzeSort(R))
})

sortAll(palettes, representations, sortingMethods)
