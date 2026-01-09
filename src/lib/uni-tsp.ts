import { DistanceT } from './method-runner.ts'

export function tspVectors<T>(colors: T[], distance: DistanceT<T>) {
  let improved = true

  while (improved) {
    improved = false

    for (let i = 0; i < colors.length - 2; i++) {
      for (let j = i + 1; j < colors.length - 1; j++) {
        const d1 = distance(colors[i], colors[i + 1]) + distance(colors[j], colors[j + 1])
        const d2 = distance(colors[i], colors[j]) + distance(colors[i + 1], colors[j + 1])

        if (d2 < d1) {
          colors = [...colors.slice(0, i + 1), ...colors.slice(i + 1, j + 1).reverse(), ...colors.slice(j + 1)]
          improved = true
        }
      }
    }
  }

  return colors
}
