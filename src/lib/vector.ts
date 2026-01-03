import chroma from 'chroma-js'
import { oklab } from './oklab.js'

export type Vector3 = [number, number, number]

export function distance(a: Vector3, b: Vector3): number {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  const dz = a[2] - b[2]
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export function normalize(v: Vector3): Vector3 {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
  if (len === 0) {
    return [0, 0, 0]
  }
  return [v[0] / len, v[1] / len, v[2] / len]
}

export function subtract(a: Vector3, b: Vector3): Vector3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

export function dot(a: Vector3, b: Vector3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

export function closest(data: Vector3[]) {
  let minDist = Infinity
  let first = null
  let last = null

  // Compare all pairs to find the closest two points
  for (let i = 0; i < data.length; i++) {
    for (let j = i + 1; j < data.length; j++) {
      const dx = data[i][0] - data[j][0]
      const dy = data[i][1] - data[j][1]
      const dz = data[i][2] - data[j][2]
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (dist < minDist) {
        minDist = dist
        first = data[i]
        last = data[j]
      }
    }
  }

  return <[Vector3, Vector3]>[first, last]
}

export function inlinest(data: Vector3[]) {
  let bestAlignment = -Infinity
  let first: Vector3 | null = null
  let mid: Vector3 | null = null
  let last: Vector3 | null = null

  // Evaluate all combinations of three points
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data.length; j++) {
      if (j === i) {
        continue
      }
      for (let k = 0; k < data.length; k++) {
        if (k === i || k === j) {
          continue
        }

        const dir1 = normalize(subtract(data[j], data[i]))
        const dir2 = normalize(subtract(data[k], data[j]))

        // alignment is 1 when directions are the same, -1 when opposite
        const alignment = dot(dir1, dir2)

        if (alignment > bestAlignment) {
          bestAlignment = alignment
          first = data[i]
          mid = data[j]
          last = data[k]
        }
      }
    }
  }

  if (distance(<Vector3>first, <Vector3>mid) < distance(<Vector3>mid, <Vector3>last)) {
    last = mid
  } else {
    first = mid
  }

  return <[Vector3, Vector3]>[first, last]
}

function normalizeLab(a: Vector3) {
  return [(a[0] + 128) / 255, (a[1] + 128) / 255, (a[2] + 128) / 255]
}

export function colorVectors(colors: string[], fn: (vectors: Vector3[]) => Vector3[], model: string = 'gl'): string[] {
  const vectorMap = new Map()

  colors
    .map((c) => {
      if (model === 'oklab') {
        return [oklab(c), c]
      } else if (model === 'lab-norm') {
        return [normalizeLab(chroma(c).lab()), c]
      } else {
        return [chroma(c).get(model), c]
      }
    })
    .forEach(([key, value]) => {
      vectorMap.set(key, value)
    })

  const vectors = [...vectorMap.keys()]
  const sorted = fn(vectors)

  return sorted.map((c: Vector3) => vectorMap.get(c))
}
