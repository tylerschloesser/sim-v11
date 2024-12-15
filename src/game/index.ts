import { identity, sample } from 'lodash-es'
import Prando from 'prando'
// import readline from 'readline/promises'
import invariant from 'tiny-invariant'
import { z } from 'zod'
import { ZVec2 } from '../common/vec2'
import { shuffle as _shuffle } from './util'

const SHUFFLE: boolean = true

const SEED: number | undefined = undefined
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

export const NodeColor = z.enum(['Green', 'Blue', 'Red'])
export type NodeColor = z.infer<typeof NodeColor>

export const NodeItem = z.strictObject({
  id: z.string(),
  tick: z.number(),
  color: NodeColor,
})
export type NodeItem = z.infer<typeof NodeItem>

export const NodeType = z.enum([
  'Normal',
  'Consumer',
  'Producer',
])
export type NodeType = z.infer<typeof NodeType>

export const Node = z.strictObject({
  id: z.string(),
  type: NodeType,
  p: ZVec2,
  item: NodeItem.nullable(),
  outputs: NodeRef.array(),
})
export type Node = z.infer<typeof Node>

export const UpdateType = z.enum(['Tick'])
export type UpdateType = z.infer<typeof UpdateType>

export const Game = z.strictObject({
  tick: z.number(),
  updateType: UpdateType.nullable(),
  nodes: z.map(z.string(), Node),

  nextItemId: z.number(),
})
export type Game = z.infer<typeof Game>

export function initGame(): Game {
  const nodes = new Map<string, Node>()

  let nextItemId = 0
  function addNode(
    id: string,
    [px, py]: [number, number],
    outputIds: string[],
    item: boolean = false,
    type: NodeType = NodeType.enum.Normal,
  ) {
    invariant(!nodes.has(id))
    nodes.set(id, {
      id,
      type,
      p: { x: px, y: py },
      item: item
        ? {
            id: `${nextItemId++}`,
            tick: 0,
            color: NodeColor.enum.Green,
          }
        : null,
      outputs: outputIds.map((id) => ({ id })),
    })
  }

  addNode('0', [0, 0], ['1'], true)
  addNode('1', [0, 1], ['2'])
  addNode('2', [1, 1], ['3'])
  addNode('3', [1, 0], ['0', '4'])

  addNode('4', [2, 0], ['5', '6'])
  addNode('5', [2, 1], ['2'])

  addNode('6', [3, 0], ['7'])
  addNode('7', [4, 0], ['8'])
  addNode('8', [4, 1], ['9'])
  addNode('9', [4, 2], ['10', '15'])
  addNode('10', [4, 3], ['11'], true)
  addNode('11', [3, 3], ['12'])
  addNode('12', [2, 3], ['13'])
  addNode('13', [1, 3], ['14'], true)
  addNode('14', [1, 2], ['2'])

  addNode('15', [5, 2], [], false, NodeType.enum.Consumer)
  // prettier-ignore
  addNode('16', [0, 3], ['13'], false, NodeType.enum.Producer)

  return {
    tick: 0,
    updateType: null,
    nodes,
    nextItemId,
  }
}

export function step(game: Game) {
  game.tick += 1
  game.updateType = UpdateType.enum.Tick
  const { nodes } = game

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
      invariant(node.outputs.length === 1)
      const output = refToNode(node.outputs.at(0)!)
      if (output.item === null && rng.next() < 0.1) {
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
