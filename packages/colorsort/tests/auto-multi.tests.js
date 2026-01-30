import { expect, test } from 'vitest'

import { multiAuto, normalizeUp } from '@'
import { COLORS_SORTED_1, COLORS_SORTED_2, COLORS_SORTED_3, COLORS_SORTED_4 } from './fixtures/colors.js'
import DATA from '../dist/trained.json' with { type: 'json' }

test('auto-multi', () => {
  const s1 = normalizeUp(multiAuto(COLORS_SORTED_1, DATA)[0].sorted)
  const s2 = normalizeUp(multiAuto(COLORS_SORTED_2, DATA)[0].sorted)
  const s3 = normalizeUp(multiAuto(COLORS_SORTED_3, DATA)[0].sorted)
  const s4 = normalizeUp(multiAuto(COLORS_SORTED_4, DATA)[0].sorted)

  expect(s1).toEqual(COLORS_SORTED_1)
  expect(s2).toEqual(COLORS_SORTED_2)
  expect(s3).toEqual(COLORS_SORTED_3)
  expect(s4).toEqual(COLORS_SORTED_4)
})
