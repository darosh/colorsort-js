/**
 * Simple Genetic Algorithm implementation for permutation problems
 */

export class GeneticAlgorithm {
  constructor(config = {}) {
    // Configuration
    this.populationSize = config.populationSize || 100
    this.generations = config.generations || 200
    this.maxStagnation = config.maxStagnation || 20
    this.mutationRate = config.mutationRate || 0.1
    this.crossoverRate = config.crossoverRate || 0.9
    this.eliteSize = config.eliteSize || 5
    this.tournamentSize = config.tournamentSize || 5
    this.random = config.random || this.random

    // User-provided functions
    this.fitnessFunc = config.fitness || (() => 0)
    this.seedFunc = config.seed || (() => [])
    this.fitnessCompare = config.compare || ((a, b) => b - a)
    this.onGeneration = config.onGeneration

    // State
    this.population = []
    this.currentGeneration = 0
    this.bestIndividual = null
    this.bestFitness = -Infinity
    this.peakGeneration = 0
  }

  // Initialize population
  initializePopulation() {
    this.population = []
    for (let i = 0; i < this.populationSize; i++) {
      const genome = this.seedFunc()
      const fitness = this.fitnessFunc(genome)
      this.population.push({ genome, fitness })
    }
    this.sortPopulation()
    this.updateBest()
  }

  // Sort population by fitness (descending)
  sortPopulation() {
    this.population.sort((a, b) => this.fitnessCompare(a.fitness, b.fitness))
  }

  // Update the best individual tracker
  updateBest() {
    if (this.bestFitness === -Infinity || this.fitnessCompare(this.population[0].fitness, this.bestFitness) < 0) {
      this.peakGeneration = this.currentGeneration
      this.bestFitness = this.population[0].fitness
      this.bestIndividual = [...this.population[0].genome]
    }
  }

  // Tournament selection
  tournamentSelect() {
    const tournament = []
    for (let i = 0; i < this.tournamentSize; i++) {
      const idx = Math.floor(this.random() * this.population.length)
      tournament.push(this.population[idx])
    }

    tournament.sort((a, b) => this.fitnessCompare(a.fitness, b.fitness))
    return tournament[0]
  }

  // Order Crossover (OX) for permutations
  orderCrossover(parent1, parent2) {
    const size = parent1.length
    const start = Math.floor(this.random() * size)
    const end = start + Math.floor(this.random() * (size - start))

    const child = Array(size).fill(null)

    // Copy segment from parent1
    for (let i = start; i <= end; i++) {
      child[i] = parent1[i]
    }

    // Fill remaining with parent2's order
    let currentPos = (end + 1) % size
    let parent2Pos = (end + 1) % size

    while (child.includes(null)) {
      if (!child.includes(parent2[parent2Pos])) {
        child[currentPos] = parent2[parent2Pos]
        currentPos = (currentPos + 1) % size
      }
      parent2Pos = (parent2Pos + 1) % size
    }

    return child
  }

  // Swap mutation for permutations
  swapMutate(genome) {
    const mutated = [...genome]
    const idx1 = Math.floor(this.random() * mutated.length)
    const idx2 = Math.floor(this.random() * mutated.length)
    ;[mutated[idx1], mutated[idx2]] = [mutated[idx2], mutated[idx1]]
    return mutated
  }

  shiftMutate(genome) {
    const mutated = [...genome]

    mutated.push(mutated.shift())

    return mutated
  }

  cheatMutate(genome) {
    let mutated = this.shiftMutate(genome)
    let best = mutated
    let bestScore = this.fitnessFunc(best)

    for (let i = 1; i < genome.length; i++) {
      mutated = this.shiftMutate(mutated)
      const score = this.fitnessFunc(mutated)

      if (this.fitnessCompare(score, bestScore) < 0) {
        bestScore = score
        best = mutated
      }
    }

    const reversed = [...best].reverse()

    if (this.fitnessCompare(bestScore, this.fitnessFunc(reversed)) < 0) {
      return reversed
    }

    return best
  }

  // Create new generation
  evolve() {
    const newPopulation = []

    // Elitism - keep best individuals
    for (let i = 0; i < this.eliteSize; i++) {
      newPopulation.push({
        genome: [...this.population[i].genome],
        fitness: this.population[i].fitness
      })
    }

    // Create offspring
    while (newPopulation.length < this.populationSize) {
      const parent1 = this.tournamentSelect()
      const parent2 = this.tournamentSelect()

      // Crossover
      let childGenome
      if (this.random() < this.crossoverRate) {
        childGenome = this.orderCrossover(parent1.genome, parent2.genome)
      } else {
        childGenome = [...parent1.genome]
      }

      // Mutation
      if (this.random() < this.mutationRate) {
        const m = this.random()

        if (m < 0.5) {
          childGenome = this.swapMutate(childGenome)
        } else if (m < 0.7) {
          childGenome = this.shiftMutate(childGenome)
        } else if (m < 0.9) {
          childGenome = [...childGenome].reverse()
        } else {
          childGenome = this.cheatMutate(childGenome)
        }
      }

      const fitness = this.fitnessFunc(childGenome)
      newPopulation.push({ genome: childGenome, fitness })
    }

    this.population = newPopulation
    this.sortPopulation()
    this.updateBest()
  }

  // Run the algorithm
  run() {
    this.initializePopulation()

    for (let gen = 0; gen < this.generations; gen++) {
      this.currentGeneration = gen

      // Callback for progress tracking
      if (this.onGeneration) {
        this.onGeneration({
          generation: gen,
          bestFitness: this.population[0].fitness,
          bestGenome: this.population[0].genome,
          averageFitness: this.population.reduce((sum, ind) => sum + ind.fitness, 0) / this.population.length
        })
      }

      if (this.currentGeneration > this.peakGeneration + this.maxStagnation) {
        break
      }

      this.evolve()
    }

    // console.log({
    //   colors: this.bestIndividual.length,
    //   peak: this.peakGeneration
    // })

    return {
      bestGenome: this.cheatMutate(this.bestIndividual),
      bestFitness: this.bestFitness,
      finalPopulation: this.population,
      peakGeneration: this.peakGeneration
    }
  }
}
