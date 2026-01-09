import { test } from 'vitest'
import { writeFile, readFile } from 'node:fs/promises'
import stringify from 'json-stringify-pretty-compact'
import { SORTING_METHODS_RAW } from '@/lib/sorting-methods/index.ts'
import { SORTING_METHODS } from '@/lib/index.ts'

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

  console.log(obj)

  // await writeFile('./palettes.json', serialized)
})

test('check', () => {
  function check (arr, set) {
    const ns = new Set(arr.map((a) => a.name))
    const is = new Set(arr.map((a) => a.mid))

    if (ns.size !== arr.length) {
      throw new Error(`Duplicated ${set} name`)
    }

    if (is.size !== arr.length) {
      throw new Error(`Duplicated ${set} mid`)
    }
  }

  check(SORTING_METHODS_RAW, 'raw')
  check(SORTING_METHODS, 'sorting')
})
