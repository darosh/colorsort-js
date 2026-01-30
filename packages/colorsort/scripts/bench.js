import chroma from 'chroma-js'
import { isValidMethodId, SORTING_METHODS } from '../src/index.ts'
import { writeFile } from 'node:fs/promises'

const palettes = [
  chroma.scale('YlGn').colors(12),
  chroma.scale('YlGn').gamma(0.25).colors(13).slice(1),
  chroma.cubehelix().scale().colors(16),
  chroma.cubehelix().scale().correctLightness().colors(16),
  chroma.cubehelix().rotations(6).scale().colors(24),
  chroma.cubehelix().rotations(3).scale().correctLightness().colors(64),
  chroma.scale(['#fafa6e', '#2A4858']).mode('lch').colors(6),
  chroma.scale(['blue', 'pink']).mode('oklch').colors(8),
]

const data = {}

for (const palette of palettes) {
  const methods = [...SORTING_METHODS].sort((a, b) => a.speed - b.speed)

  for (const { fn, speed, mid } of methods) {
    const start = performance.now()

    if (!isValidMethodId(mid, palette)) {
      continue
    }

    fn(palette)
    const elapsed = performance.now() - start

    const id = mid.replace(/:\[.+]/, '')

    data[id] = data[id] || { count: 0, elapsed: 0 }
    data[id].count++
    data[id].elapsed += elapsed
  }
}

const t = Object.entries(data).map(([key, value]) => [key, Math.round(Math.log10(1 + 1000 * value.elapsed / value.count))]).sort((a, b) => a[1] - b[1])
const sum = t.reduce((acc, [, val]) => acc + val, 0)

t.push(['_TOTAL', sum])

const b = Object.fromEntries(t)

await writeFile('./data/bench.json', JSON.stringify(b, null, 2))
