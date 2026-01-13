import { test } from 'vitest'
import { PALETTES } from '../src/index.js'

for (const [key, colors] of Object.entries(PALETTES)) {
  test(`unique ${key}`, () => {
    if (colors.length !== new Set(colors).size) {
      const duplicated = colors.filter(c => colors.filter(d => d === c).length > 1)
      
      throw `${key} is not unique, duplicated colors: ${duplicated.join(', ')}`
    }
  })
}
