import { test } from 'vitest'
import { PALETTES } from '@/palettes.js'
import { SORTING_METHODS } from '@/lib/index.js'
import { writeFile } from 'node:fs/promises'

test('bench', async () => {
  const entries = Object.entries(PALETTES).slice(0, 8)

  const data = {}
  
  entries.forEach(([key, palette], index) => {
    [...SORTING_METHODS].sort((a, b) => a.speed - b.speed).forEach(({ name, fn, speed, mid }) => {
      const start = performance.now()
      fn(palette)
      const elapsed = performance.now() - start
      
      const id = mid.replace(/:\[.+]/, '')
      
      data[id] = data[id] || { count: 0, elapsed: 0}
      data[id].count++
      data[id].elapsed += elapsed
      
      // console.log(speed, name, elapsed)
    })
  })
  
  const t = Object.entries(data).map(([key, value]) => [key, Math.round(Math.log10(1 + 1000 * value.elapsed / value.count))]).sort((a, b) => a[1] - b[1])
  const b = Object.fromEntries(t)
  
  console.log(b)
  
  await writeFile('./bench.json', JSON.stringify(b, null, 2))
})
