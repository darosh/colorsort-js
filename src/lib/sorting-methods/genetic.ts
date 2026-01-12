import { oklab } from '../color.ts'
import { distance } from '../vector.ts'
import { GeneticAlgorithm } from '../genetic-algo.ts'
import { metrics } from '../metrics.js'

function fitness1D(palette: string[]) {
  let totalDistance = 0

  for (let i = 0; i < palette.length - 1; i++) {
    const a = oklab(palette[i])
    const b = oklab(palette[i + 1])

    totalDistance += distance(a, b)
  }

  return -totalDistance // Minimize distance
}

function compare1D(a: number, b: number) {
  return b - a
}

export function evolve(colors: string[]) {
  return evolveT(colors, fitness1D, compare1D)
}

export function evolveT<T>(colors: string[], fitness: (colors: string[]) => T, compare: (a: T, b: T) => number) {
  let previous = 1

  const random = () => {
    previous = (previous * 16807) % 2147483647
    return previous / 2147483647
  }

  const populationSize = Math.min(40, Math.max(10, colors.length)) * 5
  const generations = colors.length < 50 ? 250 : Math.floor((125 * 250 * 64) / (populationSize * colors.length))

  const ga = new GeneticAlgorithm({
    populationSize,
    generations,
    maxStagnation: colors.length < 50 ? 20 : 10,
    mutationRate: 0.5,
    crossoverRate: 0.9,
    eliteSize: 5,
    random,
    fitness,
    compare,
    seed: () => [...colors].sort(() => random() - 0.5)
    // onGeneration: (stats) => {
    //   console.log(`Gen ${stats.generation}: Fitness = ${stats.bestFitness.toFixed(2)}`)
    // }
  })

  return ga.run().bestGenome
}

function fitness3D(palette: string[]) {
  const oklabColors = palette.map((c) => oklab(c))
  const { avgAngleChange, maxAngleChange, totalDistance } = metrics(oklabColors)
  return [-totalDistance, -avgAngleChange, -maxAngleChange] // Minimize distance
}

function compare3D(fitnessA: number[], fitnessB: number[], tolerance = 0.01) {
  for (let i = 0; i < fitnessA.length; i++) {
    const avg = (fitnessA[i] + fitnessB[i]) / 2
    const threshold = Math.abs(avg * tolerance)
    const diff = fitnessB[i] - fitnessA[i] // B - A for descending

    // If difference is significant (outside tolerance)
    if (Math.abs(diff) > threshold) {
      return diff // Positive = B is better, negative = A is better
    }

    // Otherwise they're tied, move to next objective
  }

  // return 0 // All objectives are tied
  return fitnessB[0] - fitnessA[0]
}

export function evolveMulti(colors: string[]) {
  return evolveT(colors, fitness3D, compare3D)
}
