import { test } from 'vitest'
import { writeFile } from 'node:fs/promises'
import stringify from 'json-stringify-pretty-compact'
import { PALETTES } from '@/palettes.js'
import { SORTING_METHODS } from '@/lib/index.ts'
import { computedSerialize, computePlan, computeRender } from '@/compute.ts'
import { render } from '@/render.js'

test('compute', async () => {
  const palettes = Object.entries(PALETTES)
  let lastLog = Date.now()
  
  const computed = await computePlan(palettes, SORTING_METHODS, render, ({done, progress, progressPalettes}) => {
    const now = Date.now()
    
    if ((progress < 100) && ((lastLog + 1000) > now)) {
      return
    }
    
    lastLog = now
    console.log(`Rows / Rows % / Palettes %: ${done} / ${progress.toFixed(2)}% / ${progressPalettes.toFixed(2)}%`)
  })
  
  // const sorted = [...computed.sorted].sort((a, b) => a.method.speed - b.method.speed)
  
  const promises = computeRender(computed.sorted)
  await Promise.all(promises)
  const serialized = computedSerialize(computed.types)
  await writeFile('./data.json', stringify(serialized, { maxLength: 320 }))
})
