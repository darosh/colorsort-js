import { hilbertLab, hilbertOklab, hilbertRgb } from './hilbert.ts'
import { evolve, evolveMulti } from './genetic.js'
import { adaptiveTsp, graphDeltaETsp } from './tsp.js'
import { graphDeltaEWeightedAdaptive1, graphDeltaEWeightedAdaptive2 } from './graph-delta-e-weighted-adatptive.js'
import { graphDeltaEWeighted, graphDeltaEWeightedPlusPlus } from './graph-delta-e-weighted.js'
import { graphDeltaE } from './graph-delta-e.js'
import { principalLab, principalOklab, principalRgb } from './principal.ts'
import { cylindrical, spiral } from './radial.ts'
import { cluster, dbScan, kMeans } from './clustering.ts'
import { momentumClosestOklab, momentumInlinestOklab, momentumInlinestDeltaEOklab, momentumInlinestDeltaEPlusOklab, momentumClosestBestOklab, momentumClosestBestDeltaEOklab } from './momentum.ts'
import { harmonizeDelta, harmonizeModel } from './harmonize.ts'
import BENCH from '../../../bench.json' with { type: 'json' }

const METHODS = {
  PCA: ['PCA', 'Principal component analysis', 'https://en.wikipedia.org/wiki/Principal_component_analysis'],
  HIL: ['HIL', 'Hilbert curve', 'https://en.wikipedia.org/wiki/Hilbert_curve'],
  GEN: ['GEN', 'Genetic algorithm', 'https://en.wikipedia.org/wiki/Genetic_algorithm'],
  TSP: ['TSP', 'Travelling salesman problem', 'https://en.wikipedia.org/wiki/Travelling_salesman_problem'],
  NNA: ['NNA', 'Nearest neighbour algorithm', 'https://en.wikipedia.org/wiki/Nearest_neighbour_algorithm'],
  '2-OPT': ['2-OPT', '2-opt', 'https://en.wikipedia.org/wiki/2-opt'],
  MOM: ['MON', 'Greedy with momentum', ' https://en.wikipedia.org/wiki/Greedy_algorithm']
}

const MODELS = {
  RGB: ['RGB', 'https://en.wikipedia.org/wiki/RGB_color_model'],
  LAB: ['CIELAB', 'https://en.wikipedia.org/wiki/CIELAB_color_space'],
  OKLAB: ['Oklab', 'https://en.wikipedia.org/wiki/Oklab_color_space'],
  HSL: ['HSL', 'https://en.wikipedia.org/wiki/HSL_and_HSV'],
  HCL: ['HCL', 'https://en.wikipedia.org/wiki/HCL_color_space'],
  OKLCH: ['Oklch', 'https://en.wikipedia.org/wiki/Oklab_color_space'],
  CMYK: ['CMYK', 'https://en.wikipedia.org/wiki/CMYK_color_model']
}

const DIFFS = {
  DE: ['DE', 'Delta E', 'http://www.brucelindbloom.com/index.html?Eqn_DeltaE_CIE2000.html']
}

