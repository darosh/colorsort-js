import chroma from 'chroma-js'
import { calculateVariances } from '@/variances.js'
import { GeneticAlgorithm } from '@/genetic.js'
import { distance } from '@/vector.ts'
import { oklab } from '@/oklab.js'

function colorGraphSort(colors) {
  const graph = new Map()

  for (let i = 0; i < colors.length; i++) {
    const node = new Set()
    for (let j = 0; j < colors.length; j++) {
      if (i !== j) {
        node.add({
          color: colors[j],
          distance: chroma.deltaE(colors[i], colors[j])
        })
      }
    }
    graph.set(colors[i], node)
  }

  const sortedColors = []
  const visitedColors = new Set()

  function traverse(node) {
    sortedColors.push(node)
    visitedColors.add(node)
    const neighbors = [...graph.get(node)].sort((a, b) => a.distance - b.distance)
    for (const neighbor of neighbors) {
      if (!visitedColors.has(neighbor.color)) {
        traverse(neighbor.color)
      }
    }
  }

  traverse(colors[0])
  return sortedColors
}

function relativeDifference(palette) {
  let sumL = 0,
    sumC = 0,
    sumH = 0

  for (const [L, C, H] of palette) {
    sumL += L
    sumC += C
    sumH += H
  }

  const avgL = sumL / palette.length
  const avgC = sumC / palette.length
  const avgH = sumH / palette.length

  let relativeDifferenceL = 0,
    relativeDifferenceC = 0,
    relativeDifferenceH = 0
  const relativeDifferences = []

  for (const [L, C, H] of palette) {
    const dL = Math.abs(L - avgL) / (L + avgL) || 0
    const dC = Math.abs(C - avgC) / (C + avgC) || 0
    const dH = Math.abs(H - avgH) / (H + avgH) || 0

    relativeDifferenceL += dL
    relativeDifferenceC += dC
    relativeDifferenceH += dH
    relativeDifferences.push(dL + dC + dH)
  }

  return [relativeDifferenceL, relativeDifferenceC, relativeDifferenceH, relativeDifferences]
}

function weightedColorGraphSort(colors) {
  const relativeWeights = relativeDifference(
    colors.map((c) =>
      chroma(c)
        .lch()
        .map((v) => v || 0)
    )
  )

  const graph = new Map()
  for (let i = 0; i < colors.length; i++) {
    const node = new Set()
    for (let j = 0; j < colors.length; j++) {
      if (i !== j) {
        const distance = chroma.deltaE(colors[i], colors[j], relativeWeights[0], relativeWeights[1], relativeWeights[2])
        node.add({ color: colors[j], distance })
      }
    }
    graph.set(colors[i], node)
  }

  const sortedColors = []
  const visitedColors = new Set()

  function traverse(node) {
    sortedColors.push(node)
    visitedColors.add(node)
    const neighbors = [...graph.get(node)].sort((a, b) => a.distance - b.distance)
    for (const neighbor of neighbors) {
      if (!visitedColors.has(neighbor.color)) {
        traverse(neighbor.color)
      }
    }
  }

  traverse(colors[0])
  return sortedColors
}

function weightedColorGraphSort2(colors) {
  function calculateAdaptiveWeights(colors) {
    const variances = calculateVariances(colors)

    // Give MORE weight where there's LESS variance
    // (to make subtle differences more noticeable)
    const total = Math.max(Number.EPSILON, variances.L + variances.C + (variances.H ?? 0))

    return {
      Kl: (total - variances.L) / (2 * total),
      Kc: (total - variances.C) / (2 * total),
      Kh: (total - variances.H) / (2 * total)
    }
  }

  const { Kc, Kh, Kl } = calculateAdaptiveWeights(colors)

  // const relativeWeights = relativeDifference(
  //   colors.map((c) =>
  //     chroma(c)
  //       .lch()
  //       .map((v) => v || 0),
  //   ),
  // )

  const graph = new Map()
  for (let i = 0; i < colors.length; i++) {
    const node = new Set()
    for (let j = 0; j < colors.length; j++) {
      if (i !== j) {
        const distance = chroma.deltaE(
          colors[i],
          colors[j],
          Kl,
          Kc,
          0.5 + Kh
          // relativeWeights[0],
          // relativeWeights[1],
          // relativeWeights[2],
        )
        node.add({ color: colors[j], distance })
      }
    }
    graph.set(colors[i], node)
  }

  const sortedColors = []
  const visitedColors = new Set()

  function traverse(node) {
    sortedColors.push(node)
    visitedColors.add(node)
    const neighbors = [...graph.get(node)].sort((a, b) => a.distance - b.distance)
    for (const neighbor of neighbors) {
      if (!visitedColors.has(neighbor.color)) {
        traverse(neighbor.color)
      }
    }
  }

  traverse(colors[0])
  return sortedColors
}

