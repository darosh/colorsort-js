import { getAuto } from './auto.ts'
import { SORTING_METHODS } from './sorting-methods'

export function auto(colors: string[], DATA: any) {
  const mid = getAuto(colors, DATA)

  return SORTING_METHODS.find((x) => x.mid === mid)?.fn(colors)
}
