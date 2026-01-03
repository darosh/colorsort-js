import { colorVectors, Vector3 } from '../vector.ts'

interface ClusterNode {
  colors: Vector3[]
  left?: ClusterNode
  right?: ClusterNode
  centroid: Vector3
  distance: number
}

function distance(a: Vector3, b: Vector3): number {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  const dz = a[2] - b[2]
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

function centroid(colors: Vector3[]): Vector3 {
  const sum = colors.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]], [0, 0, 0] as Vector3)
  return [sum[0] / colors.length, sum[1] / colors.length, sum[2] / colors.length]
}

function clusterDistance(c1: ClusterNode, c2: ClusterNode, linkage: 'single' | 'complete' | 'average' = 'average'): number {
  switch (linkage) {
    case 'single':
      // Minimum distance between any two points
      let minDist = Infinity
      for (const a of c1.colors) {
        for (const b of c2.colors) {
          minDist = Math.min(minDist, distance(a, b))
        }
      }
      return minDist

    case 'complete':
      // Maximum distance between any two points
      let maxDist = 0
      for (const a of c1.colors) {
        for (const b of c2.colors) {
          maxDist = Math.max(maxDist, distance(a, b))
        }
      }
      return maxDist

    case 'average':
    default:
      // Distance between centroids
      return distance(c1.centroid, c2.centroid)
  }
}

/**
 * Build hierarchical clustering dendrogram
 */
function buildDendrogram(colors: Vector3[], linkage: 'single' | 'complete' | 'average' = 'average'): ClusterNode {
  // Initialize each color as its own cluster
  let clusters: ClusterNode[] = colors.map((c) => ({
    colors: [c],
    centroid: c,
    distance: 0
  }))

  // Agglomeratively merge clusters
  while (clusters.length > 1) {
    let minDist = Infinity
    let mergeI = 0
    let mergeJ = 1

    // Find closest pair of clusters
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const dist = clusterDistance(clusters[i], clusters[j], linkage)
        if (dist < minDist) {
          minDist = dist
          mergeI = i
          mergeJ = j
        }
      }
    }

    // Merge the closest clusters
    const merged: ClusterNode = {
      colors: [...clusters[mergeI].colors, ...clusters[mergeJ].colors],
      left: clusters[mergeI],
      right: clusters[mergeJ],
      centroid: centroid([...clusters[mergeI].colors, ...clusters[mergeJ].colors]),
      distance: minDist
    }

    // Remove merged clusters and add new one
    clusters = clusters.filter((_, idx) => idx !== mergeI && idx !== mergeJ)
    clusters.push(merged)
  }

  return clusters[0]
}

/**
 * Traverse dendrogram to extract ordered colors
 * Different traversal strategies produce different orderings
 */
function traverseDendrogram(node: ClusterNode, strategy: 'depth-first' | 'breadth-first' | 'balanced' = 'balanced'): Vector3[] {
  if (!node.left && !node.right) {
    return node.colors
  }

  if (!node.left || !node.right) {
    return node.colors
  }

  switch (strategy) {
    case 'depth-first':
      // Always go left first, then right
      return [...traverseDendrogram(node.left, strategy), ...traverseDendrogram(node.right, strategy)]

    case 'breadth-first':
      // Process by cluster size (smaller first)
      if (node.left.colors.length <= node.right.colors.length) {
        return [...traverseDendrogram(node.left, strategy), ...traverseDendrogram(node.right, strategy)]
      } else {
        return [...traverseDendrogram(node.right, strategy), ...traverseDendrogram(node.left, strategy)]
      }

    case 'balanced':
    default:
      // Try to alternate between branches for smoother transitions
      const leftColors = traverseDendrogram(node.left, strategy)
      const rightColors = traverseDendrogram(node.right, strategy)

      // Check which arrangement creates smoother transition
      const dist1 = distance(leftColors[leftColors.length - 1], rightColors[0])
      const dist2 = distance(rightColors[rightColors.length - 1], leftColors[0])

      if (dist1 <= dist2) {
        return [...leftColors, ...rightColors]
      } else {
        return [...rightColors, ...leftColors]
      }
  }
}

export function sortByHierarchicalClustering(colors: Vector3[], linkage: 'single' | 'complete' | 'average' = 'average', traversal: 'depth-first' | 'breadth-first' | 'balanced' = 'balanced'): Vector3[] {
  if (colors.length === 0) {
    return []
  }
  if (colors.length === 1) {
    return colors
  }

  const dendrogram = buildDendrogram(colors, linkage)
  return traverseDendrogram(dendrogram, traversal)
}

// ============================================================================
// K-MEANS CLUSTERING WITH ORDERING
// ============================================================================

function randomCentroids(colors: Vector3[], k: number): Vector3[] {
  const shuffled = [...colors].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, k)
}

function assignClusters(colors: Vector3[], centroids: Vector3[]): number[] {
  return colors.map((color) => {
    let minDist = Infinity
    let cluster = 0

    centroids.forEach((centroid, idx) => {
      const dist = distance(color, centroid)
      if (dist < minDist) {
        minDist = dist
        cluster = idx
      }
    })

    return cluster
  })
}

function updateCentroids(colors: Vector3[], assignments: number[], k: number): Vector3[] {
  const newCentroids: Vector3[] = []

  for (let i = 0; i < k; i++) {
    const clusterColors = colors.filter((_, idx) => assignments[idx] === i)
    if (clusterColors.length > 0) {
      newCentroids.push(centroid(clusterColors))
    } else {
      // If cluster is empty, reinitialize randomly
      newCentroids.push(colors[Math.floor(Math.random() * colors.length)])
    }
  }

  return newCentroids
}

