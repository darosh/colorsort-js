import { hilbertOklab, hilbertRgb } from './hilbert.ts'
import { evolve, evolveMulti } from './genetic.js'
import { closestbidimomentumSort, inlinestbidideltamomentumSort, inlinestbidimomentumSort, momentumSort } from './momentum.js'
import { adaptiveTsp, graphDeltaETsp } from './tsp.js'
import { pca } from './pca.js'
import { graphDeltaEWeightedAdaptive1, graphDeltaEWeightedAdaptive2 } from './graph-delta-e-weighted-adatptive.js'
import { graphDeltaEWeighted } from './graph-delta-e-weighted.js'
import { graphDeltaE } from './graph-delta-e.js'
import { hcl, hsl, lab, oklab, oklch, rgb } from './models.js'

export const SORTING_METHODS = [
  {
    name: 'HSL',
    fn: hsl,
    speed: 2,
  },
  {
    name: 'HCL',
    fn: hcl,
    speed: 2,
  },
  {
    name: 'Oklch',
    fn: oklch,
    speed: 3
  },
  {
    name: 'Oklab',
    fn: oklab,
    speed: 3
  },
  {
    name: 'Lab',
    fn: lab,
    speed: 2
  },
  {
    name: 'RGB',
    fn: rgb,
    speed: 1
  },
  {
    name: 'DeltaE',
    fn: graphDeltaE,
    speed: 3
  },
  {
    name: 'DeltaE Weighted',
    fn: graphDeltaEWeighted,
    speed: 3
  },
  {
    name: 'DeltaE Weighted A1',
    fn: graphDeltaEWeightedAdaptive1,
    speed: 3
  },
  {
    name: 'DeltaE Weighted A2',
    fn: graphDeltaEWeightedAdaptive2,
    speed: 3
  },
  {
    name: 'TSP',
    fn: graphDeltaETsp,
    speed: 5
  },
  {
    name: 'PCA',
    fn: pca,
    speed: 1
  },
  {
    name: 'Adaptive OKLab',
    fn: adaptiveTsp,
    speed: 2
  },
  {
    name: 'Momentum',
    fn: momentumSort,
    speed: 1
  },
  {
    name: 'Closest Bidi Momentum',
    fn: closestbidimomentumSort,
    speed: 1
  },
  {
    name: 'Inlinest Bidi Momentum',
    fn: inlinestbidimomentumSort,
    speed: 3
  },
  {
    name: 'Inlinest Bidi DeltaE Momentum',
    fn: inlinestbidideltamomentumSort,
    speed: 4
  },
  {
    name: 'Genetic',
    fn: evolve,
    speed: 5
  },
  {
    name: 'Genetic Multi',
    fn: evolveMulti,
    speed: 6
  },
  {
    name: 'Hilbert',
    fn: hilbertRgb,
    speed: 1
  },
  {
    name: 'Hilbert Oklab',
    fn: hilbertOklab,
    speed: 1
  }
]
