import { test } from 'vitest'
import { PALETTES } from '@/palettes.js'
import { SORTING_METHODS } from '@/lib/index.js'

test('bench', () => {
  const entries = Object.entries(PALETTES).slice(-1)

  entries.forEach(([key, palette], index) => {
    [...SORTING_METHODS].sort((a, b) => a.speed - b.speed).forEach(({ name, fn, speed }) => {
      const start = performance.now()
      fn(palette)
      const elapsed = performance.now() - start
      
      console.log(speed, name, elapsed)
    })
  })
})
