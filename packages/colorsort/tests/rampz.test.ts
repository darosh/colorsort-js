import { test, expect } from 'vitest'
import { kmeans } from 'ml-kmeans'
import { oklch } from '../src'
import { sortMultiRampPalette2 } from './rampi.test.ts'  // your oklch function

// Helper: squared Euclidean distance (common default for kmeans)
function squaredEuclidean (a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i]
    sum += diff * diff
  }
  return sum
}

export function estimateNumRampsByClustering (colors: string[], maxK = 8): {
  suggestedK: number;
  ramps: string[][];
  qualities: { k: number; inertia: number }[];
} {
  const colorInfos = colors.map(hex => {
    const lch = oklch(hex)
    // Use a,b from OKLCH (chroma-polar projection) for clustering
    // This groups similar hues/chromas ignoring lightness
    const ab = [
      lch[1] * Math.cos(lch[2] * Math.PI / 180),
      lch[1] * Math.sin(lch[2] * Math.PI / 180)
    ]
    return { hex, lch, ab }
  })

  const points = colorInfos.map(c => c.ab) // 2D points [a approx, b approx]

  const qualities: { k: number; inertia: number }[] = []

  for (let k = 1; k <= Math.min(maxK, colors.length); k++) {
    const result = kmeans(points, k, {
      seed: 42,                  // for reproducibility
      initialization: 'kmeans++',
      maxIterations: 100,
    })

    // Manually compute inertia = sum of squared distances to assigned centroid
    let inertia = 0
    for (let i = 0; i < points.length; i++) {
      const clusterIdx = result.clusters[i]
      const centroid = result.centroids[clusterIdx]
      inertia += squaredEuclidean(points[i], centroid)
    }

    qualities.push({ k, inertia })
  }

  // Elbow detection: find largest drop in inertia
  let bestK = 1
  let maxDrop = -Infinity

  for (let i = 1; i < qualities.length; i++) {
    const drop = qualities[i - 1].inertia - qualities[i].inertia
    // You can also try relative drop: drop / qualities[i-1].inertia
    if (drop > maxDrop) {
      maxDrop = drop
      bestK = qualities[i].k
    }
  }

  // Re-cluster with the chosen k to build ramps
  const finalResult = kmeans(points, bestK, {
    seed: 42,
    initialization: 'kmeans++',
    maxIterations: 100,
  })

  const groups: typeof colorInfos[] = Array.from({ length: bestK }, () => [])
  colorInfos.forEach((info, idx) => {
    groups[finalResult.clusters[idx]].push(info)
  })

  const ramps = groups.map(group =>
    group.sort((a, b) => a.lch[0] - b.lch[0])  // sort each ramp by lightness
      .map(c => c.hex)
  )
  
  return {
    suggestedK: bestK,
    ramps,
    qualities,  // you can log/inspect this array to see the elbow curve
  }
}

// After building ramps (array of arrays of hex strings)
// and assuming you have oklch(hex) → [L, C, H]

function separateAccents(ramps: string[][], colors: string[]): string[][] {
  // Find colors that "feel" like vivid accents
  const accentCandidates = colors.filter(hex => {
    const [, C, ] = oklch(hex);
    const L = oklch(hex)[0];
    return C > 0.14 || (C > 0.10 && L > 70);  // ← this catches #a7ffeb
  });

  if (accentCandidates.length < 3) return ramps; // no clear accent group

  // Sort accents by lightness
  accentCandidates.sort((a, b) => oklch(a)[0] - oklch(b)[0]);

  // Remove them from existing ramps
  const cleanedRamps = ramps.map(ramp =>
    ramp.filter(h => !accentCandidates.includes(h))
  );

  // Add a dedicated accent ramp (or replace the smallest/vividest one)
  const finalRamps = cleanedRamps.filter(r => r.length > 0);
  finalRamps.push(accentCandidates);

  // Optional: sort all ramps by average hue or first color's hue
  finalRamps.sort((a, b) => oklch(a[0])[2] - oklch(b[0])[2]);

  return finalRamps;
}

test('rampz', () => {
// Example usage
  const palette = [
    '#004d40', '#00695c', '#00796b', '#00897b', '#009688', '#26a69a', '#4db6ac', '#80cbc4', '#b2dfdb', '#e0f2f1', 
    '#00bfa5', '#1de9b6', '#64ffda', '#a7ffeb'
  ]

  const estimate = estimateNumRampsByClustering([...palette].sort(() => Math.random() - .5), 3)

  const separated = separateAccents(estimate.ramps, palette)
  
  console.log(separated)
  // expect(sorted).toEqual(palette)
})

