import { expect, test } from 'vitest'
import { oklab, oklab2hex } from '@'
import { downsamplePalette, resamplePaletteSnap } from '@/resample.ts'

test('resample-palette', () => {
  const hexes = ['#ff0088', '#ff8800', '#ffffff']
  const labs = hexes.map(oklab)
  const resampled = resamplePaletteSnap(labs, 64)

  const expected = [
    '#ff0088', '#ff1386', '#ff1e84', '#ff2782',
    '#ff2e80', '#ff347d', '#ff397b', '#ff3e79',
    '#ff4276', '#ff4774', '#ff4b72', '#ff4e6f',
    '#ff526c', '#ff556a', '#ff5967', '#ff5c64',
    '#ff5f61', '#ff625e', '#ff655b', '#ff6857',
    '#ff6b54', '#ff6e50', '#ff704c', '#ff7348',
    '#ff7644', '#ff783f', '#ff7b3a', '#ff7d34',
    '#ff802e', '#ff8226', '#ff841c', '#ff8800',
    '#ff8800', '#ff8e26', '#ff9233', '#ff973e',
    '#ff9b48', '#ff9f51', '#ffa359', '#ffa761',
    '#ffab68', '#ffae70', '#ffb277', '#ffb67e',
    '#ffba85', '#ffbe8c', '#ffc192', '#ffc599',
    '#ffc9a0', '#ffcda6', '#ffd0ad', '#ffd4b3',
    '#ffd8b9', '#ffdbc0', '#ffdfc6', '#ffe2cd',
    '#ffe6d3', '#ffead9', '#ffeddf', '#fff1e6',
    '#fff4ec', '#fff8f2', '#fffbf9', '#ffffff'
  ]

  expect(resampled.map(oklab2hex)).toEqual(expected)

  const backconverted = downsamplePalette(resampled, hexes.length)

  expect(backconverted.map(oklab2hex)).toEqual(hexes)
})
