import * as PIXI from 'pixi.js'
import invariant from 'tiny-invariant'
import { Item, ItemColor } from '../game/item'
import { CELL_SIZE, MAX_PURITY } from './const'

export class ItemContainer extends PIXI.Container {
  private item: Item
  private readonly g: PIXI.Graphics = new PIXI.Graphics()

  constructor(item: Item) {
    super()
    this.item = item
    this.addChild(this.g)
    this.update(item, true)
  }

  public update(
    item: Item,
    initial: boolean = false,
  ): void {
    if (
      initial ||
      this.item.color !== item.color ||
      this.item.purity !== item.purity
    ) {
      this.updateColor(item)
    }
    if (initial || this.item.p !== item.p) {
      this.updatePosition(item)
    }
  }

  private updateColor(item: Item) {
    this.g.clear()
    this.g.rect(
      CELL_SIZE * 0.2,
      CELL_SIZE * 0.2,
      CELL_SIZE * 0.6,
      CELL_SIZE * 0.6,
    )
    this.g.fill({ color: resolveColor(item) })
  }

  private updatePosition(item: Item) {
    this.position.set(
      item.p.x * CELL_SIZE,
      item.p.y * CELL_SIZE,
    )
  }
}

function resolveColor(item: Item): string {
  const s = item.purity * (100 / MAX_PURITY)
  invariant(s >= 0 && s <= 100)
  const l = 50
  const o = 1
  switch (item.color) {
    case ItemColor.enum.Green:
      return `hsla(120, ${s}%, ${l}%, ${o.toFixed(2)})`
    case ItemColor.enum.Red:
      return `hsla(0, ${s}%, ${l}%, ${o.toFixed(2)})`
    case ItemColor.enum.Blue:
      return `hsla(240, ${s}%, ${l}%, ${o.toFixed(2)})`
  }
}
