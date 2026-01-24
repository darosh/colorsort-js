import FFT from 'fft.js'
import { resampleLinear } from './resample.ts'

export function fft(numbers: number[]) {
  const size = Math.pow(2, Math.ceil(Math.log(numbers.length) / Math.log(2)))
  const values = numbers.length < size ? resampleLinear(numbers, size) : numbers

  const ff = new FFT(size)
  const spectrum: number[] = ff.createComplexArray()
  ff.realTransform(spectrum, values)
  // ff.completeSpectrum(spectrum)
  return spectrum
}

export function half(spectrum: number[]) {
  return spectrum.slice(2, Math.floor(spectrum.length / 2))
}

export function magnitude(half: number[]) {
  return Array.from({ length: half.length / 2 }).map((_, i) => Math.sqrt(half[i] ** 2 + half[i + 1] ** 2))
}
