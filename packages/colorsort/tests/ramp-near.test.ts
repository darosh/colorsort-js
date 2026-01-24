import { test, expect } from 'vitest'
import { sortColorsByNearestNeighbor } from '../src/sorting-methods/ramp.ts'
import { oklch, oklch2hex } from '../src'

test('rampz', () => {
// Example usage
  const palette = [
    '#004d40', '#00695c', '#00796b', '#00897b', '#009688', '#26a69a', '#4db6ac', '#80cbc4', '#b2dfdb', '#e0f2f1', 
    '#00bfa5', '#1de9b6', '#64ffda', '#a7ffeb'
  ]
  
  const sorted = sortColorsByNearestNeighbor(palette.map(oklch)).map(oklch2hex)
  const reorg = [
    ...sorted.slice(0, sorted.length - 4).reverse(), 
    ...sorted.slice(sorted.length - 4)
  ]

  expect(reorg).toEqual(palette)
})

test('rampz2', () => {
// Example usage
  const palette = ['#311b92', '#4527a0', '#512da8', '#5e35b1', '#673ab7', '#7e57c2', '#9575cd', '#b39ddb', '#d1c4e9', '#ede7f6', '#6200ea', '#651fff', '#7c4dff', '#b388ff']
  
  const sorted = sortColorsByNearestNeighbor(palette.map(oklch)).map(oklch2hex)
  const reorg = [
    ...sorted.slice(0, sorted.length - 4).reverse(), 
    ...sorted.slice(sorted.length - 4)
  ]

  expect(reorg).toEqual(palette)
})

  