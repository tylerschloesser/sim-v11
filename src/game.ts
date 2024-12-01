import invariant from 'tiny-invariant'
import { z } from 'zod'
import { ZVec2 } from './vec2'

export const NodeRef = z.strictObject({
  id: z.string(),
})
export type NodeRef = z.infer<typeof NodeRef>

export const NodeItem = z.strictObject({
  tick: z.number(),
})
export type NodeItem = z.infer<typeof NodeItem>

export const Node = z.strictObject({
  id: z.string(),
  p: ZVec2,
  item: NodeItem.nullable(),
  inputs: NodeRef.array(),
  outputs: NodeRef.array(),
})
export type Node = z.infer<typeof Node>

const NODES = new Map<string, Node>()

;(
  [
    {
      id: '0',
      p: { x: 0, y: 0 },
      item: { tick: 0 },
      // inputs: [{ id: '3' }],
      inputs: [],
      outputs: [{ id: '1' }],
    },
    {
      id: '1',
      p: { x: 1, y: 0 },
      item: null,
      inputs: [{ id: '0' }],
      outputs: [{ id: '2' }],
    },
    {
      id: '2',
      p: { x: 1, y: 1 },
      item: null,
      inputs: [{ id: '1' }],
      // outputs: [{ id: '3' }],
      outputs: [],
    },
    // {
    //   id: '3',
    //   p: { x: 0, y: 1 },
    //   item: null,
    //   inputs: [{ id: '2' }],
    //   outputs: [{ id: '0' }],
    // },
  ] satisfies Node[]
).forEach((node) => {
  NODES.set(node.id, node)
})

function step(nodes: Map<string, Node>) {
  function refToNode({ id }: NodeRef) {
    const node = nodes.get(id)
    invariant(node)
    return node
  }

  const seen = new Set<Node>()

  function visit(node: Node) {
    if (seen.has(node)) {
      invariant(false, 'TODO handle cycle')
    }
    seen.add(node)

    const outputs = node.outputs.map(refToNode)
    outputs.forEach(visit)

    if (node.item) {
      if (node.item.tick === 0) {
        node.item.tick += 1
      } else {
        for (const output of outputs) {
          if (output.item === null) {
            output.item = node.item
            output.item.tick = 0
            node.item = null
            break
          }
        }
      }
    }
  }

  for (const root of nodes.values()) {
    if (!seen.has(root)) {
      visit(root)
    }
  }
}

step(NODES)
step(NODES)
console.log(NODES)