function solveTSP2Opt(colors) {
  let path = colorGraphSort(colors)
  let improved = true

  while (improved) {
    improved = false
    for (let i = 0; i < path.length - 2; i++) {
      for (let j = i + 1; j < path.length - 1; j++) {
        const d1 = chroma.deltaE(path[i], path[i + 1]) + chroma.deltaE(path[j], path[j + 1])
        const d2 = chroma.deltaE(path[i], path[j]) + chroma.deltaE(path[i + 1], path[j + 1])

        if (d2 < d1) {
          path = [...path.slice(0, i + 1), ...path.slice(i + 1, j + 1).reverse(), ...path.slice(j + 1)]
          improved = true
        }
      }
    }
  }
  return path
}

function pcaSort(colors) {
  const data = colors.map((c) => chroma(c).lab())
  const n = data.length

  // Calculate mean
  const mean = data.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0]).map((v) => v / n)

  // Center the data
  const centered = data.map((p) => [p[0] - mean[0], p[1] - mean[1], p[2] - mean[2]])

  // Compute covariance matrix
  let xx = 0,
    xy = 0,
    xz = 0,
    yy = 0,
    yz = 0,
    zz = 0
  for (const [x, y, z] of centered) {
    xx += x * x
    xy += x * y
    xz += x * z
    yy += y * y
    yz += y * z
    zz += z * z
  }

  // Power iteration for principal component
  let vec = [1, 1, 1]
  for (let iter = 0; iter < 20; iter++) {
    const r = [xx * vec[0] + xy * vec[1] + xz * vec[2], xy * vec[0] + yy * vec[1] + yz * vec[2], xz * vec[0] + yz * vec[1] + zz * vec[2]]
    const mag = Math.hypot(...r)
    vec = r.map((v) => v / mag)
  }

  // Project and sort
  return colors
    .map((c, i) => ({
      color: c,
      score: centered[i][0] * vec[0] + centered[i][1] * vec[1] + centered[i][2] * vec[2]
    }))
    .sort((a, b) => a.score - b.score)
    .map((p) => p.color)
}

function computeOKLabStats(colors) {
  const labs = colors.map((c) => oklab(c))
  const n = labs.length

  const mean = labs.reduce((acc, l) => [acc[0] + l[0], acc[1] + l[1], acc[2] + l[2]], [0, 0, 0]).map((v) => v / n)

  const variance = labs.reduce((acc, l) => [acc[0] + (l[0] - mean[0]) ** 2, acc[1] + (l[1] - mean[1]) ** 2, acc[2] + (l[2] - mean[2]) ** 2], [0, 0, 0])

  return variance.map((v) => Math.sqrt(v / n) || 1e-6)
}

function adaptiveOKLabDistanceFactory(colors) {
  const σ = computeOKLabStats(colors)
  return (a, b) => {
    const A = oklab(a)
    const B = oklab(b)
    return Math.hypot((A[0] - B[0]) / σ[0], (A[1] - B[1]) / σ[1], (A[2] - B[2]) / σ[2])
  }
}

