import { test, expect } from 'vitest'

import { oklch } from '../src'
import { applySpectralEQ } from '../src/spectral-edit.ts'
import { oklab2oklch, oklch2hex, oklch2oklab } from '../src/color.ts'
import { downsamplePalette, resamplePalette } from '../src/resample.ts'

import FFT from 'fft.js'

test('convert a', () => {
  const a = '#ef7d57'
  const b = oklch(a)
  const c = oklch2hex(b)
  
  console.log({a, b, c})
})

test('convert b', () => {
  const hex = '#ef7d57'
  const oklch_1 = oklch(hex)
  const oklab_ = oklch2oklab(oklch_1)
  const oklch_2 = oklab2oklch(oklab_)
  
  console.log({
    hex,
    oklch_1,
    oklab_,
    oklch_2
  })
})

test('spectral-eq', () => {
  const lo_sweetie_16_Original = ['#ff0088', '#ff8800', '#ffffff']
  const colorsIn = lo_sweetie_16_Original.map(oklch)

  const colorsOut = applySpectralEQ(colorsIn, {
    lowGain: 1,   // Boost smooth transitions
    midGain: 1,   // Reduce medium changes
    highGain: 1
  }).map(oklch2hex)

  expect(colorsOut).toEqual(lo_sweetie_16_Original)
  console.log(colorsOut)
})

test('downsamplePalette', () => {
  const hexes = ['#ff0088', '#ff8800', '#ffffff']
  const colorsIn = hexes.map(oklch)

  const resampled = resamplePalette(colorsIn, 11)
  
  const expected = [
    '#ff0088', '#ff3a7a',
    '#ff546b', '#ff6858',
    '#ff793e', '#ff8800',
    '#ffa257', '#ffba86',
    '#ffd2af', '#ffe9d7',
    '#ffffff'
  ]
  
  expect(resampled.map(oklch2hex)).toEqual(expected)

  const ds = downsamplePalette(resampled, hexes.length)

  expect(ds.map(oklch2hex)).toEqual(hexes)
})

test('downsamplePalette 256', () => {
  const hexes = ['#ff0088', '#ff8800', '#ffffff']
  const colorsIn = hexes.map(oklch)

  const resampled = resamplePalette(colorsIn, 256)
  
  const ds = downsamplePalette(resampled, hexes.length)

  expect(ds.map(oklch2hex)).toEqual(hexes)
})

test('fft-ifft', () => {
  const original = Array.from({length: 256}, (_, i) => i);

  const ff = new FFT(256);

// 1. Prepare input & output buffers
  const inputReal = new Float64Array(original);          // or Float32Array
  const complexSpectrum = ff.createComplexArray();       // length 512 (256*2 interleaved)

// 2. Forward real FFT (fills only first half + symmetry)
  ff.realTransform(complexSpectrum, inputReal);

  // 3. Optional: fill negative frequencies (needed for inverse to work correctly)
  ff.completeSpectrum(complexSpectrum);

  // 4. Prepare output buffer for inverse (must be pre-allocated!)
  const reconstructedComplex = ff.createComplexArray();           // ← key fix: pre-allocate!

  // 5. Inverse
  ff.inverseTransform(reconstructedComplex, complexSpectrum);

  // 6. Convert back to regular array if needed
  const reconArray = reconstructedComplex.filter((_, index) => index % 2 === 0)

  console.log("max diff:", Math.max(...original.map((v, i) => Math.abs(v - reconArray[i]))));

// Optional: check a few values
  console.log("first few complex:", complexSpectrum.slice(0,5));
  console.log("first few recon:", reconArray.slice(0,5));
  console.log("last few recon:", reconArray.slice(-5));
})