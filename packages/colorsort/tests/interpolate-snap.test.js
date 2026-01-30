import { test, expect } from 'vitest'
import { snapInterpolator } from '@/resample.ts'

test('interpolate-snap-4', () => {
  const original = [0, 1, 0]
  const t = snapInterpolator(original, 4)
  const resampled = [0, 1, 2, 3].map(t)

  expect(resampled).toEqual([0, 1, 1, 0])
})

test('interpolate-snap-5', () => {
  const original = [0, 1, 0]
  const length = 5
  const t = snapInterpolator(original, length)
  const resampled = Array.from({ length }).map((_, i) => i).map(t)

  expect(resampled).toEqual([0, 0.5, 1, 0.5, 0])
})

test('interpolate-snap-12', () => {
  const original = [0, 1, 0]
  const t = snapInterpolator(original, 12)
  const resampled = Array.from({ length: 12 }).map((_, i) => i).map(t)

  expect(resampled).toEqual([
    0,
    0.18181818181818182,
    0.36363636363636365,
    0.5454545454545454,
    0.7272727272727273,
    1,
    1,
    0.7272727272727273,
    0.5454545454545454,
    0.36363636363636354,
    0.18181818181818166,
    0
  ])
})