function solveAdaptiveTSP(colors) {
  const dist = adaptiveOKLabDistanceFactory(colors)
  let path = pcaSort(colors)
  let improved = true

  while (improved) {
    improved = false
    for (let i = 0; i < path.length - 2; i++) {
      for (let j = i + 1; j < path.length - 1; j++) {
        const d1 = dist(path[i], path[i + 1]) + dist(path[j], path[j + 1])
        const d2 = dist(path[i], path[j]) + dist(path[i + 1], path[j + 1])

        if (d2 < d1) {
          path = [...path.slice(0, i + 1), ...path.slice(i + 1, j + 1).reverse(), ...path.slice(j + 1)]
          improved = true
        }
      }
    }
  }
  return path
}

// function momentumSort(colors) {
//   const momentumWeight = 1e6;
//
//   function normalize(v) {
//     const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
//     if (len === 0) return [0, 0, 0];
//     return [v[0] / len, v[1] / len, v[2] / len];
//   }
//
//   function subtract(a, b) {
//     return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
//   }
//
//   function distance(a, b) {
//     const dx = a[0] - b[0];
//     const dy = a[1] - b[1];
//     const dz = a[2] - b[2];
//     return Math.sqrt(dx * dx + dy * dy + dz * dz);
//   }
//
//   function dot(a, b) {
//     return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
//   }
//
//   const data = colors.map((c) => chroma(c).oklab());
//   const remaining = new Set(data);
//   const sorted = [];
//
//   let current = data[0];
//   sorted.push(current);
//   remaining.delete(current);
//
//   current = data[1];
//   sorted.push(current);
//   remaining.delete(current);
//
//   // let prevDirection = null;
//   let prevDirection = normalize(subtract(data[0], data[1]));
//
//   while (remaining.size > 0) {
//     let best = null;
//     let bestScore = Infinity;
//
//     for (const candidate of remaining) {
//       const dist = distance(current, candidate);
//       // const dist = Math.abs(current[2] - candidate[2]);
//       const direction = normalize(subtract(candidate, current));
//
//       let score = dist;
//
//       // Apply momentum bonus
//       if (prevDirection) {
//         const alignment = dot(prevDirection, direction);
//         // alignment ranges from -1 (opposite) to 1 (same direction)
//         // We want to reward positive alignment
//         const momentumBonus = (1 - alignment) * momentumWeight;
//         score = dist * (1 + momentumBonus);
//       }
//
//       if (score < bestScore) {
//         bestScore = score;
//         best = candidate;
//       }
//     }
//
//     if (best) {
//       prevDirection = normalize(subtract(best, current));
//       current = best;
//       sorted.push(current);
//       remaining.delete(current);
//     }
//   }
//
//   return sorted.map((c) => chroma.oklab(...c).hex());
// }

function closestbidimomentumSort(colors) {
  const momentumWeight = 1e6

  function normalize(v) {
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
    if (len === 0) {
      return [0, 0, 0]
    }
    return [v[0] / len, v[1] / len, v[2] / len]
  }

  function subtract(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
  }

  function distance(a, b) {
    const dx = a[0] - b[0]
    const dy = a[1] - b[1]
    const dz = a[2] - b[2]
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  }

  function calculateScore(from, to, prevDirection) {
    const dist = distance(from, to)
    const direction = normalize(subtract(to, from))
    let score = dist

    if (prevDirection) {
      const alignment = dot(prevDirection, direction)
      const momentumBonus = (1 - alignment) * momentumWeight
      score = dist * (1 + momentumBonus)
    }

    return { score, direction }
  }

  function closest(data) {
    let minDist = Infinity
    let first = null
    let last = null

    // Compare all pairs to find the closest two points
    for (let i = 0; i < data.length; i++) {
      for (let j = i + 1; j < data.length; j++) {
        const dx = data[i][0] - data[j][0]
        const dy = data[i][1] - data[j][1]
        const dz = data[i][2] - data[j][2]
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

        if (dist < minDist) {
          minDist = dist
          first = data[i]
          last = data[j]
        }
      }
    }

    return { first, last }
  }

  const data = colors.map((c) => oklab(c))
  const remaining = new Set(data)
  const sorted = []

  // Start with closest two colors
  let { first, last } = closest(data)

  sorted.push(first, last)
  remaining.delete(first)
  remaining.delete(last)

  let prevDirectionStart = normalize(subtract(first, last))
  let prevDirectionEnd = normalize(subtract(last, first))

  while (remaining.size > 0) {
    // Find two best candidates overall
    let candidates = []

    for (const candidate of remaining) {
      const scoreStart = calculateScore(first, candidate, prevDirectionStart)
      const scoreEnd = calculateScore(last, candidate, prevDirectionEnd)
      const minScore = Math.min(scoreStart.score, scoreEnd.score)
      candidates.push({ candidate, scoreStart, scoreEnd, minScore })
    }

    // Sort to get the two best candidates by their minimum score
    candidates.sort((a, b) => a.minScore - b.minScore)

    // Take the best candidate and determine if it fits better at start or end
    const best = candidates[0]

    if (best.scoreStart.score <= best.scoreEnd.score) {
      // Add to start
      sorted.unshift(best.candidate)
      prevDirectionStart = best.scoreStart.direction
      first = best.candidate
    } else {
      // Add to end
      sorted.push(best.candidate)
      prevDirectionEnd = best.scoreEnd.direction
      last = best.candidate
    }

    remaining.delete(best.candidate)
  }

  return sorted.map((c) => chroma.oklab(...c).hex())
}

