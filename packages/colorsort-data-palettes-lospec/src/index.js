import { readFile } from 'node:fs/promises'
import stringify from 'json-stringify-pretty-compact'

async function lospec() {
  const txt = await readFile('./src/palettes.txt', 'utf8')
  const lines = txt.split('\n').filter((l) => !(l.startsWith('//') || !l))

  const isNum = (s) => Number.parseInt(s, 10).toString() === s

  const arr = lines.map((l) => JSON.parse(l)).map((l) => l.palettes.map((p) => [isNum(p.slug) ? `${p.user.slug}:${p.slug}` : p.slug, p.colors.map((x) => `#${x}`)]))

  const ents = arr
    .flat()
    .sort((a, b) => a[1].length - b[1].length)
    .map(([k, v]) => [`lo-${k}`, v])

  return Object.fromEntries(ents)
}

async function ok() {
  const txt = await readFile('./src/ok.txt', 'utf8')
  const lines = txt.split('\n').filter((l) => !l.startsWith('//'))

  const ents = lines
    .reduce((acc, line) => {
      const prev = acc.at(-1)

      if (!line.trim() && prev) {
        acc.push([prev[0]])
      } else if (line.startsWith('#')) {
        prev.push(line.slice(0, 7))
      } else {
        acc.push([line])
      }

      return acc
    }, [])
    .filter((arr) => arr.length > 1)
    .map((arr) => [`ok-${arr[0]}-${arr.length - 1}`, arr.slice(1)])

  return Object.fromEntries(ents)
}

export async function getPalettes() {
  const obj = { ...(await lospec()), ...(await ok()) }

  return stringify(obj, { maxLength: 3200 })
}
