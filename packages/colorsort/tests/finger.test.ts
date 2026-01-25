import { test } from 'vitest'
import { cosineSimilarity, getAuto, metricsFftFingerprint, oklch } from '../src'
import { fftLch } from '../src/metrics-spectral.ts'
import { fft } from '../src/fft.ts'
import { calculateHueSpread } from '../src/type-detect.ts'

test('ss', () => {
  const o = [
    0.915122210188252,
    0.15907911086910873,
    0.005622233637072038,
    0.0005985254675057183,
    0.13333333333333333,
    0.46579972597569586,
    0.875
  ]
  
  const w = [
    0.915122210188252,
    0.35516450930987553,
    0.005622233637072038,
    0.0005985254675057181,
    0.13333333333333333,
    0.46579972597569586,
    0.875
  ]
  
  const z = [
    0.915122210188252,
    0.35516450930987553,
    0.005622233637072038,
    0.0005985254675057181,
    0.13333333333333333,
    0.46579972597569586,
    0.875
  ]
  
  const ss = cosineSimilarity(o, w)
  console.log(ss)
})

test('calculateHueSpread', () => {
  console.log(calculateHueSpread([0,355,12]))
  
  const s = ["#5b4a68", "#b9d4b4", "#6aae9d", "#f4e9d4", "#37364e", "#355d69", "#d0baa9", "#9e8e91"]
  
  const h = s.map(oklch).map(x => x[2])
  console.log(h)
  console.log(calculateHueSpread(h))
})

test('fft', () => {
  fft([])
  fft([0])
  fft([1,0])
  fft([2,0,0])
})

test('finger', () => {
  const scale = ['#777777', '#7d7277', '#836d77', '#896777', '#8f6277', '#945d77', '#9a5877', '#a05377', '#a64e77', '#ac4877', '#b24378', '#b83e78', '#be3978', '#c43478', '#ca2f78', '#d02978', '#d62478', '#db1f78', '#e11a78', '#e71578', '#ed1078', '#f30a78', '#f90578', '#ff0078']
  const lchColors = scale.map(oklch)
  
  const m = metricsFftFingerprint(lchColors)
  // const m = fftLch(lchColors)
  console.log(m)
})