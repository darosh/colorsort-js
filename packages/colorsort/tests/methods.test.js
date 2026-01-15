import { test, expect } from 'vitest'
import { SORTING_METHODS_RAW } from '../src/sorting-methods/index.ts'
import { randomizer, SORTING_METHODS } from '../src/index.ts'
import { metricsHilbert } from '../src/metrics-hilbert.ts'
import { extreme2, extreme2half } from './fixtures.ts'

test('check methods', () => {
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

test('metricsHilbert', () => {
  // const x= metricsHilbert(PALETTES['palette-55'])
  // console.log(x)
  // const y= metricsHilbert(PALETTES.spectral)
  // console.log(y)
})

const pause = () => new Promise((resolve) => setTimeout(resolve, 0))
const rand = randomizer()
const colorsOriginal = [...extreme2half]
const colorsSorted = [...colorsOriginal].sort()
const colorsRandomized = [...colorsOriginal].sort((a,b) => rand() - .5)
const FILTER = 'HARM'
const methods = SORTING_METHODS.filter(m => FILTER ? m.mid.startsWith(FILTER) : true)

for (const m of methods) {
  test(`sort consistent ${m.mid}`, async () => {
    const originalResult = m.fn([...colorsSorted])
    const copyResult = m.fn([...colorsSorted])
    await pause()
    expect(copyResult).toEqual(originalResult)
  })
}

for (const m of methods) {
  test(`sort independent ${m.mid}`, async () => {
    const originalResult = m.fn([...colorsOriginal])
    const randomResult = m.fn([...colorsRandomized])
    await pause()
    expect(randomResult).toEqual(originalResult)
  })
}
