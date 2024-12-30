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
    this.p = view.p.prev
    this.addChild(this.g)

    this.onUpdateColor()
    this.onUpdatePosition()
  }

  public update(view: ItemView): void {
    if (this.color !== view.color) {
      this.color = view.color
      this.onUpdateColor()
    }
    if (view.p.prev && !this.p?.equals(view.p.prev)) {
      this.p = view.p.prev
      this.onUpdatePosition()
    }
  }

  private onUpdateColor() {
    this.g.clear()
    this.g.rect(
      CELL_SIZE * 0.2,
      CELL_SIZE * 0.2,
      CELL_SIZE * 0.6,
      CELL_SIZE * 0.6,
    )
    this.g.fill({ color: this.color })
  }

  private onUpdatePosition() {
    this.g.visible = true
    this.position.set(
      this.p.x * CELL_SIZE,
      this.p.y * CELL_SIZE,
    )
  }
}
