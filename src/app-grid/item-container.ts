import * as PIXI from 'pixi.js'
import { Vec2 } from '../common/vec2'
import { CELL_SIZE } from './const'
import { ItemView } from './game-view'

export class ItemContainer extends PIXI.Container {
  private color: string
  private p: Vec2
  private readonly g: PIXI.Graphics = new PIXI.Graphics()

  constructor(view: ItemView) {
    super()
    this.color = view.color
    this.p = view.p

    this.position.set(
      this.p.x * CELL_SIZE,
      this.p.y * CELL_SIZE,
    )
    this.draw()

    this.addChild(this.g)
  }

  public update(view: ItemView): void {
    if (this.color !== view.color) {
      this.color = view.color
      this.g.clear()
      this.draw()
    }
    if (!this.p.equals(view.p)) {
      this.p = view.p
      this.position.set(
        this.p.x * CELL_SIZE,
        this.p.y * CELL_SIZE,
      )
    }
  }

  private draw() {
    this.g.rect(
      CELL_SIZE * 0.2,
      CELL_SIZE * 0.2,
      CELL_SIZE * 0.6,
      CELL_SIZE * 0.6,
    )
    this.g.fill({ color: this.color })
  }
}
