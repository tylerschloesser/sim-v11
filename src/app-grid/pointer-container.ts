import * as PIXI from 'pixi.js'
import { Vec2 } from '../common/vec2'
import { AppViewType } from './app-view'
import { CELL_SIZE } from './const'

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

  // @ts-expect-error
  update(screen: Vec2, viewType: AppViewType): void {
    this.g.visible = true
    this.g.position.set(screen.x, screen.y)
  }

  hide(): void {
    this.g.visible = false
  }
}
