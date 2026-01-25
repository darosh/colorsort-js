import { round3 } from './statistics.ts'

export { SORTING_METHODS } from './sorting-methods/index.ts'
export type { SortingMethod } from './sorting-methods/index.ts'
export { metrics } from './metrics.js'
export { detectPaletteType } from './type-detect.ts'
export type { PaletteType } from './type-detect.ts'

export { metricsEx, getMetricsExRange, metricsExQuality, metricsExQualitySum } from './metrics-extended.ts'
export type { MetricsEx } from './metrics-extended.ts'
export { flatRgb, oklab, oklch, gl, lch, lab, normalizeLab, oklch2hex, oklab2hex, oklch2oklab } from './color.ts'

export { randomizer } from './randomizer.ts'

export { metricsFftFingerprint } from './metrics-fft.ts'
export { cosineSimilarity } from './similarity.ts'
export { featuresLab } from './metrics-spectral.ts'
export { compareSpectralFeatures } from './metrics-spectral-similarity.ts'

export type { Fingerprint } from './metrics-fft.ts'
export type { StatsLabEx, MagnitudesLab } from './metrics-spectral.ts'

export { applySpectralProcessing } from './spectral-edit.ts'

export { fingerprintAverage } from './similarity.ts'
export { compareColors } from './vector.ts'
export { getAuto } from './auto.ts'

import { lch } from './color.ts'

export const MASTER_LCH = lch
export const MASTER_ROUND = round3
