import * as PIXI from 'pixi.js'
import { CELL_SIZE } from './const'
import { SelectState } from './select'

export class SelectContainer extends PIXI.Container {
  private readonly g: PIXI.Graphics = new PIXI.Graphics({
    visible: false,
  })

  constructor() {
    super()
    this.addChild(this.g)
  }

  public update(state: SelectState | null): void {
    if (state === null) {
      this.g.visible = false
      return
    }

    this.g.clear()
    this.g.visible = true

    const size = state.br.sub(state.tl)

    this.g.rect(
      state.tl.x * CELL_SIZE,
      state.tl.y * CELL_SIZE,
      size.x * CELL_SIZE,
      size.y * CELL_SIZE,
    )
    this.g.stroke({
      color: 'white',
      width: 2,
    })
  }
}
