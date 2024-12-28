import { identity, sample } from 'lodash-es'
import Prando from 'prando'
import invariant from 'tiny-invariant'
import { z } from 'zod'
import { MAX_PURITY } from '../app-grid/const'
import { Item, ItemColor } from './item'
import { Node, NodeRef, NodeType } from './node'
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

export const Game = z
  .strictObject({
    tick: z.number(),
    updateType: UpdateType.nullable(),
    nodes: z.record(z.string(), Node),
    items: z.record(z.string(), Item),

    nextItemId: z.number(),
  })
  .superRefine((game, context) => {
    const seen = new Set<string>()
    const extra = new Set(Object.keys(game.items))
    for (const node of Object.values(game.nodes)) {
      if (node.itemId === null) {
        continue
      }
      extra.delete(node.itemId)
      if (seen.has(node.itemId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate item [id=${node.itemId}][nodeId=${node.id}]`,
        })
      }
      seen.add(node.itemId)

      const item = game.items[node.itemId]
      if (!item) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Missing item [id=${node.itemId}][nodeId=${node.id}]`,
        })
      }
    }

    for (const id of extra) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Extra item [id=${id}]`,
      })
    }
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
    items: {},
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

  function idToItem(id: string): Item {
    const item = game.items[id]
    invariant(item)
    return item
  }

  const seen = new Set<Node>()
  const path = new Set<Node>()

  let loop: {
    root: Node
    item: Item | null
  } | null = null

  function visit(node: Node) {
    invariant(!seen.has(node))
    seen.add(node)

    let item: Item | null = node.itemId
      ? idToItem(node.itemId)
      : null
    if (item) {
      item.tick += 1
    }

    switch (node.type) {
      case NodeType.enum.Consumer: {
        if (item && item.tick > 0) {
          delete game.items[item.id]
          node.itemId = null
        }
        // consumers can't output
        return
      }
      case NodeType.enum.Producer: {
        if (!item && rng.next() < node.rate) {
          item = {
            id: `${game.nextItemId++}`,
            nodeId: node.id,
            prevNodeId: null,
            tick: 0,
            color: sample(ItemColor.options),
            purity: 0,
          }
          node.itemId = item.id
          game.items[item.id] = item
        }
        break
      }
      case NodeType.enum.Purifier: {
        if (item && rng.next() < node.rate) {
          item.purity = Math.min(
            item.purity + 1,
            MAX_PURITY,
          )
        }
        break
      }
    }

    invariant(!path.has(node))
    path.add(node)

    // randomize output order
    const outputs = shuffle(node.outputs.map(refToNode))

    for (const output of outputs) {
      if (path.has(output)) {
        invariant(loop === null)
        loop = { root: output, item }
        node.itemId = null
        break
      }

      if (!seen.has(output)) {
        visit(output)
      }

      if (
        item &&
        output.itemId === null &&
        isOutputEligible(node, item)
      ) {
        output.itemId = item.id
        node.itemId = null
        item.prevNodeId = item.nodeId
        item.nodeId = output.id
        item.tick = 0
        item = null
      }

      if (loop) {
        break
      }
    }

    if (loop?.root === node) {
      if (loop.item) {
        node.itemId = loop.item.id
        loop.item.prevNodeId = loop.item.nodeId
        loop.item.nodeId = node.id
        loop.item.tick = 0
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

  try {
    Game.parse(game)
  } catch (e) {
    debugger
  }
}

function isOutputEligible(node: Node, item: Item): boolean {
  invariant(node.itemId === item.id)
  invariant(item.nodeId === node.id)

  switch (node.type) {
    case NodeType.enum.Purifier: {
      return item.purity >= 10
    }
    case NodeType.enum.Producer:
    case NodeType.enum.Normal:
      return item.tick >= 1
    default:
      invariant(false)
  }
}
