import * as PIXI from 'pixi.js'
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

    for (const cell of path) {
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
