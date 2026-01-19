import { test } from 'vitest'

import { Vector3 } from '../src/vector.ts'

import {
  extractSpectralFeatures, sortByChromaWave, sortBySpectralGuidance,
  sortBySpectralSmoothness,
  sortBySpectralTemplate
} from '../src/sorting-methods/spectral.ts'

test('spectral', () => {
// Example 1: Reference palette with multi-ramp structure (Blue + Orange)
  const referenceMultiRamp: Vector3[] = [
    [0.45, 0.15, 220], [0.55, 0.18, 230], [0.65, 0.14, 240],
    [0.70, 0.20, 35], [0.60, 0.22, 40], [0.50, 0.18, 45]
  ]

// Example 2: Reference palette with smooth single-hue structure
  const referenceSmoothBlue: Vector3[] = [
    [0.35, 0.12, 230], [0.45, 0.15, 235], [0.55, 0.18, 240],
    [0.65, 0.20, 245], [0.75, 0.16, 250], [0.85, 0.10, 255]
  ]

// Colors to be sorted (random mix)
  const unsortedColors: Vector3[] = [
    [0.50, 0.20, 10],   // Orange
    [0.60, 0.18, 240],  // Blue
    [0.55, 0.19, 120],  // Green
    [0.45, 0.22, 350],  // Red
    [0.70, 0.15, 230],  // Light Blue
    [0.40, 0.21, 50],   // Yellow-Orange
    [0.65, 0.17, 130],  // Green
    [0.55, 0.20, 250],  // Blue-Purple
    [0.30, 0.01, 0],    // Dark Gray
    [0.80, 0.01, 0]     // Light Gray
  ]

  console.log('=== Spectral-Guided Color Sorting Examples ===\n')

// Extract features from references
  const featuresMultiRamp = extractSpectralFeatures(referenceMultiRamp)
  const featuresSmoothBlue = extractSpectralFeatures(referenceSmoothBlue)

  console.log('Reference Multi-Ramp Features:')
  console.log(`  Smoothness: ${featuresMultiRamp.smoothness.toFixed(2)}`)
  console.log(`  Complexity: ${featuresMultiRamp.complexity.toFixed(2)}`)
  console.log(`  Dominant Frequencies: ${featuresMultiRamp.dominantFrequencies.join(', ')}`)
  console.log('')

  console.log('Reference Smooth-Blue Features:')
  console.log(`  Smoothness: ${featuresSmoothBlue.smoothness.toFixed(2)}`)
  console.log(`  Complexity: ${featuresSmoothBlue.complexity.toFixed(2)}`)
  console.log(`  Dominant Frequencies: ${featuresSmoothBlue.dominantFrequencies.join(', ')}`)
  console.log('\n' + '='.repeat(60) + '\n')

// Strategy 1: Sort using multi-ramp template
  console.log('Strategy 1: Sorted by Multi-Ramp Template')
  const sorted1 = sortBySpectralTemplate(unsortedColors, featuresMultiRamp)
  sorted1.forEach((c, i) => {
    console.log(`  ${i}: L=${c[0].toFixed(2)} C=${c[1].toFixed(2)} H=${c[2].toFixed(0)}°`)
  })
  console.log('')

// Strategy 2: Sort using smooth template
  console.log('Strategy 2: Sorted by Smooth-Blue Template')
  const sorted2 = sortBySpectralSmoothness(unsortedColors, featuresSmoothBlue)
  sorted2.forEach((c, i) => {
    console.log(`  ${i}: L=${c[0].toFixed(2)} C=${c[1].toFixed(2)} H=${c[2].toFixed(0)}°`)
  })
  console.log('')

// Strategy 3: Hybrid auto-detection
  console.log('Strategy 3: Hybrid (Auto-detect from Multi-Ramp)')
  const sorted3 = sortBySpectralGuidance(unsortedColors, referenceMultiRamp)
  sorted3.forEach((c, i) => {
    console.log(`  ${i}: L=${c[0].toFixed(2)} C=${c[1].toFixed(2)} H=${c[2].toFixed(0)}°`)
  })
  console.log('')

  console.log('Strategy 4: Hybrid (Auto-detect from Smooth-Blue)')
  const sorted4 = sortBySpectralGuidance(unsortedColors, referenceSmoothBlue)
  sorted4.forEach((c, i) => {
    console.log(`  ${i}: L=${c[0].toFixed(2)} C=${c[1].toFixed(2)} H=${c[2].toFixed(0)}°`)
  })
  console.log('\n' + '='.repeat(60) + '\n')

// Example 5: Create a reference with chroma oscillation
  const referenceChromaWave: Vector3[] = [
    [0.50, 0.25, 0],    // High chroma red
    [0.55, 0.10, 30],   // Low chroma orange
    [0.60, 0.22, 60],   // High chroma yellow
    [0.65, 0.08, 90],   // Low chroma yellow-green
    [0.70, 0.20, 120],  // High chroma green
  ]

  const featuresChromaWave = extractSpectralFeatures(referenceChromaWave)
  console.log('Reference Chroma-Wave Features:')
  console.log(`  Smoothness: ${featuresChromaWave.smoothness.toFixed(2)}`)
  console.log(`  Chroma Pattern (first 3): ${featuresChromaWave.chromaPattern.slice(0, 3).map(x => x.toFixed(2)).join(', ')}`)
  console.log('')

  console.log('Strategy 5: Sorted by Chroma Wave')
  const sorted5 = sortByChromaWave(unsortedColors, featuresChromaWave)
  sorted5.forEach((c, i) => {
    console.log(`  ${i}: L=${c[0].toFixed(2)} C=${c[1].toFixed(2)} H=${c[2].toFixed(0)}°`)
  })
})
