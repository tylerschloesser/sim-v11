import { curry } from 'lodash-es'
import invariant from 'tiny-invariant'
import { Game } from '.'
import {
  DEFAULT_PRODUCER_RATE,
  DEFAULT_PURIFIER_RATE,
} from '../app-grid/const'
import { Vec2 } from '../common/vec2'
import {
  FormLeafNode,
  FormRootNode,
  Node,
  NodeType,
} from './node'

export const shuffle = curry(function <T>(
  rng: () => number,
  array: T[],
): T[] {
  const result = array.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
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

  const outputs: Node['outputs'] = []
  const itemId: Node['itemId'] = null
  let node: Node

  invariant(type !== NodeType.enum.FormRoot)
  invariant(type !== NodeType.enum.FormLeaf)

  switch (type) {
    case NodeType.enum.Normal: {
      node = { id, p, itemId, outputs, type }
      break
    }
    case NodeType.enum.Consumer: {
      node = { id, p, itemId, outputs, type }
      break
    }
    case NodeType.enum.Producer: {
      const rate = DEFAULT_PRODUCER_RATE
      node = { id, p, itemId, outputs, type, rate }
      break
    }
    case NodeType.enum.Purifier: {
      const rate = DEFAULT_PURIFIER_RATE
      node = { id, p, itemId, outputs, type, rate }
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
      outputs: [],
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
          outputs: [],
        }
      }
    }
  }

  for (const node of iterateFormNodes()) {
    nodes[node.id] = node
  }
}

export function connect(
  nodes: Game['nodes'],
  inputId: string,
  outputId: string,
): void {
  invariant(inputId !== outputId)
  const input = nodes[inputId]
  invariant(input)

  invariant(nodes[outputId])

  invariant(input.outputs.every(({ id }) => id !== inputId))

  input.outputs.push({ id: outputId })
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
