import { test, expect } from 'vitest'

import { ORIGINAL, randomizer, SORTING_METHODS } from '@'
import { COLORS_BAD_SCAN, COLORS_EXTREME_2_HALF } from './fixtures/colors.js'

const rand = randomizer()
const COLORS_BAD_SCAN_SORTED = [...COLORS_BAD_SCAN].sort()
const COLORS_BAD_SCAN_RANDOMIZED = [...COLORS_BAD_SCAN].sort((a,b) => rand() - .5)
const COLORS_EXTREME_2_HALF_SORTED = [...COLORS_EXTREME_2_HALF].sort()
const COLORS_EXTREME_2_HALF_RANDOMIZED = [...COLORS_EXTREME_2_HALF].sort((a,b) => rand() - .5)

for (const m of SORTING_METHODS.filter(({mid}) => mid !== ORIGINAL)) {
  if (m.valid && !m.valid(COLORS_BAD_SCAN_SORTED)) {
    test(`stable:${m.mid}`, () => {
      const sorted = m.fn(COLORS_EXTREME_2_HALF_SORTED)
      const sorted_again = m.fn(COLORS_EXTREME_2_HALF_RANDOMIZED)
      expect(sorted).toEqual(sorted_again)
    })
    
    continue
  }

  test(`stable:${m.mid}`, () => {
    const sorted = m.fn(COLORS_BAD_SCAN_SORTED)
    const sorted_again = m.fn(COLORS_BAD_SCAN_RANDOMIZED)
    expect(sorted).toEqual(sorted_again)
  })
}
