export function randomizer(p = 1) {
  let previous = p

  return () => {
    previous = (previous * 16807) % 2147483647
    return previous / 2147483647
  }
}
