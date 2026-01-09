/**
 * Simple Genetic Algorithm implementation for permutation problems
 */

export interface GAConfig<T, F> {
  populationSize?: number
  generations?: number
  maxStagnation?: number
  mutationRate?: number
  crossoverRate?: number
  eliteSize?: number
  tournamentSize?: number
  random?: () => number
  fitness: (genome: T[]) => F
  seed: () => T[]
  compare?: (a: F, b: F) => number
  onGeneration?: (stats: GenerationStats<T, F>) => void
}

export interface Individual<T, F> {
  genome: T[]
  fitness: F
}

export interface GenerationStats<T, F> {
  generation: number
  bestFitness: F
  bestGenome: T[]
  averageFitness: number
}

export interface GAResult<T, F> {
  bestGenome: T[]
  bestFitness: F
  finalPopulation: Individual<T, F>[]
  peakGeneration: number
}

export class GeneticAlgorithm<T, F> {
  private readonly populationSize: number
  private readonly generations: number
  private readonly maxStagnation: number
  private readonly mutationRate: number
  private readonly crossoverRate: number
  private readonly eliteSize: number
  private readonly tournamentSize: number
  private readonly random: () => number
  private readonly fitnessFunc: (genome: T[]) => F
  private readonly seedFunc: () => T[]
  private readonly fitnessCompare: (a: F, b: F) => number
  private readonly onGeneration?: (stats: GenerationStats<T, F>) => void

  private population: Individual<T, F>[]
  private currentGeneration: number
  private bestIndividual: T[] | null
  private bestFitness: F
  private peakGeneration: number

  constructor(config: GAConfig<T, F>) {
    // Configuration
    this.populationSize = config.populationSize || 100
    this.generations = config.generations || 200
    this.maxStagnation = config.maxStagnation || 20
    this.mutationRate = config.mutationRate || 0.1
    this.crossoverRate = config.crossoverRate || 0.9
    this.eliteSize = config.eliteSize || 5
    this.tournamentSize = config.tournamentSize || 5
    this.random = config.random || Math.random

    // User-provided functions
    this.fitnessFunc = config.fitness || (() => 0)
    this.seedFunc = config.seed
    // @ts-ignore
    this.fitnessCompare = config.compare || ((a: number, b: number) => b - a)
    this.onGeneration = config.onGeneration

    // State
    this.population = []
    this.currentGeneration = 0
    this.bestIndividual = null
    this.bestFitness = <F>-Infinity
    this.peakGeneration = 0
  }

  // Initialize population
  private initializePopulation(): void {
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
  private sortPopulation(): void {
    this.population.sort((a, b) => this.fitnessCompare(a.fitness, b.fitness))
  }

  // Update the best individual tracker
  private updateBest(): void {
    if (this.bestFitness === -Infinity || this.fitnessCompare(this.population[0].fitness, this.bestFitness) < 0) {
      this.peakGeneration = this.currentGeneration
      this.bestFitness = this.population[0].fitness
      this.bestIndividual = [...this.population[0].genome]
    }
  }

  // Tournament selection
  private tournamentSelect(): Individual<T, F> {
    const tournament: Individual<T, F>[] = []
    for (let i = 0; i < this.tournamentSize; i++) {
      const idx = Math.floor(this.random() * this.population.length)
      tournament.push(this.population[idx])
    }

    tournament.sort((a, b) => this.fitnessCompare(a.fitness, b.fitness))
    return tournament[0]
  }

  // Order Crossover (OX) for permutations
  private orderCrossover(parent1: T[], parent2: T[]): T[] {
    const size = parent1.length
    const start = Math.floor(this.random() * size)
    const end = start + Math.floor(this.random() * (size - start))

    const child: (T | null)[] = Array(size).fill(null)

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

    return child as T[]
  }

  // Swap mutation for permutations
  private swapMutate(genome: T[]): T[] {
    const mutated = [...genome]
    const idx1 = Math.floor(this.random() * mutated.length)
    const idx2 = Math.floor(this.random() * mutated.length)
    ;[mutated[idx1], mutated[idx2]] = [mutated[idx2], mutated[idx1]]
    return mutated
  }

  private shiftMutate(genome: T[]): T[] {
    const mutated = [...genome]
    mutated.push(mutated.shift()!)
    return mutated
  }

  private cheatMutate(genome: T[]): T[] {
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
  private evolve(): void {
    const newPopulation: Individual<T, F>[] = []

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
      let childGenome: T[]
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
  public run(): GAResult<T, F> {
    this.initializePopulation()

    for (let gen = 0; gen < this.generations; gen++) {
      this.currentGeneration = gen

      // Callback for progress tracking
      if (this.onGeneration) {
        this.onGeneration({
          generation: gen,
          bestFitness: this.population[0].fitness,
          bestGenome: this.population[0].genome,
          averageFitness: this.population.reduce((sum, ind) => sum + (typeof ind.fitness === 'number' ? ind.fitness : 0), 0) / this.population.length
        })
      }

      if (this.currentGeneration > this.peakGeneration + this.maxStagnation) {
        break
      }

      this.evolve()
    }

    return {
      bestGenome: this.cheatMutate(this.bestIndividual!),
      bestFitness: this.bestFitness,
      finalPopulation: this.population,
      peakGeneration: this.peakGeneration
    }
  }
}
