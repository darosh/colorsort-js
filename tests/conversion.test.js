import { test } from 'vitest'

import Color from 'colorjs.io'
import chroma from 'chroma-js'
import { formatHex, oklab, rgb } from 'culori'
import { COLOR_TYPES, convertColors, lch, nonH, oklch } from '@/lib/color.ts'
import { distance } from '@/lib/vector.ts'
import { Poline, positionFunctions } from 'poline'
import { PALETTES } from '@/palettes.js'
import { distanceOk2, oklab2rgb, rgb2oklab } from '@/lib/color-oklab.ts'
import { calculateHueSpread } from '@/lib/type-detect.ts'
import { writeFile } from 'node:fs/promises'

export function timed (fn) {
  const start = performance.now()
  const result = fn()
  const elapsed = performance.now() - start
  return { result, elapsed }
}

test('oklab conversion', () => {
  console.log('Conversion', '='.repeat(20))

  console.log('cio', new Color('#abacad').to('oklab').toString())
  console.log('cio', new Color('#abacad').to('oklab').coords)
  console.log('chroma', chroma('#abacad').oklab())
  console.log('culori', oklab('#abacad'))
  console.log('direct', rgb2oklab([0xab / 255, 0xac / 255, 0xad / 255]))

  console.log('Back Conversion', '='.repeat(20))

  console.log('cio', new Color('#abacad').to('oklab').to('srgb').coords.map(x => x * 255))
  console.log('chroma', chroma.oklab(chroma('#abacad').oklab()).gl().map(x => x * 255))
  console.log('culori', (() => {
    const { r, g, b } = rgb(oklab('#abacad'))

    return [r * 255, g * 255, b * 255]
  })())
  console.log('direct', oklab2rgb(rgb2oklab([0xab / 255, 0xac / 255, 0xad / 255])).map(x => x * 255))

  const poline = new Poline({
    anchorColors: [
      [20, 0.42, 0.18],
      [162, 0.90, 0.86]
    ],
    numPoints: 10,
    positionFunctionX: positionFunctions['smoothStepPosition'],
    positionFunctionY: positionFunctions['sinusoidalPosition'],
    positionFunctionZ: positionFunctions['quarticPosition'],
    invertedLightness: true,
  })

  const hexColors = poline.colors.map(([h, s, l]) => formatHex({ mode: 'okhsl', h, s, l }))

  console.log('poline', hexColors)
  console.log('poline-1', PALETTES['poline-1'])
  console.log('poline-2', PALETTES['poline-2'])
  console.log('poline-3', PALETTES['poline-3'])
})

test('oklab performance', () => {
  console.log('Performance', '='.repeat(20))

  console.log('cio', timed(() => {
    for (let i = 0; i < 1000; i++) {
      new Color('#abacad').to('oklab').to('srgb').coords.map(x => x * 255)
    }
  }).elapsed)

  console.log('chroma', timed(() => {
    for (let i = 0; i < 1000; i++) {
      chroma.oklab(chroma('#abacad').oklab()).gl().map(x => x * 255)
    }
  }).elapsed)

  console.log('culori', timed(() => {
    for (let i = 0; i < 1000; i++) {
      rgb(oklab('#abacad'))
    }
  }).elapsed)

  console.log('direct', timed(() => {
    for (let i = 0; i < 1000; i++) {
      oklab2rgb(rgb2oklab([0xab / 255, 0xac / 255, 0xad / 255])).map(x => x * 255)
    }
  }).elapsed)
})

test('distance', () => {
  const A = '#abacad'
  const B = '#adacab'

  const a = rgb2oklab([0xab / 255, 0xac / 255, 0xad / 255])
  const b = rgb2oklab([0xad / 255, 0xac / 255, 0xab / 255])

  console.log('direct euc', distance(a, b))
  console.log('direct ok2', distanceOk2(a, b))

  console.log('chroma gl', chroma.distance(A, B, 'gl'))
  console.log('chroma rgb', chroma.distance(A, B, 'rgb'))
  console.log('chroma lab', chroma.distance(A, B, 'lab'))
  console.log('chroma oklab', chroma.distance(A, B, 'oklab'))
  console.log('chroma delta e', chroma.deltaE(A, B))
  console.log('chroma lch', chroma.distance(A, B, 'lch')) // 180!

  console.log('cio delta e 2000', Color.deltaE2000(new Color(A), new Color(B)))
  console.log('cio delta e ok', Color.deltaEOK(new Color(A), new Color(B)))
  console.log('cio delta e ok2', Color.deltaEOK2(new Color(A), new Color(B)))
  console.log('cio lab', Color.distance(new Color(A), new Color(B), 'lab'))
  console.log('cio lch', Color.distance(new Color(A), new Color(B), 'lch')) // 180
  console.log('cio rgb', Color.distance(new Color(A), new Color(B), 'srgb'))
})

test('range', async () => {
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
    const x = convertColors(PALETTES['extreme-2'], t)
    
    if (!Array.isArray(x[0][0])) {
      continue
    }
    
    const mm = x[0][0].map((_,i) => [
      f(Math.min(...x.map(a => a[0][i]).filter(x => !nonH(x)))),
      f(Math.max(...x.map(a => a[0][i]).filter(x => !nonH(x)))),
      x.map(a => a[0][i]).some(x => nonH(x))
    ])
      .map(x => !x[2] ? x.slice(0,2) : x)
      .map(x => x.map(y => y === true ? 'NaN' : y))
      .map(x => x.join('..'))
    
    table.push([t, ...mm])
  }
  
  const str = table.map(r => `|${r.join('|')}|`).join('\n')
  
  await writeFile('./RANGE.md', str)
})

test('spread', () => {
  console.log([3,1,0,4], calculateHueSpread([3,1,0,4]))
  console.log([3,1,0,4,359], calculateHueSpread([3,1,0,4,359]))
})

test('lch', () => {
  console.log(lch('#ff0000'))
  console.log(oklch('#ff0000'))
})
