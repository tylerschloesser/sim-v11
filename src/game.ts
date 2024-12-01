import { shuffle } from 'lodash-es'
import readline from 'readline/promises'
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
      inputs: [{ id: '3' }],
      // inputs: [],
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
      outputs: [{ id: '3' }],
      // outputs: [],
    },
    {
      id: '3',
      p: { x: 0, y: 1 },
      item: null,
      inputs: [{ id: '2' }],
      outputs: [{ id: '0' }, { id: '4' }],
    },
    {
      id: '4',
      p: { x: 0, y: 2 },
      item: null,
      inputs: [{ id: '3' }],
      outputs: [],
    },
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
  const path = new Set<Node>()

  let loop: {
    root: Node
    item: NodeItem | null
  } | null = null

  function visit(node: Node) {
    invariant(!seen.has(node))
    seen.add(node)

    invariant(!path.has(node))
    path.add(node)

    if (node.item) {
      node.item.tick += 1
    }

    // randomize output order
    const outputs = shuffle(node.outputs.map(refToNode))

    for (const output of outputs) {
      if (path.has(output)) {
        loop = {
          root: output,
          item: node.item,
        }
        node.item = null
        continue
      }
      if (seen.has(output)) {
        continue
      }
      visit(output)

      if (
        node.item &&
        node.item.tick > 0 &&
        output.item === null
      ) {
        output.item = node.item
        output.item.tick = 0
        node.item = null
      }
    }

    if (loop && loop.root === node) {
      invariant(node.item === null)
      node.item = loop.item
      if (node.item) {
        node.item.tick = 0
      }
      loop = null
    }

    path.delete(node)
  }

  for (const root of nodes.values()) {
    if (!seen.has(root)) {
      visit(root)
      invariant(path.size === 0)
      invariant(loop === null)
    }
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

console.log(NODES)
rl.on('line', () => {
  step(NODES)
  console.log(NODES)
})