/**
 * K-means clustering followed by ordering clusters and points within clusters
 */
export function sortByKMeans(colors: Vector3[], k: number = 8, maxIterations: number = 50): Vector3[] {
  if (colors.length === 0) {
    return []
  }
  if (colors.length <= k) {
    return colors
  }

  // Run k-means
  let centroids = randomCentroids(colors, k)
  let assignments: number[] = []

  for (let iter = 0; iter < maxIterations; iter++) {
    const newAssignments = assignClusters(colors, centroids)

    // Check for convergence
    if (JSON.stringify(newAssignments) === JSON.stringify(assignments)) {
      break
    }

    assignments = newAssignments
    centroids = updateCentroids(colors, assignments, k)
  }

  // Group colors by cluster
  const clusters: Vector3[][] = Array.from({ length: k }, () => [])
  colors.forEach((color, idx) => {
    clusters[assignments[idx]].push(color)
  })

  // Sort clusters by their centroid (e.g., by brightness)
  const clustersWithCentroids = clusters
    .map((cluster, idx) => ({ cluster, centroid: centroids[idx] }))
    .filter((c) => c.cluster.length > 0)
    .sort((a, b) => {
      // Sort by lightness (sum of RGB values)
      const brightnessA = a.centroid[0] + a.centroid[1] + a.centroid[2]
      const brightnessB = b.centroid[0] + b.centroid[1] + b.centroid[2]
      return brightnessA - brightnessB
    })

  // Within each cluster, sort by distance to centroid
  const result: Vector3[] = []
  for (const { cluster, centroid: clusterCentroid } of clustersWithCentroids) {
    const sorted = cluster.sort((a, b) => distance(a, clusterCentroid) - distance(b, clusterCentroid))
    result.push(...sorted)
  }

  return result
}

// ============================================================================
// DBSCAN CLUSTERING WITH CHAIN ORDERING
// ============================================================================

function regionQuery(colors: Vector3[], pointIdx: number, eps: number): number[] {
  const neighbors: number[] = []
  const point = colors[pointIdx]

  colors.forEach((other, idx) => {
    if (distance(point, other) <= eps) {
      neighbors.push(idx)
    }
  })

  return neighbors
}

export function sortByDBSCAN(colors: Vector3[], eps: number = 30, minPts: number = 3): Vector3[] {
  if (colors.length === 0) {
    return []
  }

  const visited = new Set<number>()
  const clusters: number[][] = []
  const noise: number[] = []

  // DBSCAN clustering
  colors.forEach((_, idx) => {
    if (visited.has(idx)) {
      return
    }
    visited.add(idx)

    const neighbors = regionQuery(colors, idx, eps)

    if (neighbors.length < minPts) {
      noise.push(idx)
    } else {
      const cluster: number[] = []
      const queue = [...neighbors]

      while (queue.length > 0) {
        const neighborIdx = queue.shift()!

        if (!visited.has(neighborIdx)) {
          visited.add(neighborIdx)
          const neighborNeighbors = regionQuery(colors, neighborIdx, eps)

          if (neighborNeighbors.length >= minPts) {
            queue.push(...neighborNeighbors)
          }
        }

        cluster.push(neighborIdx)
      }

      clusters.push(cluster)
    }
  })

  // Sort clusters by their average brightness
  clusters.sort((a, b) => {
    const avgA =
      a.reduce((sum, idx) => {
        const c = colors[idx]
        return sum + c[0] + c[1] + c[2]
      }, 0) / a.length

    const avgB =
      b.reduce((sum, idx) => {
        const c = colors[idx]
        return sum + c[0] + c[1] + c[2]
      }, 0) / b.length

    return avgA - avgB
  })

  // Build result: clusters + noise at the end
  const result: Vector3[] = []

  for (const cluster of clusters) {
    // Within cluster, create a chain (nearest neighbor)
    const remaining = new Set(cluster)
    const ordered: number[] = []

    let current = cluster[0]
    ordered.push(current)
    remaining.delete(current)

    while (remaining.size > 0) {
      let nearest = -1
      let minDist = Infinity

      for (const idx of remaining) {
        const dist = distance(colors[current], colors[idx])
        if (dist < minDist) {
          minDist = dist
          nearest = idx
        }
      }

      if (nearest !== -1) {
        ordered.push(nearest)
        remaining.delete(nearest)
        current = nearest
      } else {
        break
      }
    }

    result.push(...ordered.map((idx) => colors[idx]))
  }

  // Add noise points at the end
  result.push(...noise.map((idx) => colors[idx]))

  return result
}

export function clusterRgb(colors: string[]) {
  return colorVectors(colors, sortByHierarchicalClustering, 'gl')
}

export function clusterLab(colors: string[]) {
  return colorVectors(colors, sortByHierarchicalClustering, 'lab-norm')
}

export function clusterOklab(colors: string[]) {
  return colorVectors(colors, sortByHierarchicalClustering, 'oklab')
}

export function kMeansRgb(colors: string[]) {
  return colorVectors(colors, sortByKMeans, 'gl')
}

export function kMeansLab(colors: string[]) {
  return colorVectors(colors, sortByKMeans, 'lab-norm')
}

export function kMeansOklab(colors: string[]) {
  return colorVectors(colors, sortByKMeans, 'oklab')
}

export function dbScanRgb(colors: string[]) {
  return colorVectors(colors, sortByDBSCAN, 'gl')
}

export function dbScanLab(colors: string[]) {
  return colorVectors(colors, sortByDBSCAN, 'lab-norm')
}

export function dbScanOklab(colors: string[]) {
  return colorVectors(colors, sortByDBSCAN, 'oklab')
}
