import { identity, sample } from 'lodash-es'
import Prando from 'prando'
// import readline from 'readline/promises'
import invariant from 'tiny-invariant'
import { z } from 'zod'
import {
  Node,
  NodeColor,
  NodeItem,
  NodeRef,
  NodeType,
} from './node'
import {
  shuffle as _shuffle,
  addNode,
  connect,
  parseNodeId,
} from './util'

const SHUFFLE: boolean = true

const SEED: number | undefined = undefined
const seed = SEED ?? Math.floor(Math.random() * 1000)

console.log(`seed: ${seed}`)

const rng = new Prando(seed)

const shuffle: <T>(arr: T) => T = SHUFFLE
  ? _shuffle(rng.next.bind(rng))
  : identity

export const UpdateType = z.enum(['Tick'])
export type UpdateType = z.infer<typeof UpdateType>

export const Game = z.strictObject({
  tick: z.number(),
  updateType: UpdateType.nullable(),
  nodes: z.record(z.string(), Node),

  nextItemId: z.number(),
})
export type Game = z.infer<typeof Game>

export function initGame(): Game {
  const nodes: Game['nodes'] = {}

  const config = [
    {
      id: '0.0',
      outputs: ['0.1'],
    },
    {
      id: '0.1',
      outputs: ['1.1'],
    },
    {
      id: '1.1',
      outputs: ['1.0'],
    },
    {
      id: '1.0',
      outputs: ['0.0', '2.0'],
    },
    {
      id: '-1.0',
      outputs: ['0.0'],
      type: NodeType.enum.Producer,
    },
    {
      id: '2.0',
      outputs: [],
      type: NodeType.enum.Consumer,
    },
  ] satisfies {
    id: string
    outputs: string[]
    type?: NodeType
  }[]

  for (const { id, type } of config) {
    const p = parseNodeId(id)
    addNode(nodes, { p, type })
  }

  for (const { id: inputId, outputs } of config) {
    for (const outputId of outputs) {
      connect(nodes, inputId, outputId)
    }
  }

  return {
    tick: 0,
    updateType: null,
    nodes,
    nextItemId: 0,
  }
}

export function step(game: Game) {
  game.tick += 1
  game.updateType = UpdateType.enum.Tick
  const { nodes } = game

  function refToNode({ id }: NodeRef) {
    const node = nodes[id]
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

    if (node.item) {
      node.item.tick += 1
    }

    if (node.type === NodeType.enum.Consumer) {
      if (node.item && node.item.tick > 0) {
        node.item = null
      }
      return
    }

    if (node.type === NodeType.enum.Producer) {
      if (!node.item && rng.next() < node.rate) {
        node.item = {
          id: `${game.nextItemId++}`,
          tick: 0,
          color: sample(NodeColor.options),
        }
      }
    }

    invariant(!path.has(node))
    path.add(node)

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

  for (const root of shuffle(Object.values(nodes))) {
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
