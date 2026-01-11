import { test } from 'vitest'
import { SORTING_METHODS_RAW } from '@/lib/sorting-methods/index.ts'
import { SORTING_METHODS } from '@/lib/index.ts'
import { metricsHilbert } from '@/lib/metrics-hilbert.ts'
import { PALETTES } from '@/palettes.js'

test('check methods', () => {
  function check (arr, set) {
    const ns = new Set(arr.map((a) => a.name))
    const is = new Set(arr.map((a) => a.mid))

    if (ns.size !== arr.length) {
      throw new Error(`Duplicated ${set} name`)
    }

    if (is.size !== arr.length) {
      throw new Error(`Duplicated ${set} mid`)
    }
  }

  check(SORTING_METHODS_RAW, 'raw')
  check(SORTING_METHODS, 'sorting')
})

test('metricsHilbert', () => {
  const x= metricsHilbert(PALETTES['palette-55'])
  console.log(x)
  const y= metricsHilbert(PALETTES.spectral)
  console.log(y)
})