import sorted from '../data-sorted.json' with { type: 'json' }
import types from '../data-types.json' with { type: 'json' }

import { PaletteRecord, SortRecord } from './lib/compute.ts'

export function deserialize(sorted: SortRecord[], types: PaletteRecord[]) {
  for (const r of sorted) {
    const p = types[r.palette.index]
    r.palette = p
    p.records = p.records || []
    p.records.push(r)
  }

  return { sorted, types }
}

export const COMPUTED = deserialize(<SortRecord[]>(<unknown>sorted), <PaletteRecord[]>(<unknown>types))
