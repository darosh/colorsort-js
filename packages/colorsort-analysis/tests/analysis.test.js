import {test} from 'vitest'
import { algorithmStats, paletteTypeAnalysis, scatterData, topAlgorithms } from '../src/index.ts'
import DATA  from 'colorsort-data-sorted/sorted.json' with { type: 'json' }

test('algorithmStats', () => {
  const as = algorithmStats(DATA)
  
  console.log(as[0])

  const top = topAlgorithms(as, 5)
  
  console.log(top)
})

test('paletteTypeAnalysis', () => {
  const ta = paletteTypeAnalysis(DATA)
  
  console.log(ta)
})

test('scatterData', () => {
  const sd = scatterData(DATA, 'Original')
  
  console.log(sd)
})
