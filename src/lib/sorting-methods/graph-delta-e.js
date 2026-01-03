import chroma from 'chroma-js'

export function graphDeltaE(colors, weights = [1, 1, 1]) {
  const graph = new Map()

  for (let i = 0; i < colors.length; i++) {
    const node = new Set()

    for (let j = 0; j < colors.length; j++) {
      if (i !== j) {
        node.add({
          color: colors[j],
          distance: chroma.deltaE(colors[i], colors[j], weights[0], weights[1], weights[2])
        })
      }
    }

    graph.set(colors[i], node)
  }

  const sortedColors = []
  const visitedColors = new Set()

  function traverse(node) {
    sortedColors.push(node)
    visitedColors.add(node)

    const neighbors = [...graph.get(node)].sort((a, b) => a.distance - b.distance)

    for (const neighbor of neighbors) {
      if (!visitedColors.has(neighbor.color)) {
        traverse(neighbor.color)
      }
    }
  }

  traverse(colors[0])

  return sortedColors
}