export const SORTING_METHODS_RAW = [
  {
    name: 'Original',
    fn: (c) => c,
    mid: 'Original',
    description: {
      model: null
    }
  },
  {
    name: 'HARM',
    fn: harmonizeModel,
    mid: 'HARM',
    description: {}
  },
  {
    name: 'HARMED',
    fn: harmonizeDelta,
    mid: 'HARMED',
    description: {}
  },
  {
    name: 'NNA(Delta E)',
    fn: graphDeltaE,
    mid: 'NNA(DE) Lab',
    description: {
      method: METHODS.NNA,
      model: MODELS.LAB,
      diff: DIFFS.DE
    }
  },
  {
    name: 'NNA(Delta E+)',
    fn: graphDeltaEWeighted,
    mid: 'NNA(DE+) Lab',
    description: {
      method: METHODS.NNA,
      model: MODELS.LAB,
      diff: DIFFS.DE
    }
  },
  {
    name: 'NNA(Delta E++)',
    fn: graphDeltaEWeightedPlusPlus,
    mid: 'NNA(DE++) Lab',
    description: {
      method: METHODS.NNA,
      model: MODELS.LAB,
      diff: DIFFS.DE
    }
  },
  {
    name: 'NNA(Delta E+1)',
    fn: graphDeltaEWeightedAdaptive1,
    mid: 'NNA(DE+1) Lab',
    description: {
      method: METHODS.NNA,
      model: MODELS.LAB,
      diff: DIFFS.DE
    }
  },
  {
    name: 'NNA(Delta E+2)',
    fn: graphDeltaEWeightedAdaptive2,
    mid: 'NNA(DE+2) Lab',
    description: {
      method: METHODS.NNA,
      model: MODELS.LAB,
      diff: DIFFS.DE
    }
  },
  {
    name: 'TSP(Delta E) Lab',
    fn: graphDeltaETsp,
    mid: 'TSP(DE)-Lab',
    description: {
      method: [METHODS.TSP, METHODS['2-OPT']],
      model: MODELS.LAB,
      diff: DIFFS.DE
    }
  },
  {
    name: 'TSP(PCA(Delta E+)) Lab',
    fn: adaptiveTsp,
    mid: 'TSP(PCA(DE+))-Lab',
    description: {
      method: [METHODS.TSP, METHODS['2-OPT'], METHODS.PCA],
      model: MODELS.LAB,
      diff: DIFFS.DE
    }
  },
  {
    name: 'MOM(Closest) Oklab',
    fn: momentumClosestOklab,
    mid: 'MOM(Closest)-Oklab',
    description: {
      method: METHODS.MOM,
      model: MODELS.OKLAB
    }
  },
  {
    name: 'MOM(Closest+) Oklab',
    fn: momentumClosestBestOklab,
    mid: 'MOM(Closest+)-Oklab',
    description: {
      method: METHODS.MOM,
      model: MODELS.OKLAB
    }
  },
  {
    name: 'TSP(MOM(Closest+)) Oklab',
    fn: (colors) => momentumClosestBestOklab(colors, true),
    mid: 'TSP(MOM(Closest+))-Oklab',
    description: {
      method: METHODS.MOM,
      model: MODELS.OKLAB
    }
  },
  {
    name: 'MOM(Closest+, Delta E) Oklab',
    fn: momentumClosestBestDeltaEOklab,
    mid: 'MOM(Closest+,DE)-Oklab',
    description: {
      method: METHODS.MOM,
      model: MODELS.OKLAB
    }
  },
  {
    name: 'MOM(Inlinest) Oklab',
    fn: momentumInlinestOklab,
    mid: 'MOM(Inlinest)-Oklab',
    description: {
      method: METHODS.MOM,
      model: MODELS.OKLAB
    }
  },
  {
    name: 'MOM(Inlinest, Delta E) Oklab',
    fn: momentumInlinestDeltaEOklab,
    mid: 'MOM(Inlinest,DE)-Oklab',
    description: {
      method: METHODS.MOM,
      model: MODELS.OKLAB,
      diff: DIFFS.DE
    }
  },
  {
    name: 'MOM(Inlinest, Delta E++) Oklab',
    fn: momentumInlinestDeltaEPlusOklab,
    mid: 'MOM(Inlinest,DE++)-Oklab',
    description: {
      method: METHODS.MOM,
      model: MODELS.OKLAB,
      diff: DIFFS.DE
    }
  },
  {
    name: 'Genetic Oklab',
    fn: evolve,
    mid: 'GEN-Oklab',
    description: {
      method: METHODS.GEN,
      model: MODELS.OKLAB
    }
  },
  {
    name: 'Genetic3 Oklab',
    fn: evolveMulti,
    mid: 'GEN3-Oklab',
    description: {
      method: METHODS.GEN,
      model: MODELS.OKLAB
    }
  },
  {
    name: 'Hilbert RGB',
    fn: hilbertRgb,
    mid: 'HIL-RGB',
    description: {
      method: METHODS.HIL,
      model: MODELS.RGB
    }
  },
  {
    name: 'Hilbert Lab',
    fn: hilbertLab,
    mid: 'HIL-Lab',
    description: {
      method: METHODS.HIL,
      model: MODELS.LAB
    }
  },
  {
    name: 'Hilbert Oklab',
    fn: hilbertOklab,
    mid: 'HIL-Oklab',
    description: {
      method: METHODS.HIL,
      model: MODELS.OKLAB
    }
  },
  {
    name: 'PCA RGB',
    fn: principalRgb,
    mid: 'PCA-RGB',
    description: {
      method: METHODS.PCA,
      model: MODELS.RGB
    }
  },
  {
    name: 'PCA Lab',
    fn: principalLab,
    mid: 'PCA-Lab',
    description: {
      method: METHODS.PCA,
      model: MODELS.LAB
    }
  },
  {
    name: 'PCA Oklab',
    fn: principalOklab,
    mid: 'PCA-Oklab',
    description: {
      method: METHODS.PCA,
      model: MODELS.OKLAB
    }
  },
  {
    name: 'Spiral',
    fn: spiral,
    mid: 'SPI',
    description: {}
  },
  {
    name: 'Cylindrical',
    fn: cylindrical,
    mid: 'CYL',
    description: {}
  },
  {
    name: 'Cluster',
    fn: cluster,
    mid: 'CL',
    description: {}
  },
  {
    name: 'K-means',
    fn: kMeans,
    mid: 'KM',
    description: {}
  },
  {
    name: 'DBSCAN',
    fn: dbScan,
    mid: 'DBSCAN',
    description: {}
  }
]

function getCombinationsAsArrays(params) {
  return params.reduce((acc, { values }) => acc.flatMap((combo) => values.map((value) => [...combo, value])), [[]])
}

export const SORTING_METHODS = SORTING_METHODS_RAW.reduce((acc, item) => {
  if (item.fn.params) {
    const combinations = getCombinationsAsArrays(item.fn.params)

    for (const combination of combinations) {
      acc.push({
        ...item,
        name: `${item.name} [${combination.join(',')}]`,
        mid: `${item.mid}:[${combination.join(',')}]`,
        speed: BENCH[item.mid] || 0,
        fn: (c) => item.fn.call(null, c, ...combination)
      })
    }
  } else {
    acc.push(item)
  }

  return acc
}, [])
