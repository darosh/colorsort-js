import { test } from 'vitest'

import Color from 'colorjs.io'
import chroma from 'chroma-js'
import { oklab, rgb } from 'culori'
import { oklab2rgb, rgb2oklab, distanceOk2 } from '@/lib/color.ts'
import { distance } from '@/lib/vector.ts'

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
    const { r, g, b } =rgb(oklab('#abacad'))
    
    return [r * 255, g * 255, b * 255]
  })())
  console.log('direct', oklab2rgb(rgb2oklab([0xab / 255, 0xac / 255, 0xad / 255])).map(x => x * 255))
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
