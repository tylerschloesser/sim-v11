import * as PIXI from 'pixi.js'
import { CELL_SIZE } from './const'
import { Hover } from './hover'

export class PointerContainer extends PIXI.Container {
  private readonly g: PIXI.Graphics = new PIXI.Graphics({
    visible: false,
  })

  constructor() {
    super()

    this.g.rect(0, 0, CELL_SIZE, CELL_SIZE)
    this.g.stroke({
      color: 'white',
      width: 2,
    })

    this.addChild(this.g)
  }

  update(hover: Hover): void {
    this.g.visible = true
    this.g.position.set(hover.p.x, hover.p.y)
  }

  hide(): void {
    this.g.visible = false
  }
}
