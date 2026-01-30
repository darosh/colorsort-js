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
import { ramp, rampa, rampb, rampc, rampd, rampe, rampf, rampg, ramph, rampi } from './ramp.ts'
import { raw } from './raw.ts'
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

export type SortingFunction = Function & {
  params?: { name: string; values: any[] }[]
  valid?: Function
}

export type SortingMethod = {
  mid: string
  description?: {
    model?: any | null
    method?: any | null
    diff?: any | null
  }
  fn: SortingFunction
  speed?: number
  valid?: Function
}

export const ORIGINAL = 'Original'

export const SORTING_METHODS_RAW: SortingMethod[] = [
  {
    fn: (c: UniColor) => c,
    mid: ORIGINAL,
    description: {
      model: null
    }
  },
  {
    fn: harmonizeModel,
    mid: 'HARM',
    description: {}
  },
  {
    fn: harmonizeDelta,
    mid: 'HARMED',
    description: {}
  },
  {
    fn: graph,
    mid: 'NNA(DE) Lab',
    description: {
      method: METHODS.NNA,
      model: MODELS.LAB,
      diff: DIFFS.DE
    }
  },
  {
    fn: graphWeighted,
    mid: 'NNA(DE+) Lab',
    description: {
      method: METHODS.NNA,
      model: MODELS.LAB,
      diff: DIFFS.DE
    }
  },
  {
    fn: graphWeightedPlusPlus,
    mid: 'NNA(DE++) Lab',
    description: {
      method: METHODS.NNA,
      model: MODELS.LAB,
      diff: DIFFS.DE
    }
  },
  {
    fn: graphWeightedAdaptive1,
    mid: 'NNA(DE+1) Lab',
    description: {
      method: METHODS.NNA,
      model: MODELS.LAB,
      diff: DIFFS.DE
    }
  },
  {
    fn: graphWeightedAdaptive2,
    mid: 'NNA(DE+2) Lab',
    description: {
      method: METHODS.NNA,
      model: MODELS.LAB,
      diff: DIFFS.DE
    }
  },
  {
    fn: momentumClosestOklab,
    mid: 'MOM(Closest)-Oklab',
    description: {
      method: METHODS.MOM,
      model: MODELS.OKLAB
    }
  },
  {
    fn: momentumClosestBestOklab,
    mid: 'MOM(Closest+)-Oklab',
    description: {
      method: METHODS.MOM,
      model: MODELS.OKLAB
    }
  },
  {
    fn: momentumClosestBestDeltaEOklab,
    mid: 'MOM(Closest+,DE)-Oklab',
    description: {
      method: METHODS.MOM,
      model: MODELS.OKLAB
    }
  },
  {
    fn: momentumInlinestOklab,
    mid: 'MOM(Inlinest)-Oklab',
    description: {
      method: METHODS.MOM,
      model: MODELS.OKLAB
    }
  },
  {
    fn: momentumInlinestDeltaEOklab,
    mid: 'MOM(Inlinest,DE)-Oklab',
    description: {
      method: METHODS.MOM,
      model: MODELS.OKLAB,
      diff: DIFFS.DE
    }
  },
  {
    fn: momentumInlinestDeltaEPlusOklab,
    mid: 'MOM(Inlinest,DE++)-Oklab',
    description: {
      method: METHODS.MOM,
      model: MODELS.OKLAB,
      diff: DIFFS.DE
    }
  },
  {
    fn: evolve,
    mid: 'GEN-Oklab',
    description: {
      method: METHODS.GEN,
      model: MODELS.OKLAB
    }
  },
  {
    fn: evolveMulti,
    mid: 'GEN3-Oklab',
    description: {
      method: METHODS.GEN,
      model: MODELS.OKLAB
    }
  },
  {
    fn: hilbert,
    mid: 'HIL',
    description: {
      method: METHODS.HIL,
      model: MODELS.RGB
    }
  },
  {
    fn: principal,
    mid: 'PCA',
    description: {
      method: METHODS.PCA
    }
  },
  {
    fn: spiral,
    mid: 'SPI',
    description: {}
  },
  {
    fn: cylindrical,
    mid: 'CYL',
    description: {}
  },
  {
    fn: cluster,
    mid: 'CL',
    description: {}
  },
  {
    fn: kMeans,
    mid: 'KM',
    description: {}
  },
  {
    fn: dbScan,
    mid: 'DBSCAN',
    description: {}
  },
  {
    fn: ramp,
    mid: 'RAMP',
    description: {}
  },
  {
    fn: rampa,
    mid: 'RAMPA',
    description: {}
  },
  {
    fn: rampb,
    mid: 'RAMPB',
    description: {}
  },
  {
    fn: rampc,
    mid: 'RAMPC',
    description: {}
  },
  {
    fn: rampd,
    mid: 'RAMPD',
    description: {}
  },
  {
    fn: rampe,
    mid: 'RAMPE',
    description: {}
  },
  {
    fn: rampf,
    mid: 'RAMPF',
    description: {}
  },
  {
    fn: rampg,
    mid: 'RAMPG',
    description: {}
  },
  {
    fn: ramph,
    mid: 'RAMPH',
    description: {}
  },
  {
    fn: rampi,
    mid: 'RAMPI',
    description: {}
  },
  {
    fn: raw,
    mid: 'RAW',
    description: {}
  }
]

function getCombinationsAsArrays(params: { values: any[] }[]): any[][] {
  return params.reduce<any[][]>((acc, { values }) => acc.flatMap((combo) => values.map((value) => [...combo, value])), [[]])
}

export function isValid(method: SortingMethod, colors: string[]) {
  return (method.valid && method.valid(colors)) || true
}

export function isValidMethodId(mid: string, colors: string[]) {
  return isValid(SORTING_METHODS.find(m => m.mid === mid)!, colors)
}

export const SORTING_METHODS = SORTING_METHODS_RAW.reduce(
  (acc, item) => {
    if (item.fn.params) {
      const combinations = getCombinationsAsArrays(item.fn.params)

      for (const combination of combinations) {
        acc.push({
          ...item,
          mid: `${item.mid}:[${combination.join(',')}]`,
          speed: (<{ [index: string]: number }>BENCH)[item.mid] || 0,
          fn: (c: UniColor) => item.fn.call(null, c, ...combination),
          valid: item.fn?.valid ? (c: UniColor) => item.fn?.valid?.call(null, c, ...combination) : undefined
        })
      }
    } else {
      acc.push(item)
    }

    return acc
  },
  <SortingMethod[]>[]
)
