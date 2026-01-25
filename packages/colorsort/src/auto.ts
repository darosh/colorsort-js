import { MASTER_LCH } from './index.ts'
import { compareColors } from './vector.ts'
import { Fingerprint, metricsFftFingerprint } from './metrics-fft.ts'
import { cosineSimilarity } from './similarity.ts'

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
  let num = colors.length

  while (!selected.length) {
    selected = trained.filter((t) => t.colors === num)
    num--
  }

  let { fingerprint } = metricsFftFingerprint(lchColors).analysis

  fingerprint = <Fingerprint>fix(<Fingerprint>fingerprint)

  selected.sort((a, b) => (b.fingerprint && fingerprint ? cosineSimilarity(fingerprint, fix(b.fingerprint)) : 0) - (a.fingerprint && fingerprint ? cosineSimilarity(fingerprint, fix(a.fingerprint)) : 0))

  const noDB = selected
    .filter(x => !x.mid.startsWith('DBSCAN'))
    .filter(x => !x.mid.startsWith('RAW'))
    .filter(x => !x.mid.startsWith('CL'))
    .filter(x => !x.mid.startsWith('SPI'))
    .filter(x => !x.mid.startsWith('KM'))
    .filter(x => !x.mid.startsWith('CYL'))
  
  if (noDB.length) {
    return noDB[0].mid
  }
  
  return selected[0].mid
}
