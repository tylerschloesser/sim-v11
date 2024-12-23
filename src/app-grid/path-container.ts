import * as PIXI from 'pixi.js'
import invariant from 'tiny-invariant'
import { Vec2 } from '../common/vec2'
import { Path } from './path'

export class PathContainer extends PIXI.Container {
  private readonly g: PIXI.Graphics = new PIXI.Graphics({
    visible: false,
  })

  constructor() {
    super()
    this.addChild(this.g)
  }

  public update(path: Path | null, cellSize: number): void {
    if (path === null) {
      this.g.visible = false
      return
    }

    this.g.clear()
    this.g.visible = true

    for (const cell of iteratePath(path)) {
      this.g.rect(
        cell.x * cellSize,
        cell.y * cellSize,
        cellSize,
        cellSize,
      )
    }
    this.g.fill({
      color: 'hsl(0, 50%, 50%)',
    })
  }
}

function* iteratePath(path: Path): Generator<Vec2> {
  const delta = path.last.sub(path.first)
  if (delta.length() === 0) {
    yield path.first
    return
  }

  invariant(path.start !== null)

  if (path.start === 'x') {
    for (let x = 0; x < Math.abs(delta.x); x++) {
      yield path.first.add(
        new Vec2(x * Math.sign(delta.x), 0),
      )
    }
    for (let y = 0; y < Math.abs(delta.y) + 1; y++) {
      yield path.first.add(
        new Vec2(delta.x, y * Math.sign(delta.y)),
      )
    }
  } else {
    invariant(path.start === 'y')
    for (let y = 0; y < Math.abs(delta.y); y++) {
      yield path.first.add(
        new Vec2(0, y * Math.sign(delta.y)),
      )
    }
    for (let x = 0; x < Math.abs(delta.x) + 1; x++) {
      yield path.first.add(
        new Vec2(x * Math.sign(delta.x), delta.y),
      )
    }
  }
}
