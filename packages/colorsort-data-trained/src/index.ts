import stringify from 'json-stringify-pretty-compact'
import SORTED from 'colorsort-data-sorted/sorted.json' with { type: 'json' }
import { deserialize, type PaletteRecordGrouped } from 'colorsort-compute'
import { compareColors, fingerprintAverage, MASTER_LCH, metricsFftFingerprint } from 'colorsort'

export interface Trained {
  mid: string
  colors: number
  fingerprint?: number[]
  fingerprints?: number[][]
}

export async function getTrained() {
  const { types } = deserialize(<PaletteRecordGrouped[]>SORTED)
  const result: Trained[] = []

  function add(mid: string, colors: number, fingerprint: number[]) {
    let found = result.find((x) => x.mid === mid && x.colors === colors)

    if (!found) {
      found = { mid, colors, fingerprints: [] }
      result.push(<Trained>found)
    }

    found?.fingerprints?.push(fingerprint)
  }

  for (const type of types) {
    const bestGroup = type.groups.find((g) => g.methods.some((m) => m.best))

    if (!bestGroup) {
      continue
    }

    const colors = (<string[]>bestGroup?.record?.colors || []).map(MASTER_LCH).sort(compareColors)

    if (!colors.length) {
      continue
    }

    const { fingerprint } = metricsFftFingerprint(colors).analysis

    for (const m of bestGroup?.methods?.filter((m) => m.method.mid !== 'Original') || []) {
      add(m.method.mid, colors.length, <number[]>fingerprint)
    }
  }

  for (const r of result) {
    r.fingerprint = fingerprintAverage(<number[][]>r?.fingerprints)
    r.fingerprints = undefined
  }

  return stringify(result, { maxLength: 320 })
}
