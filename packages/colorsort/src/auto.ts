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

  return selected[0].mid
}