function inlinestbidimomentumSort(colors) {
  const momentumWeight = 1e6

  function normalize(v) {
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
    if (len === 0) {
      return [0, 0, 0]
    }
    return [v[0] / len, v[1] / len, v[2] / len]
  }

  function subtract(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
  }

  function distance(a, b) {
    const dx = a[0] - b[0]
    const dy = a[1] - b[1]
    const dz = a[2] - b[2]
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  }

  function calculateScore(from, to, prevDirection) {
    const dist = distance(from, to)
    // console.log(dist)
    const direction = normalize(subtract(to, from))
    let score = dist

    if (prevDirection) {
      const alignment = dot(prevDirection, direction)
      const momentumBonus = (1 - alignment) * momentumWeight
      score = dist * (1 + momentumBonus)
    }

    return { score, direction }
  }

  function inlinest(data) {
    let bestAlignment = -Infinity
    let first = null
    let mid = null
    let last = null

    // Evaluate all combinations of three points
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data.length; j++) {
        if (j === i) {
          continue
        }
        for (let k = 0; k < data.length; k++) {
          if (k === i || k === j) {
            continue
          }

          const dir1 = normalize(subtract(data[j], data[i]))
          const dir2 = normalize(subtract(data[k], data[j]))

          // alignment is 1 when directions are the same, -1 when opposite
          const alignment = dot(dir1, dir2)

          if (alignment > bestAlignment) {
            bestAlignment = alignment
            first = data[i]
            mid = data[j]
            last = data[k]
          }
        }
      }
    }

    return { first, mid, last }
  }

  const data = colors.map((c) => oklab(c))
  const remaining = new Set(data)
  const sorted = []

  // Start with closest two colors
  let { first, mid, last } = inlinest(data)

  if (distance(first, mid) < distance(mid, last)) {
    last = mid
  } else {
    first = mid
  }

  //sorted.push(first, mid, last);
  sorted.push(first, last)

  remaining.delete(first)
  //remaining.delete(mid);
  remaining.delete(last)

  //let prevDirectionStart = normalize(subtract(first, mid));
  //let prevDirectionEnd = normalize(subtract(mid, last));

  let prevDirectionStart = normalize(subtract(first, last))
  let prevDirectionEnd = normalize(subtract(last, first))

  while (remaining.size > 0) {
    // Find two best candidates overall
    let candidates = []

    for (const candidate of remaining) {
      const scoreStart = calculateScore(first, candidate, prevDirectionStart)
      const scoreEnd = calculateScore(last, candidate, prevDirectionEnd)
      const minScore = Math.min(scoreStart.score, scoreEnd.score)
      candidates.push({ candidate, scoreStart, scoreEnd, minScore })
    }

    // Sort to get the two best candidates by their minimum score
    candidates.sort((a, b) => a.minScore - b.minScore)

    // Take the best candidate and determine if it fits better at start or end
    const best = candidates[0]

    if (best.scoreStart.score <= best.scoreEnd.score) {
      // Add to start
      sorted.unshift(best.candidate)
      prevDirectionStart = best.scoreStart.direction
      first = best.candidate
    } else {
      // Add to end
      sorted.push(best.candidate)
      prevDirectionEnd = best.scoreEnd.direction
      last = best.candidate
    }

    remaining.delete(best.candidate)
  }

  return sorted.map((c) => chroma.oklab(...c).hex())
}

