import { curry } from 'lodash-es'
import invariant from 'tiny-invariant'
import {
  DEFAULT_PRODUCER_RATE,
  DEFAULT_PURIFIER_RATE,
} from '../app-grid/const'
import { Vec2 } from '../common/vec2'
import { Game } from './game'
import {
  ConsumerNode,
  EnergizerNode,
  FormLeafNode,
  FormRootNode,
  Node,
  NodeState,
  NodeType,
  NormalNode,
  ProducerNode,
  PurifierNode,
} from './node'

export const shuffle = curry(function <T>(
  rng: () => number,
  array: T[],
): T[] {
  const result = array.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
})

export function addNode(
  nodes: Game['nodes'],
  partial: {
    p: Vec2
    type?: NodeType
  },
): void {
  const { p, type = NodeType.enum.Normal } = partial
  const id = toNodeId(p)

  const state: Node['state'] = NodeState.enum.Active
  const outputs: Node['outputs'] = {}
  const itemId: Node['itemId'] = null
  let node: Node

  invariant(type !== NodeType.enum.FormRoot)
  invariant(type !== NodeType.enum.FormLeaf)

  switch (type) {
    case NodeType.enum.Normal: {
      node = { id, p, itemId, outputs, type, state }
      break
    }
    case NodeType.enum.Consumer: {
      node = {
        id,
        p,
        itemId,
        outputs,
        type,
        state,
        stats: {},
      }
      break
    }
    case NodeType.enum.Producer: {
      const rate = DEFAULT_PRODUCER_RATE
      node = {
        id,
        p,
        itemId,
        outputs,
        type,
        state,
        rate,
        power: 0,
      }
      break
    }
    case NodeType.enum.Purifier: {
      const rate = DEFAULT_PURIFIER_RATE
      node = { id, p, itemId, outputs, type, state, rate }
      break
    }
    case NodeType.enum.Energizer: {
      node = {
        id,
        p,
        itemId,
        outputs,
        type,
        state,
        power: 0,
      }
      break
    }
    case NodeType.enum.RobotTerminal: {
      node = { id, p, itemId, outputs, state, type }
      break
    }
  }

  invariant(!nodes[id])
  nodes[id] = node
}

export function addFormNode(
  nodes: Game['nodes'],
  partial: {
    p: Vec2
    size: Vec2
  },
): void {
  invariant(partial.size.x > 0)
  invariant(partial.size.y > 0)

  function* iterateFormNodes(): Generator<
    FormRootNode | FormLeafNode
  > {
    yield {
      type: NodeType.enum.FormRoot,
      p: partial.p,
      id: toNodeId(partial.p),
      itemId: null,
      outputs: {},
      targetNodeId: null,
      state: NodeState.enum.Active,
    }

    for (let x = 0; x < partial.size.x; x++) {
      for (let y = 0; y < partial.size.y; y++) {
        if (x === 0 && y === 0) {
          continue
        }

        const p = partial.p.add(new Vec2(x, y))
        yield {
          type: NodeType.enum.FormLeaf,
          p,
          id: toNodeId(p),
          itemId: null,
          outputs: {},
          state: NodeState.enum.Active,
        }
      }
    }
  }

  for (const node of iterateFormNodes()) {
    nodes[node.id] = node
  }
}

type ConnectResult =
  | { success: true }
  | { success: false; errors: string[] }

export function connect(
  nodes: Game['nodes'],
  inputId: string,
  outputId: string,
): ConnectResult {
  invariant(inputId !== outputId)

  const errors: string[] = []

  const input = nodes[inputId]
  invariant(input)

  if (!isValidInput(input)) {
    errors.push(`Invalid input [${inputId}]`)
  }

  const output = nodes[outputId]
  invariant(output)

  if (!isValidOutput(output)) {
    errors.push(`Invalid output [${outputId}]`)
  }

  const delta = new Vec2(output.p).sub(new Vec2(input.p))

  if (delta.length() !== 1) {
    errors.push(`Invalid distance between nodes`)
  }

  invariant(!input.outputs[inputId])

  if (errors.length === 0) {
    input.outputs[outputId] = true
    return { success: true }
  } else {
    return { success: false, errors }
  }
}

function isValidInput(
  node: Node,
): node is
  | NormalNode
  | ProducerNode
  | PurifierNode
  | EnergizerNode {
  return (
    node.type === NodeType.enum.Normal ||
    node.type === NodeType.enum.Producer ||
    node.type === NodeType.enum.Purifier ||
    node.type === NodeType.enum.Energizer
  )
}

function isValidOutput(
  node: Node,
): node is
  | NormalNode
  | ConsumerNode
  | PurifierNode
  | EnergizerNode {
  return (
    node.type === NodeType.enum.Normal ||
    node.type === NodeType.enum.Consumer ||
    node.type === NodeType.enum.Purifier ||
    node.type === NodeType.enum.Energizer
  )
}

export function parseNodeId(id: string): Vec2 {
  const match = id.match(/^(-?\d+)\.(-?\d+)$/)
  invariant(match?.length === 3)
  return new Vec2(
    parseInt(match.at(1)!),
    parseInt(match.at(2)!),
  )
}

export function toNodeId(p: Vec2): string {
  invariant(p.equals(p.floor()))
  return `${p.x}.${p.y}`
}

export function getNode(game: Game, nodeId: string): Node {
  const node = game.nodes[nodeId]
  invariant(node)
  return node
}

export function getNodeWithType<T extends NodeType>(
  game: Game,
  id: string,
  type: T,
): Extract<Node, { type: T }> {
  const node = getNode(game, id)
  invariant(node.type === type)
  return node as Extract<Node, { type: T }>
}
