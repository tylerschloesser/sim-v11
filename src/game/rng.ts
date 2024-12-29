import { identity } from 'lodash-es'
import Prando from 'prando'
import { shuffle as _shuffle } from './util'

const SHUFFLE: boolean = true

const SEED: number | undefined = undefined
const seed = SEED ?? Math.floor(Math.random() * 1000)

console.log(`seed: ${seed}`)

export const rng = new Prando(seed)

export const shuffle: <T>(arr: T) => T = SHUFFLE
  ? _shuffle(rng.next.bind(rng))
  : identity