function inlinestbidideltamomentumSort(colors) {
  const momentumWeight = 1e6

  // function calculateAdaptiveWeights(colors) {
  //   const variances = calculateVariances(colors);
  //
  //   // Give MORE weight where there's LESS variance
  //   // (to make subtle differences more noticeable)
  //   const total = Math.max(
  //     Number.EPSILON,
  //     variances.L + variances.C + (variances.H ?? 0),
  //   );
  //
  //   return {
  //     Kl: (total - variances.L) / (2 * total),
  //     Kc: (total - variances.C) / (2 * total),
  //     Kh: (total - variances.H) / (2 * total),
  //   };
  // }

  // const { Kc, Kh, Kl } = calculateAdaptiveWeights(colors);

  function normalize(v) {
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
    if (len === 0) {
      return [0, 0, 0]
    }
    return [v[0] / len, v[1] / len, v[2] / len]
  }

  function subtract(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
  }

  function distance(a, b) {
    const dx = a[0] - b[0]
    const dy = a[1] - b[1]
    const dz = a[2] - b[2]
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  }

  function calculateScore(from, to, prevDirection) {
    // const dist = distance(from, to);
    const dist =
      (distance(from, to) *
        chroma.deltaE(
          chroma.oklab(from).hex(),
          chroma.oklab(to).hex(),
          // Kl,
          // Kc,
          // Kh + .5,
          0.75,
          0.75,
          0.75
        )) /
      150

    // console.log(dist)
    const direction = normalize(subtract(to, from))
    let score = dist

    if (prevDirection) {
      const alignment = dot(prevDirection, direction)
      const momentumBonus = (1 - alignment) * momentumWeight
      score = dist * (1 + momentumBonus)
    }

    return { score, direction }
  }

  function inlinest(data) {
    let bestAlignment = -Infinity
    let first = null
    let mid = null
    let last = null

    // Evaluate all combinations of three points
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data.length; j++) {
        if (j === i) {
          continue
        }
        for (let k = 0; k < data.length; k++) {
          if (k === i || k === j) {
            continue
          }

          const dir1 = normalize(subtract(data[j], data[i]))
          const dir2 = normalize(subtract(data[k], data[j]))

          // alignment is 1 when directions are the same, -1 when opposite
          const alignment = dot(dir1, dir2)

          if (alignment > bestAlignment) {
            bestAlignment = alignment
            first = data[i]
            mid = data[j]
            last = data[k]
          }
        }
      }
    }

    return { first, mid, last }
  }

  const data = colors.map((c) => oklab(c))
  const remaining = new Set(data)
  const sorted = []

  // Start with closest two colors
  let { first, mid, last } = inlinest(data)

  if (distance(first, mid) < distance(mid, last)) {
    last = mid
  } else {
    first = mid
  }

  //sorted.push(first, mid, last);
  sorted.push(first, last)

  remaining.delete(first)
  //remaining.delete(mid);
  remaining.delete(last)

  //let prevDirectionStart = normalize(subtract(first, mid));
  //let prevDirectionEnd = normalize(subtract(mid, last));

  let prevDirectionStart = normalize(subtract(first, last))
  let prevDirectionEnd = normalize(subtract(last, first))

  while (remaining.size > 0) {
    // Find two best candidates overall
    let candidates = []

    for (const candidate of remaining) {
      const scoreStart = calculateScore(first, candidate, prevDirectionStart)
      const scoreEnd = calculateScore(last, candidate, prevDirectionEnd)
      const minScore = Math.min(scoreStart.score, scoreEnd.score)
      candidates.push({ candidate, scoreStart, scoreEnd, minScore })
    }

    // Sort to get the two best candidates by their minimum score
    candidates.sort((a, b) => a.minScore - b.minScore)

    // Take the best candidate and determine if it fits better at start or end
    const best = candidates[0]

    if (best.scoreStart.score <= best.scoreEnd.score) {
      // Add to start
      sorted.unshift(best.candidate)
      prevDirectionStart = best.scoreStart.direction
      first = best.candidate
    } else {
      // Add to end
      sorted.push(best.candidate)
      prevDirectionEnd = best.scoreEnd.direction
      last = best.candidate
    }

    remaining.delete(best.candidate)
  }

  return sorted.map((c) => chroma.oklab(...c).hex())
}

