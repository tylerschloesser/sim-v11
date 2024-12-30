import invariant from 'tiny-invariant'
import { Vec2 } from '../common/vec2'
import { Game } from '../game/game'
import { Item, ItemColor } from '../game/item'
import { Node, NodeState } from '../game/node'
import { TextureId } from '../textures'
import { MAX_PURITY } from './const'

type Direction = 'n' | 's' | 'e' | 'w'

export interface NodeView {
  id: string
  p: Vec2
  textureId: TextureId
  outputs: Direction[]
  state: NodeState
}

export interface ItemView {
  id: string
  p: {
    prev: Vec2
    next: Vec2
  }
  color: string
}

export interface GameView {
  items: Record<string, ItemView>
}

export function gameToGameView(game: Game): GameView {
  const view: GameView = {
    items: {},
  }

  for (const item of Object.values(game.items)) {
    const node = game.nodes[item.nodeId]
    invariant(node)
    let prev: Node | null = null
    if (item.prevNodeId && item.tick === 0) {
      prev = game.nodes[item.prevNodeId]!
      invariant(prev)
    }

    view.items[item.id] = {
      id: item.id,
      p: {
        prev: prev ? new Vec2(prev.p) : new Vec2(node.p),
        next: new Vec2(node.p),
      },
      color: itemColor(item),
    }
  }

  return view
}

function itemColor(item: Item): string {
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
