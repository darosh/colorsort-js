import levenshtein from 'js-levenshtein'

export function paletteDistance(a, b) {
  const map = new Map()

  a.forEach((c) => {
    map.set(c, String.fromCharCode(map.size + 32))
  })

  const ta = map.values().toArray().join('')
  const tb = b.map((c) => map.get(c)).join('')

  return levenshtein(ta, tb) / a.length
}
