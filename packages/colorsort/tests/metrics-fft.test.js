import { test, expect } from 'vitest'

import { MASTER_LCH, metricsFftFingerprint } from '@'
import { COLORS_GREY, COLORS_LO_DUEL, COLORS_SPECTRAL } from './fixtures/colors.js'

test('metrics-fft-spectral', () => {
  const metrics = metricsFftFingerprint(COLORS_SPECTRAL.map(MASTER_LCH))
  expect(metrics).toMatchSnapshot()
})

test('metrics-fft-duel', () => {
  const metrics = metricsFftFingerprint(COLORS_LO_DUEL.map(MASTER_LCH))
  expect(metrics).toMatchSnapshot()
})

test('metrics-fft-grey', () => {
  const metrics = metricsFftFingerprint(COLORS_GREY.map(MASTER_LCH))
  expect(metrics).toMatchSnapshot()
})
