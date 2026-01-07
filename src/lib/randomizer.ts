export function randomizer() {
  let previous = 1

  return () => {
    previous = (previous * 16807) % 2147483647
    return previous / 2147483647
  }
}
