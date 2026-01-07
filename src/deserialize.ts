import types from '../data.json' with { type: 'json' }
import { PaletteRecordGrouped } from './lib/compute.ts'
//@ts-ignore
import { SORTING_METHODS } from '@/lib'

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

        m.method = SORTING_METHODS.find((sm: any) => sm.mid === m.method.mid)
      }
    }

    sorted.push(...t.records)
  }

  sorted.sort((a, b) => a.index - b.index)

  return { sorted, types }
}

export const COMPUTED = deserialize(<PaletteRecordGrouped[]>(<unknown>types))
