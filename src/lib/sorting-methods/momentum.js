import chroma from 'chroma-js'
import { oklab } from '../oklab.js'

export function momentumSort(colors) {
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

  const data = colors.map((c) => oklab(c))
  const remaining = new Set(data)
  const sorted = []

  let current = data[0]
  sorted.push(current)
  remaining.delete(current)

  current = data[1]
  sorted.push(current)
  remaining.delete(current)

  // let prevDirection = null;
  let prevDirection = normalize(subtract(data[0], data[1]))

  while (remaining.size > 0) {
    let best = null
    let bestScore = Infinity

    for (const candidate of remaining) {
      const dist = distance(current, candidate)
      // const dist = Math.abs(current[2] - candidate[2]);
      const direction = normalize(subtract(candidate, current))

      let score = dist

      // Apply momentum bonus
      if (prevDirection) {
        const alignment = dot(prevDirection, direction)
        // alignment ranges from -1 (opposite) to 1 (same direction)
        // We want to reward positive alignment
        const momentumBonus = (1 - alignment) * momentumWeight
        score = dist * (1 + momentumBonus)
      }

      if (score < bestScore) {
        bestScore = score
        best = candidate
      }
    }

    if (best) {
      prevDirection = normalize(subtract(best, current))
      current = best
      sorted.push(current)
      remaining.delete(current)
    }
  }

  return sorted.map((c) => chroma.oklab(...c).hex())
}

export function closestbidimomentumSort(colors) {
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

export function inlinestbidimomentumSort(colors) {
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

export function inlinestbidideltamomentumSort(colors) {
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
