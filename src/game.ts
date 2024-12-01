import { identity, shuffle } from 'lodash-es'
import invariant from 'tiny-invariant'
import { z } from 'zod'
import { ZVec2 } from './vec2'

const SHUFFLE: boolean = true

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

export function initNodes() {
  const nodes = new Map<string, Node>()

  ;(
    [
      {
        id: '0',
        p: { x: 0, y: 0 },
        item: { tick: 0 },
        inputs: [{ id: '3' }, { id: '5' }],
        outputs: [{ id: '1' }, { id: '6' }],
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
        p: { x: -1, y: 1 },
        item: null,
        inputs: [{ id: '3' }],
        outputs: [{ id: '5' }],
      },
      {
        id: '5',
        p: { x: -1, y: 0 },
        item: null,
        inputs: [{ id: '4' }],
        outputs: [{ id: '0' }],
      },
      {
        id: '6',
        p: { x: 0, y: -1 },
        item: null,
        inputs: [{ id: '0' }],
        outputs: [{ id: '7' }],
      },
      {
        id: '7',
        p: { x: -1, y: -1 },
        item: null,
        inputs: [{ id: '6' }],
        outputs: [{ id: '5' }],
      },
    ] satisfies Node[]
  ).forEach((node) => {
    nodes.set(node.id, node)
  })

  return nodes
}

export function step(nodes: Map<string, Node>) {
  function refToNode({ id }: NodeRef) {
    const node = nodes.get(id)
    invariant(node)
    return node
  }

  const seen = new Set<Node>()
  const path = new Set<Node>()
  const loop = new Map<Node, NodeItem>()

  function visit(node: Node) {
    invariant(!seen.has(node))
    seen.add(node)

    invariant(!path.has(node))
    path.add(node)

    if (node.item) {
      node.item.tick += 1
    }

    // randomize output order
    const outputs = (SHUFFLE ? shuffle : identity<Node[]>)(
      node.outputs.map(refToNode),
    )

    for (const output of outputs) {
      if (path.has(output)) {
        if (!loop.has(output) && node.item) {
          loop.set(output, node.item)
          node.item = null
        }
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

    const item = loop.get(node)
    if (item) {
      invariant(node.item === null)
      node.item = item
      node.item.tick = 0
      loop.delete(node)
    }

    path.delete(node)
  }

  for (const root of (SHUFFLE ? shuffle : identity<Node[]>)(
    Array.from(nodes.values()),
  )) {
    if (!seen.has(root)) {
      visit(root)
      invariant(path.size === 0)
      invariant(loop.size === 0)
    }
  }
}

// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// })
//
// const NODES = initNodes()
// console.log(NODES)
// rl.on('line', () => {
//   step(NODES)
//   console.log(NODES)
// })
