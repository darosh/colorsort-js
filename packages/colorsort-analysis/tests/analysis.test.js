import { test, expect } from 'vitest'
import { algorithmStats, paletteTypeAnalysis, scatterData, topAlgorithms } from '../src/index.ts'
import DATA from 'colorsort-data-sorted/sorted.json' with { type: 'json' }

test('algorithmStats', () => {
  const as = algorithmStats(DATA)
  expect(as[0]).toMatchSnapshot()
  
  const top = topAlgorithms(as, 5)
  expect(top).toMatchSnapshot()
})

test('paletteTypeAnalysis', () => {
  const ta = paletteTypeAnalysis(DATA)
  expect(ta).toMatchSnapshot()
})

test('scatterData', () => {
  const sd = scatterData(DATA, 'Original')
  expect(sd).toMatchSnapshot()
})
