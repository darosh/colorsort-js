import { cosineSimilarity, MASTER_LCH } from './index.ts'
import { compareColors } from './vector.ts'
import { Fingerprint, metricsFftFingerprint } from './metrics-fft.ts'
// import { pearsonCorrelation } from './similarity.ts'

const SIMILARITY = cosineSimilarity

export interface Trained {
  mid: string
  colors: number
  fingerprint: number[]
}

function fix(fingerprint: number[]) {
  return fingerprint
}

export function getAuto(colors: string[], trained: Trained[]) {
  const lchColors = colors.map(MASTER_LCH).sort(compareColors)

  let selected: Trained[] = []
  let selected2: Trained[] = []
  let num = colors.length

  while (!selected.length && num > 1) {
    selected = trained.filter((t) => t.colors === num)
    num--
  }

  while (!selected2.length && num > 1) {
    selected2 = trained.filter((t) => t.colors === num)
    num--
  }

  let { fingerprint } = metricsFftFingerprint(lchColors).analysis

  fingerprint = <Fingerprint>fix(<Fingerprint>fingerprint)

  selected.sort((a, b) => (b.fingerprint && fingerprint ? SIMILARITY(fingerprint, fix(b.fingerprint)) : 0) - (a.fingerprint && fingerprint ? SIMILARITY(fingerprint, fix(a.fingerprint)) : 0))
  selected2.sort((a, b) => (b.fingerprint && fingerprint ? SIMILARITY(fingerprint, fix(b.fingerprint)) : 0) - (a.fingerprint && fingerprint ? SIMILARITY(fingerprint, fix(a.fingerprint)) : 0))

  let noDb = [...selected, ...selected2]

  if (colors.length < 64) {
    noDb = noDb.filter((x) => !x.mid.startsWith('RAW'))
  }

  if (colors.length < 32) {
    noDb = noDb.filter((x) => !x.mid.startsWith('RAMPH'))
  }

  if (colors.length < 6) {
    noDb = noDb.filter((x) => !x.mid.startsWith('SPI'))
  }

  if (colors.length < 9) {
    noDb = noDb.filter((x) => !x.mid.startsWith('CYL'))
  }

  // if (colors.length < 13) {
  //   const noDB = selected
  //     .filter(x => !x.mid.startsWith('DBSCAN'))
  //     .filter(x => !x.mid.startsWith('RAW'))
  //     .filter(x => !x.mid.startsWith('CL'))
  //     .filter(x => !x.mid.startsWith('SPI'))
  //     .filter(x => !x.mid.startsWith('KM'))
  //     .filter(x => !x.mid.startsWith('CYL'))
  //
  //   if (noDB.length) {
  //     return noDB[0].mid
  //   }
  // } else if (colors.length < 17) {
  //   const noDB = selected
  //     .filter(x => !x.mid.startsWith('DBSCAN'))
  //     .filter(x => !x.mid.startsWith('RAW'))
  //     .filter(x => !x.mid.startsWith('CL'))
  //
  //   if (noDB.length) {
  //     return noDB[0].mid
  //   }
  // }

  if (noDb.length) {
    return noDb[0].mid
  }

  if (selected.length) {
    return selected[0].mid
  }

  return selected2[0].mid
}
