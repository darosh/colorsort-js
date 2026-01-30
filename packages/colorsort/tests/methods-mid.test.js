import { test, expect } from 'vitest'

import { SORTING_METHODS } from '@'
import { SORTING_METHODS_RAW } from '@/sorting-methods/index.ts'

test(`methods-mid`, () => {
  function check (arr, set) {
    const ids = new Set(arr.map((a) => a.mid)).values().toArray()

    if (ids.length !== arr.length) {
      const duplicates = ids.filter(id => arr.filter(v => v.mid === id).length > 1)

      throw new Error(`Duplicated ${set} mid ${duplicates.join(', ')}`)
    }
  }

  check(SORTING_METHODS_RAW, 'raw')
  check(SORTING_METHODS, 'sorting')
})
