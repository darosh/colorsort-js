import { test } from 'vitest'
import { render } from '@/render.js'
import { PALETTES } from '@/palettes.js'
import { SORTING_METHODS } from '@/lib/index.js'

test('worker', async () => {
  const palette = PALETTES.grayscale
  const sortName = SORTING_METHODS[0].name
  
  const result = await render({ sortName, palette })
  
  console.log(result)
})
