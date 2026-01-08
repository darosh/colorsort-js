import chroma from 'chroma-js'
import { okhsl, okhsv, oklab, oklch } from './color.ts'

export type Vector3 = [number, number, number]
export type Vector4 = [number, number, number, number]

export function distance(a: Vector3, b: Vector3): number {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  const dz = a[2] - b[2]

  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export function distance4(a: Vector4, b: Vector4): number {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  const dz = a[2] - b[2]
  const dw = a[3] - b[3]

  return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw)
}

export function distanceRadial0(a: Vector3, b: Vector3) {
  let dx = Number.isNaN(a[0]) && Number.isNaN(b[0]) ? 0 : a[0] - b[0] || 0

  const dy = a[1] - b[1]
  const dz = a[2] - b[2]

  dx += dx > 180 ? -360 : dx < -180 ? 360 : 0
  dx /= 180

  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export function distanceRadial2(a: Vector3, b: Vector3) {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]

  let dz = Number.isNaN(a[2]) && Number.isNaN(b[2]) ? 0 : a[2] - b[2] || 0

  dz += dz > 180 ? -360 : dz < -180 ? 360 : 0
  dz /= 180

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

export function centroid(colors: Vector3[]): Vector3 {
  const sum = colors.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]], [0, 0, 0] as Vector3)
  return [sum[0] / colors.length, sum[1] / colors.length, sum[2] / colors.length]
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

export function closestList(data: Vector3[]) {
  const list = []

  for (let i = 0; i < data.length; i++) {
    for (let j = i + 1; j < data.length; j++) {
      const dx = data[i][0] - data[j][0]
      const dy = data[i][1] - data[j][1]
      const dz = data[i][2] - data[j][2]

      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

      list.push({ data: [data[i], data[j]], dist })
    }
  }

  list.sort((a, b) => a.dist - b.dist)

  return <[Vector3, Vector3][]>list.map((d) => d.data)
}

export function inlinest(data: Vector3[], helper: ColorHelper) {
  if (data.length === 2) {
    return <[Vector3, Vector3]>[...data]
  }

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

  if (helper.distance(<Vector3>first, <Vector3>mid) < helper.distance(<Vector3>mid, <Vector3>last)) {
    last = mid
  } else {
    first = mid
  }

  return <[Vector3, Vector3]>[first, last]
}

export function tspVectors(colors: Vector3[], helper: ColorHelper) {
  let improved = true

  while (improved) {
    improved = false

    for (let i = 0; i < colors.length - 2; i++) {
      for (let j = i + 1; j < colors.length - 1; j++) {
        const d1 = helper.distance(colors[i], colors[i + 1]) + helper.distance(colors[j], colors[j + 1])
        const d2 = helper.distance(colors[i], colors[j]) + helper.distance(colors[i + 1], colors[j + 1])

        if (d2 < d1) {
          colors = [...colors.slice(0, i + 1), ...colors.slice(i + 1, j + 1).reverse(), ...colors.slice(j + 1)]
          improved = true
        }
      }
    }
  }

  return colors
}

function normalizeLab(a: Vector3) {
  return [(a[0] + 128) / 255, (a[1] + 128) / 255, (a[2] + 128) / 255]
}

export interface ColorHelper {
  toColors(vectors: Vector3[]): string[]

  toColor(vector: Vector3): string

  distance(a: Vector3, b: Vector3): number

  deltaE(a: Vector3, b: Vector3, ...args: number[]): number
}

// https://github.com/w3c/csswg-drafts/issues/6642#issuecomment-945714988
const OK2_SCALE = (2.016 + 2.045) / 2

export function distanceOk2([L1, a1, b1]: Vector3, [L2, a2, b2]: Vector3) {
  let dL = L1 - L2
  let da = OK2_SCALE * (a1 - a2)
  let db = OK2_SCALE * (b1 - b2)
  return Math.sqrt(dL ** 2 + da ** 2 + db ** 2)
}

export type DistanceFn = (a: Vector3, b: Vector3) => number

function createDistanceCache(distanceFn: DistanceFn): Omit<ColorHelper, 'toColors' | 'toColor' | 'deltaE'> {
  const cache = new Map<string, number>()

  return {
    distance: (a: Vector3, b: Vector3) => {
      const key = [a, b].sort().join('|')
      let value = cache.get(key)

      if (value === undefined) {
        value = distanceFn(a, b)
        cache.set(key, value)
      }

      return value
    }
  }
}

function deltaE(a: string, b: string, x = 1, y = 1, z = 1) {
  return chroma.deltaE(a, b, x, y, z)
}

export function colorVectors(colors: string[], fn: (vectors: Vector3[]) => Vector3[], model: string = 'gl', distanceMethod_?: DistanceFn): string[] {
  const vectorMap = new Map()
  const distanceMethod = distanceMethod_ ?? (model.at(-1) === 'h' ? distanceRadial2 : model.at(-3) === 'h' ? distanceRadial0 : model === 'oklab' ? distanceOk2 : distance)

  let vs: [Vector3, string][]

  if (model === 'oklab') {
    vs = colors.map((c) => [oklab(c), c])
  } else if (model === 'lab-norm') {
    vs = colors.map((c) => <[Vector3, string]>[normalizeLab(chroma(c).lab()), c])
  } else if (model === 'oklch') {
    vs = colors.map((c) => [oklch(c), c])
  } else if (model === 'okhsl') {
    vs = colors.map((c) => [okhsl(c), c])
  } else if (model === 'okhsv') {
    vs = colors.map((c) => [okhsv(c), c])
  } else {
    vs = colors.map((c) => <[Vector3, string]>(<unknown>[chroma(c).get(model), c]))
  }

  for (const [key, value] of vs) {
    vectorMap.set(key, value)
  }

  function toColors(vectors: Vector3[]): string[] {
    return vectors.map((c: Vector3) => vectorMap.get(c))
  }

  function toColor(vector: Vector3): string {
    return vectorMap.get(vector)
  }

  const helper = <ColorHelper>createDistanceCache(distanceMethod)
  helper.toColors = toColors
  helper.toColor = toColor
  helper.deltaE = (a, b, ...c) => deltaE(toColor(a), toColor(b), ...c)

  const vectors = [...vectorMap.keys()]
  const sorted = fn.call(helper, vectors)

  return sorted.map((c: Vector3) => vectorMap.get(c))
}
