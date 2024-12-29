import { current, original } from 'immer'
import { sample } from 'lodash-es'
import invariant from 'tiny-invariant'
import { MAX_PURITY } from '../app-grid/const'
import { Game, UpdateType } from './game'
import { Item, ItemColor } from './item'
import { Node, NodeRef, NodeType } from './node'
import { rng, shuffle } from './rng'

export function tick(game: Game) {
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
          const statKey = `${item.color}-${item.purity}`
          node.stats[statKey] =
            (node.stats[statKey] ?? 0) + 1
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

      if (item && isOutputEligible(node, item, output)) {
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
    // @ts-expect-error
    const prev = original(game),
      next = current(game)
    debugger
  }
}

function isOutputEligible(
  node: Node,
  item: Item,
  output: Node,
): boolean {
  invariant(node.itemId === item.id)
  invariant(item.nodeId === node.id)

  if (output.itemId) {
    return false
  }

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
