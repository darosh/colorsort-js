import { test } from 'vitest'
import { writeFile } from 'node:fs/promises'
import stringify from 'json-stringify-pretty-compact'
import { PALETTES } from '@/palettes.js'
import { SORTING_METHODS } from '@/lib/index.js'
import { computedSerialize, computePlan, computeRender } from '@/lib/compute.ts'

test('compute', async () => {
  const palettes = Object.entries(PALETTES)
  
  const computed = await computePlan(palettes, SORTING_METHODS, ({done, progress, progressPalettes}) => {
    console.log(`Rows / Rows % / Palettes %: ${done} / ${progress.toFixed(2)}% / ${progressPalettes.toFixed(2)}%`)
  })
  
  const promises = computeRender(computed.sorted)
  await Promise.all(promises)
  const serialized = computedSerialize(computed)
  await writeFile('./data-sorted.json', stringify(serialized.sorted, { maxLength: 320 }))
  await writeFile('./data-types.json', stringify(serialized.types, { maxLength: 320 }))
})