function evolve(colors) {
  function fitness(palette) {
    let totalDistance = 0

    for (let i = 0; i < palette.length - 1; i++) {
      // const a = chroma(palette[i]).oklab()
      // const b = chroma(palette[i + 1]).oklab()
      const a = oklab(palette[i])
      const b = oklab(palette[i + 1])

      totalDistance += distance(a, b)
    }

    return -totalDistance // Minimize distance
  }

  let previous = 1

  const random = () => {
    previous = (previous * 16807) % 2147483647
    return previous / 2147483647
  }

  const populationSize = Math.min(40, Math.max(10, colors.length)) * 5
  const generations = colors.length < 50 ? 250 : Math.floor((125 * 250 * 64) / (populationSize * colors.length))

  // console.log(colors.length, generations)

  const ga = new GeneticAlgorithm({
    populationSize,
    generations,
    maxStagnation: colors.length < 50 ? 20 : 10,
    mutationRate: 0.5,
    crossoverRate: 0.9,
    eliteSize: 5,
    random,
    fitness: fitness,
    seed: () => [...colors].sort(() => random() - 0.5)
    // onGeneration: (stats) => {
    //   console.log(`Gen ${stats.generation}: Fitness = ${stats.bestFitness.toFixed(2)}`)
    // }
  })

  return ga.run().bestGenome
}

export const sortingMethods = [
  {
    name: 'DeltaE',
    fn: colorGraphSort
  },
  {
    name: 'Weighted DeltaE',
    fn: weightedColorGraphSort
  },
  {
    name: 'Weighted 2 DeltaE',
    fn: weightedColorGraphSort2
  },
  {
    name: 'TSP',
    fn: solveTSP2Opt
  },
  {
    name: 'PCA',
    fn: pcaSort
  },
  {
    name: 'Adaptive OKLab',
    fn: solveAdaptiveTSP
  },
  // {
  //   name: 'Momentum',
  //   fn: momentumSort,
  // },
  {
    name: 'Closest Bidi Momentum',
    fn: closestbidimomentumSort
  },
  {
    name: 'Inlinest Bidi Momentum',
    fn: inlinestbidimomentumSort
  },
  {
    name: 'Inlinest Bidi DeltaE Momentum',
    fn: inlinestbidideltamomentumSort
  },
  {
    name: 'Genetic',
    fn: evolve
  }
]

export const representations = [
  {
    label: 'hsl',
    name: 'HSL',
    points: (color) => {
      const [h, s, l] = color.hsl()
      return [h / 360 || 0, s / 100, l / 100]
    }
  },
  {
    label: 'hcl',
    name: 'HCL',
    points: (color) => color.hcl().map((v, i) => (v || 0) * [1 / 360, 1 / 100, 1 / 100][i])
  },
  {
    label: 'oklch',
    name: 'Oklch',
    points: (color) => color.oklch().map((v, i) => (v || 0) * [1 / 200, 1 / 100, 1 / 360][i])
  },
  {
    label: 'oklab',
    name: 'Oklab',
    points: (color) => color.oklab()
  },
  {
    label: 'lab',
    name: 'Lab',
    points: (color) => color.lab().map((v, i) => (v || 0) * [1 / 100, 1 / 95, 1 / 115][i])
  },
  {
    label: 'rgb',
    name: 'RGB',
    points: (color) => color.rgb().map((v) => v / 255)
  }
]
