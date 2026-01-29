import { getAuto } from './auto.ts'
import { SORTING_METHODS } from './sorting-methods'
import { metricsEx } from './metrics-extended.ts'

export function auto(colors: string[], DATA: any) {
  const mid = getAuto(colors, DATA)[0]

  return SORTING_METHODS.find((x) => x.mid === mid)?.fn(colors)
}

export const MAX_AUTO = 15

export function multiAuto(colors: string[], DATA: any, max = MAX_AUTO) {
  const mids = getAuto(colors, DATA).slice(0, max)

  return mids
    .map((mid, index) => {
      const sorted = <string[]>SORTING_METHODS.find((x) => x.mid === mid)?.fn(colors)
      const metrics = metricsEx(sorted)

      return {
        sorted,
        mid,
        index,
        metrics
      }
    })
    .sort((a, b) => a.metrics.avgAngleChange - b.metrics.avgAngleChange)
}
