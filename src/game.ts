import { identity } from 'lodash-es'
import Prando from 'prando'
// import readline from 'readline/promises'
import invariant from 'tiny-invariant'
import { z } from 'zod'
import { shuffle as _shuffle } from './util'
import { ZVec2 } from './vec2'

const SHUFFLE: boolean = true

const SEED: number | undefined = 928
const seed = SEED ?? Math.floor(Math.random() * 1000)

console.log(`seed: ${seed}`)

const rng = new Prando(seed)

const shuffle = SHUFFLE
  ? _shuffle(rng.next.bind(rng))
  : identity

export const NodeRef = z.strictObject({
  id: z.string(),
})
export type NodeRef = z.infer<typeof NodeRef>

export const NodeItem = z.strictObject({
  id: z.string(),
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

export const State = z.strictObject({
  tick: z.number(),
  nodes: z.map(z.string(), Node),
})
export type State = z.infer<typeof State>

export function initState(): State {
  const nodes = new Map<string, Node>()

  ;(
    [
      {
        id: '0',
        p: { x: 0, y: 0 },
        item: { id: '0', tick: 0 },
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
        item: { id: '1', tick: 0 },
        inputs: [{ id: '3' }],
        outputs: [{ id: '5' }],
      },
      {
        id: '5',
        p: { x: -1, y: 0 },
        item: { id: '2', tick: 0 },
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

  return {
    tick: 0,
    nodes,
  }
}

export function step(state: State) {
  state.tick += 1
  const { nodes } = state

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
        invariant(loop === null)
        loop = { root: output, item: node.item }
        node.item = null
        break
      }

      if (!seen.has(output)) {
        visit(output)
      }

      if (
        node.item &&
        node.item.tick > 0 &&
        output.item === null
      ) {
        output.item = node.item
        output.item.tick = 0
        node.item = null
      }

      if (loop) {
        break
      }
    }

    if (loop?.root === node) {
      if (loop.item) {
        node.item = loop.item
        node.item.tick = 0
      }
      loop = null
    }

    path.delete(node)
  }

  for (const root of shuffle(Array.from(nodes.values()))) {
    if (!seen.has(root)) {
      visit(root)
      invariant(path.size === 0)
      invariant(loop === null)
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
