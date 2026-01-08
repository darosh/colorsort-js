import { test } from 'vitest'
import { harmonizeModel } from '@/lib/sorting-methods/harmonize.ts'
import { PALETTES } from '@/palettes.js'



test('harmonize', () => {
  const x = harmonizeModel(PALETTES['helix-1'], 'hsv', 'dark')
  
  console.log(x)
})
