import * as PIXI from 'pixi.js'
import { Vec2 } from '../common/vec2'
import { toNodeId } from '../game/util'
import { Path } from './path'

export class PathContainer extends PIXI.Container {
  private readonly cache = new Map()

  constructor() {
    super()
  }

  public update(path: Path | null): void {
    if (path === null) {
      this.cache.clear()
      this.removeChildren()
      return
    }

    for (const cell of iteratePath(path)) {
      // @ts-expect-error
      const id = toNodeId(cell)
    }
  }
}

function* iteratePath(path: Path): Generator<Vec2> {
  yield path.first
  yield path.last
}
