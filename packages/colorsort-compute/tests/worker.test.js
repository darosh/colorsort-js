import { test, expect } from 'vitest'
import { render } from '@/render.js'
import { PALETTES } from 'colorsort-data-palettes'
import { SORTING_METHODS } from 'colorsort-js'

test('worker', async () => {
  const palette = PALETTES.grayscale
  const sortName = SORTING_METHODS[0].mid
  const result = await render({ sortName, palette })

  result.elapsed = 0
  expect(result).toMatchSnapshot()
})
