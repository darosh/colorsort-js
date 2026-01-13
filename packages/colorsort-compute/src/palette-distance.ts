import levenshtein from 'js-levenshtein'

export function paletteMap(a: string[]) {
  const map = new Map()

  for (const c of a) {
    map.set(c, String.fromCharCode(map.size + 32))
  }

  return map
}

export function paletteDistance(map: Map<string, number>, b: string[]) {
  const ta = map.values().toArray().join('')
  const tb = b.map((c) => map.get(c)).join('')

  return levenshtein(ta, tb) / b.length
}
