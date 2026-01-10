import { test } from 'vitest'
import { SORTING_METHODS_RAW } from '@/lib/sorting-methods/index.ts'
import { SORTING_METHODS } from '@/lib/index.ts'

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
