import { oklab } from '../oklab.js'
import { distance } from '../vector.ts'
import { GeneticAlgorithm } from '../genetic-algo.js'
import { metrics } from '../metrics.js'

function fitness1D(palette) {
  let totalDistance = 0

  for (let i = 0; i < palette.length - 1; i++) {
    const a = oklab(palette[i])
    const b = oklab(palette[i + 1])

    totalDistance += distance(a, b)
  }

  return -totalDistance // Minimize distance
}

function compare1D(a, b) {
  return b - a
}

export function evolve(colors, fitness = fitness1D, compare = compare1D) {
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

function fitness3D(palette) {
  const { avgAngleChange, maxAngleChange, totalDistance } = metrics(palette)
  return [-totalDistance, -avgAngleChange, -maxAngleChange] // Minimize distance
}

function compare3D(fitnessA, fitnessB, tolerance = 0.01) {
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

export function evolveMulti(colors) {
  return evolve(colors, fitness3D, compare3D)
}
