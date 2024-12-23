import { isEqual } from 'lodash-es'
import invariant from 'tiny-invariant'
import { Vec2 } from '../common/vec2'
import { Game } from '../game'
import {
  Node,
  ItemColor,
  NodeItem,
  NodeRef,
  NodeType,
} from '../game/node'
import { TextureId } from '../textures'

type Direction = 'n' | 's' | 'e' | 'w'

export interface NodeView {
  id: string
  p: Vec2
  textureId: TextureId
  outputs: Direction[]
}

interface ItemView {
  id: string
  p: Vec2
  color: string
}

export interface GameView {
  nodes: Record<string, NodeView>
  items: Record<string, ItemView>
}

export function gameToGameView(game: Game): GameView {
  function refToNode({ id }: NodeRef) {
    const node = game.nodes[id]
    invariant(node)
    return node
  }

  const view: GameView = {
    nodes: {},
    items: {},
  }

  for (const node of Object.values(game.nodes)) {
    const textureId = nodeTextureId(node)

    function outputToDirection(output: Node): Direction {
      const dx = output.p.x - node.p.x
      const dy = output.p.y - node.p.y
      if (dx === 0 && dy === -1) {
        return 'n'
      }
      if (dx === 0 && dy === 1) {
        return 's'
      }
      if (dx === 1 && dy === 0) {
        return 'e'
      }
      if (dx === -1 && dy === 0) {
        return 'w'
      }
      throw new Error('Invalid output direction')
    }

    const outputs = node.outputs
      .map(refToNode)
      .map(outputToDirection)
    outputs.sort()

    const nodeView: NodeView = {
      id: node.id,
      p: new Vec2(node.p),
      outputs,
      textureId,
    }

    if (!isEqual(view.nodes[node.id], nodeView)) {
      view.nodes[node.id] = nodeView
    }

    if (!node.item) {
      continue
    }

    const itemView: ItemView = {
      id: node.item.id,
      p: new Vec2(node.p),
      color: itemColor(node.item),
    }

    view.items[node.item.id] = itemView
  }
  return view
}

function itemColor(item: NodeItem): string {
  const s = item.purity * 100
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

function nodeTextureId(node: Node): TextureId {
  switch (node.type) {
    case NodeType.enum.Normal:
      return TextureId.enum.NodeNormal
    case NodeType.enum.Consumer:
      return TextureId.enum.NodeConsumer
    case NodeType.enum.Producer:
      return TextureId.enum.NodeProducer
  }
}
