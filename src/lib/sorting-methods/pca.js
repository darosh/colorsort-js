import chroma from 'chroma-js'

export function pca(colors) {
  const data = colors.map((c) => chroma(c).lab())
  const n = data.length

  // Calculate mean
  const mean = data.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0]).map((v) => v / n)

  // Center the data
  const centered = data.map((p) => [p[0] - mean[0], p[1] - mean[1], p[2] - mean[2]])

  // Compute covariance matrix
  let xx = 0,
    xy = 0,
    xz = 0,
    yy = 0,
    yz = 0,
    zz = 0
  for (const [x, y, z] of centered) {
    xx += x * x
    xy += x * y
    xz += x * z
    yy += y * y
    yz += y * z
    zz += z * z
  }

  // Power iteration for principal component
  let vec = [1, 1, 1]

  for (let iter = 0; iter < 20; iter++) {
    const r = [xx * vec[0] + xy * vec[1] + xz * vec[2], xy * vec[0] + yy * vec[1] + yz * vec[2], xz * vec[0] + yz * vec[1] + zz * vec[2]]
    const mag = Math.hypot(...r)
    vec = r.map((v) => v / mag)
  }

  // Project and sort
  return colors
    .map((c, i) => ({
      color: c,
      score: centered[i][0] * vec[0] + centered[i][1] * vec[1] + centered[i][2] * vec[2]
    }))
    .sort((a, b) => a.score - b.score)
    .map((p) => p.color)
}
