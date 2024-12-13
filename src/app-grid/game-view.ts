import invariant from 'tiny-invariant'
import { Vec2 } from '../common/vec2'
import {
  Game,
  Node,
  NodeColor,
  NodeItem,
  NodeRef,
  NodeType,
} from '../game'
import { TextureId } from '../textures'

type Direction = 'n' | 's' | 'e' | 'w'

interface NodeView {
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
    const node = game.nodes.get(id)
    invariant(node)
    return node
  }

  const view: GameView = {
    nodes: {},
    items: {},
  }

  for (const node of game.nodes.values()) {
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

    const nodeView: NodeView = {
      id: node.id,
      p: new Vec2(node.p),
      outputs,
      textureId,
    }

    view.nodes[node.id] = nodeView

    if (!node.item) {
      continue
    }

    view.items[node.item.id] = {
      id: node.item.id,
      color: itemColor(node.item),
      p: nodeView.p,
    }
  }
  return view
}

function itemColor(item: NodeItem): string {
  const s = 40
  const l = 50
  const o = 1
  switch (item.color) {
    case NodeColor.enum.Green:
      return `hsla(120, ${s}%, ${l}%, ${o.toFixed(2)})`
    case NodeColor.enum.Red:
      return `hsla(0, ${s}%, ${l}%, ${o.toFixed(2)})`
    case NodeColor.enum.Blue:
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
