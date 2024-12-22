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
  invariant(p.equals(p.floor()))
  const id = `${p.x}.${p.y}`

  const node: Node = {
    id,
    p,
    item: null,
    outputs: [],
    type,
  }

  invariant(!nodes.has(id))
  nodes.set(id, node)
}

export function connect(
  nodes: Game['nodes'],
  inputId: string,
  outputId: string,
): void {
  invariant(inputId !== outputId)
  const input = nodes.get(inputId)
  invariant(input)

  invariant(nodes.has(outputId))

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
