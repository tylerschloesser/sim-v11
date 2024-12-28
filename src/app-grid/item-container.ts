import * as PIXI from 'pixi.js'
import { Vec2 } from '../common/vec2'
import { CELL_SIZE } from './const'
import { ItemViewV2 } from './game-view'

export class ItemContainer extends PIXI.Container {
  private color: string
  private p: Vec2 | null
  private readonly g: PIXI.Graphics = new PIXI.Graphics()

  constructor(view: ItemViewV2) {
    super()
    this.color = view.color
    this.p = view.p.prev
    this.addChild(this.g)

    this.onUpdateColor()
    this.onUpdatePosition()
  }

  public update(view: ItemViewV2): void {
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
    if (this.p === null) {
      this.g.visible = false
    } else {
      this.g.visible = true
      this.position.set(
        this.p.x * CELL_SIZE,
        this.p.y * CELL_SIZE,
      )
    }
  }
}
