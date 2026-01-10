import { test } from 'vitest'
import { readFile } from 'node:fs/promises'
import stringify from 'json-stringify-pretty-compact'
import { PALETTES } from '@/palettes.js'

test('palettes', async () => {
  const txt = await readFile('./tests/palettes.txt', 'utf8')
  const lines = txt.split('\n').filter(l => !(l.startsWith('//') || !l))

  const isNum = s => Number.parseInt(s, 10).toString() === s

  const arr = lines
    .map(l => JSON.parse(l))
    .map(l => l.palettes.map(p => [isNum(p.slug) ? `${p.user.slug}:${p.slug}` : p.slug, p.colors.map(x => `#${x}`)]))

  const ents = arr.flat()
    .sort((a, b) => a[1].length - b[1].length)

  const obj = Object.fromEntries(ents)
  const serialized = stringify(obj, { maxLength: 3200 })

  // console.log(obj)

  // await writeFile('./palettes.json', serialized)
})

for (const [key, colors] of Object.entries(PALETTES)) {
  test(`unique ${key}`, () => {
    if (colors.length !== new Set(colors).size) {
      throw `${key} is not unique`
    }
  })
}
