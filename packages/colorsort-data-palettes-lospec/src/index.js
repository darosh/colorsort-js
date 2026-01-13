import { readFile } from 'node:fs/promises'
import stringify from 'json-stringify-pretty-compact'

export async function getPalettes() {
  const txt = await readFile('./src/palettes.txt', 'utf8')
  const lines = txt.split('\n').filter((l) => !(l.startsWith('//') || !l))

  const isNum = (s) => Number.parseInt(s, 10).toString() === s

  const arr = lines.map((l) => JSON.parse(l)).map((l) => l.palettes.map((p) => [isNum(p.slug) ? `${p.user.slug}:${p.slug}` : p.slug, p.colors.map((x) => `#${x}`)]))

  const ents = arr.flat().sort((a, b) => a[1].length - b[1].length)

  const obj = Object.fromEntries(ents)
  const serialized = stringify(obj, { maxLength: 3200 })

  return serialized
}
