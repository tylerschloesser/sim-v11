import { curry } from 'lodash-es'

export const shuffle = curry(function <T>(
  rng: () => number,
  array: T[],
): T[] {
  const result = array.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
})
