import chroma from 'chroma-js'
import { distanceOk2, okhsl, okhsv, oklab, oklch } from './color.ts'
import { distance, distanceRadial0, distanceRadial2, Vector3 } from './vector.ts'

function normalizeLab(a: Vector3) {
  return [(a[0] + 128) / 255, (a[1] + 128) / 255, (a[2] + 128) / 255]
}

export interface ColorHelper {
  toColors(vectors: Vector3[]): string[]

  toColor(vector: Vector3): string

  distance(a: Vector3, b: Vector3): number

  deltaE(a: Vector3, b: Vector3, ...args: number[]): number
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

export function methodRunner(colors: string[], fn: (vectors: Vector3[]) => Vector3[], model: string = 'gl', distanceMethod_?: DistanceFn): string[] {
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
  } else if (model === 'hex') {
    vs = <[Vector3, string][]>(<unknown>colors.map((c) => [c, c]))
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

  const helper = <ColorHelper>createDistanceCache(<DistanceFn>distanceMethod)
  helper.toColors = toColors
  helper.toColor = toColor
  helper.deltaE = (a, b, ...c) => deltaE(toColor(a), toColor(b), ...c)

  const vectors = [...vectorMap.keys()]
  const sorted = fn.call(helper, vectors)

  return sorted.map((c: Vector3) => vectorMap.get(c))
}
