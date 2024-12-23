import invariant from 'tiny-invariant'
import { Vec2 } from '../common/vec2'

export type Path = Vec2[]

export type PathStart = 'x' | 'y'

export interface PathState {
  first: Vec2
  last: Vec2
  delta: Vec2
  start: PathStart | null
}

export function buildPath(state: PathState): Path {
  const { first, last, delta, start } = state
  const path: Path = []
  if (first.equals(last)) {
    path.push(first)
    return path
  }

  invariant(start !== null)

  if (start === 'x') {
    for (let x = 0; x < Math.abs(delta.x); x++) {
      path.push(
        first.add(new Vec2(x * Math.sign(delta.x), 0)),
      )
    }
    for (let y = 0; y < Math.abs(delta.y) + 1; y++) {
      path.push(
        first.add(
          new Vec2(delta.x, y * Math.sign(delta.y)),
        ),
      )
    }
  } else {
    invariant(start === 'y')
    for (let y = 0; y < Math.abs(delta.y); y++) {
      path.push(
        first.add(new Vec2(0, y * Math.sign(delta.y))),
      )
    }
    for (let x = 0; x < Math.abs(delta.x) + 1; x++) {
      path.push(
        first.add(
          new Vec2(x * Math.sign(delta.x), delta.y),
        ),
      )
    }
  }

  return path
}
