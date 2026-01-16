export { deserialize } from './deserialize.ts'
import BESTIES_ from './besties.json' with { type: 'json' }
export { computedSerialize, computePlan, computeRender, updateBest, updateBestAndDistanceAll, updateDistance } from './compute.ts'

export type { MethodInfo, PaletteGroup, PaletteRecordGrouped, PaletteRecord, SortRecord } from './compute.ts'

export const BESTIES = BESTIES_
