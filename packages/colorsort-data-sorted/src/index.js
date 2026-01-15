import { SORTING_METHODS } from 'colorsort'
import { PALETTES } from 'colorsort-data-palettes'
import { computedSerialize, computePlan, computeRender } from 'colorsort-compute'
import { dispose, render } from 'colorsort-compute/src/render.js'
import stringify from 'json-stringify-pretty-compact'

export async function getSorted() {
  let palettes = Object.entries(PALETTES)

  if (process.env.FAST === '1') {
    palettes = palettes.slice(0, 10)
  } else if (process.env.FAST === '2') {
    return null
  }

  let lastLog = Date.now()

  const computed = await computePlan(palettes, SORTING_METHODS, render, ({ progress, progressPalettes }) => {
    const now = Date.now()

    if (progress < 100 && lastLog + 1000 > now) {
      return
    }

    lastLog = now
    console.log(`Rows / Palettes: ${progress.toFixed(2)}% / ${progressPalettes.toFixed(2)}%`)
  })

  // const sorted = [...computed.sorted].sort((a, b) => a.method.speed - b.method.speed)

  const promises = computeRender(computed.sorted)
  await Promise.all(promises)
  const serialized = computedSerialize(computed.types)

  dispose()

  return stringify(serialized, { maxLength: 320 })
}
