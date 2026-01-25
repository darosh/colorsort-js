import { oklch } from './color.ts'
import { compareColors } from './vector.ts'
import { metricsFftFingerprint } from './metrics-fft.ts'
import { cosineSimilarity } from './similarity.ts'

export interface Trained {
  mid: string
  colors: number
  fingerprint: number[]
}

export function getAuto(colors: string[], trained: Trained[]) {
  const lchColors = colors.map(oklch).sort(compareColors)

  let selected: Trained[] = []
  let num = colors.length

  while (!selected.length) {
    selected = trained.filter((t) => t.colors === num)
    num--
  }

  const { fingerprint } = metricsFftFingerprint(lchColors).analysis

  selected.sort((a, b) => (b.fingerprint && fingerprint ? cosineSimilarity(fingerprint, b.fingerprint) : 0) - (a.fingerprint && fingerprint ? cosineSimilarity(fingerprint, a.fingerprint) : 0))

  return selected[0].mid
}
