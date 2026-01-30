import { SORTING_METHODS, roundAll } from 'colorsort-js'
import { PALETTES } from 'colorsort-data-palettes'
import { computedSerialize, computePlan, computeRender } from 'colorsort-compute'
import { dispose, render } from 'colorsort-compute/src/render.js'
import stringify from 'json-stringify-pretty-compact'

export async function getSorted() {
  let palettes = Object.entries(PALETTES)

  if (process.env.FAST === '1') {
    palettes = palettes.slice(0, 10)
    console.log(`Using ${palettes.length} palettes`)
  } else if (process.env.FAST === '2') {
    console.log(`Skipping processing!`)
    return null
  } else {
    console.log(`Using ${palettes.length} palettes`)
  }

  let lastLog = Date.now()

  const computed = await computePlan(palettes, SORTING_METHODS, render, ({ progress, progressPalettes }) => {
    const now = Date.now()

    if (progress < 100 && lastLog + 1000 > now) {
      return
    }

    lastLog = now
    console.log(`Rows / Palettes: ${progress.toFixed(2)}% / ${progressPalettes.toFixed(2)}%`, render.stats())
  })

  console.log(`Compute plan ${computed.sorted.length} records`)

  // const sorted = [...computed.sorted].sort((a, b) => a.method.speed - b.method.speed)

  const promises = computeRender(computed.sorted)

  await Promise.all(promises)

  console.log(`Compute plan processed`)

  const serialized = computedSerialize(computed.types)

  for (const s of serialized) {
    for (const g of s.groups) {
      g.record.metrics = roundAll(g.record.metrics)
      g.record.quality = roundAll(g.record.quality)
    }
  }

  dispose()

  return stringify(serialized, { maxLength: 320 })
}
