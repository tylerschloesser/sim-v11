import { curry } from 'lodash-es'
import invariant from 'tiny-invariant'
import { Game, Node, NodeType } from '.'
import { Vec2 } from '../common/vec2'

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
  const item: Node['item'] = null
  let node: Node

  switch (type) {
    case NodeType.enum.Normal:
      node = { id, p, item, outputs, type }
      break
    case NodeType.enum.Consumer:
      node = { id, p, item, outputs, type }
      break
    case NodeType.enum.Producer:
      const rate = 0.1
      node = { id, p, item: null, outputs, type, rate }
      break
    default:
      invariant(false)
  }

  invariant(!nodes[id])
  nodes[id] = node
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
