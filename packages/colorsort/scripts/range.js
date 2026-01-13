import { COLOR_TYPES, convertColors, nonH } from '../src/color.ts'
import { writeFile } from 'node:fs/promises'

const extreme2 = ((extremes) => extremes.flatMap((r) => extremes.flatMap((g) => extremes.map((b) => `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`))))([0x00, 0x01, 0x7f, 0x80, 0xfe, 0xff])

const table = [
  ['model', 'x', 'y', 'z'],
  ['---', '---', '---', '---']
]

function f (n) {
  if (Math.round(n) !== n) {
    return n.toFixed(2)
  }

  return n
}

for(const t of Object.values(COLOR_TYPES)) {
  const x = convertColors(extreme2, t)

  if (!Array.isArray(x[0][0])) {
    continue
  }

  const mm = x[0][0].map((_,i) => [
    f(Math.min(...x.map(a => a[0][i]).filter(x => !nonH(x)))),
    f(Math.max(...x.map(a => a[0][i]).filter(x => !nonH(x)))),
    x.map(a => a[0][i]).filter(x => nonH(x)).map(z => {
      if (z === undefined) {
        return 'undefined'
      } else if (z === null) {
        return  'null'
      } else if (z === Number.NaN) {
        return  'NaN'
      }
    }).reduce((acc, item) => {
      if (!acc.includes(item)) {
        acc.push(item)
      }

      return acc
    }, [])
  ])
    .map(x => !x[2]?.length ? x.slice(0,2) : x)
    // .map(x => x.map(y => y === true ? 'NaN' : y))
    .map(x => x.join('..'))

  table.push([t, ...mm])
}

const str = table.map(r => `|${r.join('|')}|`).join('\n')

await writeFile('./data/RANGE.md', str)
