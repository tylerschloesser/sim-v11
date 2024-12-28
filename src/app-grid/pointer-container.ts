import * as PIXI from 'pixi.js'
import { Vec2 } from '../common/vec2'
import { AppViewType } from './app-view'
import { CELL_SIZE } from './const'

export class PointerContainer extends PIXI.Container {
  private readonly g: PIXI.Graphics = new PIXI.Graphics({
    visible: false,
  })

  private viewType?: AppViewType

  constructor() {
    super()
    this.addChild(this.g)
  }

  update(screen: Vec2, viewType: AppViewType): void {
    if (this.viewType !== viewType) {
      this.viewType = viewType
      this.g.clear()
      switch (viewType) {
        case AppViewType.Home:
        case AppViewType.AddNode: {
          this.g.rect(0, 0, CELL_SIZE, CELL_SIZE)
          this.g.stroke({
            color: 'white',
            width: 2,
          })
          break
        }
        case AppViewType.AddForm: {
          this.g.rect(0, 0, CELL_SIZE * 4, CELL_SIZE * 6)
          this.g.stroke({
            color: 'white',
            width: 2,
          })
          break
        }
      }
      return
    }

    this.g.visible = true
    this.g.position.set(screen.x, screen.y)
  }

  hide(): void {
    this.g.visible = false
  }
}
