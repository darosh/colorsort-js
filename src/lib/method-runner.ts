import { ColorType, convertColors } from './color.ts'
import { distance, distance4, distanceRadial0, distanceRadial2, Vector3, Vector4 } from './vector.ts'
import { distanceOk2 } from './color-oklab.ts'
// import debug from 'debug'

// const log = debug('cs:runner')

export type UniColor = Vector3 | Vector4 | any

export type ColorHelper = {
  toColors(vectors: UniColor[]): string[]
  toColor(vector: UniColor): string
  distance: Distance<UniColor>
}

export type ColorHelperDelta = ColorHelper & {
  delta: Distance<UniColor>
}

export type Distance<T> = (a: T, b: T, ...args: any[]) => number
export type Distance3 = Distance<Vector3>
export type Distance4 = Distance<Vector4>
export type DistanceU = Distance<UniColor>
export type DistanceC = Distance<string>

const CACHE: { [index: string]: Map<string, number> } = {}

function createDistanceCache<T>(distanceFn: Distance<T>): Distance<T> {
  const ds = distanceFn.name || distanceFn.toString()
  const cache = (CACHE[ds] = CACHE[ds] || new Map<string, number>())

  return (a: T, b: T) => {
    const key = [a, b].sort().join('|')
    let value = cache.get(key)

    if (value === undefined) {
      value = distanceFn(a, b)
      cache.set(key, value)
    }

    return value
  }
}

export type DistanceOptions = {
  fn: Distance<any>
  color: boolean
}

function modelDistance(model: string) {
  return model.at(-1) === 'h' ? distanceRadial2 : model.at(-3) === 'h' ? distanceRadial0 : model === 'oklab' ? distanceOk2 : model === 'cmyk' ? distance4 : distance
}

export function methodRunner<T>(colors: string[], fn: (this: T, vectors: UniColor[]) => UniColor[] | void, model: ColorType = 'gl', deltaMethod_?: Distance<any> | DistanceOptions, distanceMethod_?: Distance<any> | DistanceOptions): string[] {
  // log(`starting '${fn.name || (<any>fn).name_}'`)

  const vectorMap = new Map()

  let distanceMethodObj = distanceMethod_ ?? modelDistance(model)
  let distanceMethod = distanceMethodObj

  if (typeof distanceMethod !== 'function') {
    if (distanceMethod.color) {
      distanceMethod = <DistanceU>((a, b, ...args) => (<DistanceOptions>distanceMethodObj).fn(toColor(a), toColor(b), ...args))
    } else {
      distanceMethod = (<DistanceOptions>distanceMethodObj).fn
    }
  }

  let deltaMethodObj = deltaMethod_
  let deltaMethod = deltaMethodObj

  if (deltaMethod && typeof deltaMethod !== 'function') {
    if (deltaMethod.color) {
      deltaMethod = <DistanceU>((a, b, ...args) => {
        return (<DistanceOptions>deltaMethodObj).fn(toColor(a), toColor(b), ...args)
      })
    } else {
      deltaMethod = (<DistanceOptions>deltaMethodObj).fn
    }
  }

  const vs: [UniColor, string][] = convertColors(colors, model)

  for (const [key, value] of vs) {
    vectorMap.set(key, value)
  }

  function toColors(vectors: Vector3[]): string[] {
    return vectors.map((c: Vector3) => vectorMap.get(c))
  }

  function toColor(vector: Vector3): string {
    return vectorMap.get(vector)
  }

  const helper = {
    distance: createDistanceCache(<Distance<any>>distanceMethod),
    delta: deltaMethod ? createDistanceCache(deltaMethod) : undefined,
    toColors,
    toColor
  }

  const vectors = [...vectorMap.keys()]
  const sorted = fn.call(<T>helper, vectors)

  return (<any[]>sorted)?.map((c: Vector3) => vectorMap.get(c))
}
