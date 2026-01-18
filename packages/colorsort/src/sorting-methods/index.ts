import { hilbert } from './hilbert.ts'
import { evolve, evolveMulti } from './genetic.ts'
import { principal } from './principal.ts'
import { cylindrical, spiral } from './radial.ts'
import { cluster, dbScan, kMeans } from './clustering.ts'
import { harmonizeDelta, harmonizeModel } from './harmonize.ts'
import { graph, graphWeighted, graphWeightedAdaptive1, graphWeightedAdaptive2, graphWeightedPlusPlus } from './graph.ts'
import { momentumClosestOklab, momentumInlinestOklab, momentumInlinestDeltaEOklab, momentumInlinestDeltaEPlusOklab, momentumClosestBestOklab, momentumClosestBestDeltaEOklab } from './momentum.ts'

import BENCH from '../../data/bench.json' with { type: 'json' }
import { UniColor } from '../method-runner.ts'
import { ramp, rampa, rampb, rampc, rampd, rampe, rampf } from './ramp.ts'
// import debug from 'debug'

// const log = debug('cs:method')

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
  LCH: ['LCH', 'https://en.wikipedia.org/wiki/HCL_color_space'],
  OKLCH: ['Oklch', 'https://en.wikipedia.org/wiki/Oklab_color_space'],
  CMYK: ['CMYK', 'https://en.wikipedia.org/wiki/CMYK_color_model']
}

const DIFFS = {
  DE: ['DE', 'Delta E', 'http://www.brucelindbloom.com/index.html?Eqn_DeltaE_CIE2000.html']
}

export type SortingFunction = Function & { params?: { name: string; values: any[] }[] }

export type SortingMethod = {
  name: string
  mid: string
  description?: {
    model?: any | null
    method?: any | null
    diff?: any | null
  }
  fn: SortingFunction
  speed?: number
}

export const SORTING_METHODS_RAW: SortingMethod[] = [
  {
    name: 'Original',
    fn: (c: UniColor) => c,
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
    fn: graph,
    mid: 'NNA(DE) Lab',
    description: {
      method: METHODS.NNA,
      model: MODELS.LAB,
      diff: DIFFS.DE
    }
  },
  {
    name: 'NNA(Delta E+)',
    fn: graphWeighted,
    mid: 'NNA(DE+) Lab',
    description: {
      method: METHODS.NNA,
      model: MODELS.LAB,
      diff: DIFFS.DE
    }
  },
  {
    name: 'NNA(Delta E++)',
    fn: graphWeightedPlusPlus,
    mid: 'NNA(DE++) Lab',
    description: {
      method: METHODS.NNA,
      model: MODELS.LAB,
      diff: DIFFS.DE
    }
  },
  {
    name: 'NNA(Delta E+1)',
    fn: graphWeightedAdaptive1,
    mid: 'NNA(DE+1) Lab',
    description: {
      method: METHODS.NNA,
      model: MODELS.LAB,
      diff: DIFFS.DE
    }
  },
  {
    name: 'NNA(Delta E+2)',
    fn: graphWeightedAdaptive2,
    mid: 'NNA(DE+2) Lab',
    description: {
      method: METHODS.NNA,
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
    name: 'Hilbert',
    fn: hilbert,
    mid: 'HIL',
    description: {
      method: METHODS.HIL,
      model: MODELS.RGB
    }
  },
  {
    name: 'PCA',
    fn: principal,
    mid: 'PCA',
    description: {
      method: METHODS.PCA
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
  },
  {
    name: 'RAMP',
    fn: ramp,
    mid: 'RAMP',
    description: {}
  },
  {
    name: 'RAMPA',
    fn: rampa,
    mid: 'RAMPA',
    description: {}
  },
  {
    name: 'RAMPB',
    fn: rampb,
    mid: 'RAMPB',
    description: {}
  },
  {
    name: 'RAMPC',
    fn: rampc,
    mid: 'RAMPC',
    description: {}
  },
  {
    name: 'RAMPD',
    fn: rampd,
    mid: 'RAMPD',
    description: {}
  },
  {
    name: 'RAMPE',
    fn: rampe,
    mid: 'RAMPE',
    description: {}
  },
  {
    name: 'RAMPF',
    fn: rampf,
    mid: 'RAMPF',
    description: {}
  }
]

function getCombinationsAsArrays(params: { values: any[] }[]): any[][] {
  return params.reduce<any[][]>((acc, { values }) => acc.flatMap((combo) => values.map((value) => [...combo, value])), [[]])
}

export const SORTING_METHODS = SORTING_METHODS_RAW.reduce(
  (acc, item) => {
    if (item.fn.params) {
      const combinations = getCombinationsAsArrays(item.fn.params)

      for (const combination of combinations) {
        // const fn = (c: UniColor) => {
        //   log(`starting '${(<any>fn).name_}'`)
        //   item.fn.call(null, c, ...combination)
        // }

        // fn.name_ = item.fn.name

        acc.push({
          ...item,
          name: `${item.name} [${combination.join(',')}]`,
          mid: `${item.mid}:[${combination.join(',')}]`,
          speed: (<{ [index: string]: number }>BENCH)[item.mid] || 0,
          fn: (c: UniColor) => item.fn.call(null, c, ...combination)
        })
      }
    } else {
      // const fn = (c: UniColor) => {
      //   log(`starting '${(<any>fn).name_}'`)
      //   item.fn.call(null, c)
      // }

      // fn.name_ = item.fn.name

      // acc.push({
      //   ...item,
      //   fn
      // })
      acc.push(item)
    }

    return acc
  },
  <SortingMethod[]>[]
)
