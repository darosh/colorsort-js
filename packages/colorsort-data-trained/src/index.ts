import stringify from 'json-stringify-pretty-compact'
import SORTED from 'colorsort-data-sorted/sorted.json' with { type: 'json' }
import { deserialize, type PaletteRecordGrouped } from 'colorsort-compute'
import {
  compareColors,
  // fingerprintAverage,
  // fingerprintMedian,
  fingerprintAverageWithoutOutliers,
  MASTER_LCH,
  MASTER_ROUND,
  metricsFftFingerprint
} from 'colorsort-js'

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
      // if (colors.length < 12 && m.method.mid.startsWith('RAMP')) {
      //   continue
      // }

      // if (colors.length < 64 && m.method.mid.startsWith('RAW')) {
      //   continue
      // }

      add(m.method.mid, colors.length, <number[]>fingerprint)
    }
  }

  for (const r of result) {
    // r.fingerprint = fingerprintAverage(<number[][]>r?.fingerprints).map(MASTER_ROUND)
    // r.fingerprint = fingerprintMedian(<number[][]>r?.fingerprints).map(MASTER_ROUND)
    r.fingerprint = fingerprintAverageWithoutOutliers(<number[][]>r?.fingerprints).map(MASTER_ROUND)
    r.fingerprints = undefined
  }

  return stringify(result, { maxLength: 320 })
}
