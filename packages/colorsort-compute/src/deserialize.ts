import type { Method, PaletteRecordGrouped } from './compute.ts'

//@ts-ignore
import { SORTING_METHODS } from 'colorsort'

export function deserialize(types: PaletteRecordGrouped[]) {
  const sorted = []

  for (const t of types) {
    t.records = []

    for (const g of t.groups) {
      g.record.palette = t

      for (const m of g.methods) {
        t.records.push({
          ...g.record,
          ...m
        })

        m.method = <Method>SORTING_METHODS.find((sm: any) => sm.mid === m.method.mid)
      }
    }

    sorted.push(...t.records)
  }

  sorted.sort((a, b) => a.index - b.index)

  return { sorted, types }
}
