import { current, original } from 'immer'
import { isEqual, sample } from 'lodash-es'
import invariant from 'tiny-invariant'
import { MAX_PURITY } from '../app-grid/const'
import { Vec2 } from '../common/vec2'
import { Game, UpdateType } from './game'
import { Item, ItemColor } from './item'
import { ConstructJob, DestroyJob, JobType } from './job'
import { Node, NodeState, NodeType } from './node'
import { rng, shuffle } from './rng'
import { deleteNode, getOutputDelta } from './util'

export function tick(game: Game) {
  game.tick += 1
  game.updateType = UpdateType.enum.Tick

  tickNodes(game)
  tickJobs(game)

  try {
    Game.parse(game)
  } catch (e) {
    // @ts-expect-error
    const prev = original(game),
      next = current(game)
    debugger
  }
}

function tickJobs(game: Game): void {
  for (const job of Object.values(game.jobs)) {
    switch (job.type) {
      case JobType.enum.Construct: {
        tickConstructJob(game, job)
        break
      }
      case JobType.enum.Destroy: {
        tickDestroyJob(game, job)
        break
      }
      default: {
        invariant(false)
      }
    }
  }
}

function tickConstructJob(
  game: Game,
  job: ConstructJob,
): void {
  const node = game.nodes[job.nodeId]
  invariant(node)
  invariant(
    node.state === NodeState.enum.PendingConstruction,
  )

  if (job.robotId !== null) {
    const robot = game.robots[job.robotId]
    invariant(robot?.id === job.robotId)

    if (!isEqual(robot.p, node.p)) {
      robot.d = new Vec2(node.p).sub(new Vec2(robot.p))
      robot.p = node.p
    } else {
      robot.d = null
      node.state = NodeState.enum.Active
      delete game.jobs[job.id]
      robot.jobId = null
    }
    return
  }

  const first = Object.values(game.robots).find(
    (robot) => robot.jobId === null,
  )
  if (!first) {
    return
  }

  first.jobId = job.id
  job.robotId = first.id
}

function tickDestroyJob(game: Game, job: DestroyJob): void {
  const node = game.nodes[job.nodeId]
  invariant(node)
  invariant(
    node.state === NodeState.enum.PendingDestruction,
  )

  if (job.robotId !== null) {
    const robot = game.robots[job.robotId]
    invariant(robot?.id === job.robotId)

    if (!isEqual(robot.p, node.p)) {
      robot.d = new Vec2(node.p).sub(new Vec2(robot.p))
      robot.p = node.p
    } else {
      robot.d = null
      deleteNode(game, node.id)
      delete game.jobs[job.id]
      robot.jobId = null
    }
    return
  }

  const first = Object.values(game.robots).find(
    (robot) => robot.jobId === null,
  )
  if (!first) {
    return
  }

  first.jobId = job.id
  job.robotId = first.id
}

function tickNodes(game: Game): void {
  function idToNode(id: string) {
    const node = game.nodes[id]
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
      if (item.d) {
        item.d = null
      }
    }

    function deleteItem(node: Node) {
      invariant(item)
      invariant(node.itemId === item.id)
      node.itemId = null
      delete game.items[item.id]
      item = null
    }

    switch (node.type) {
      case NodeType.enum.Consumer: {
        if (item && item.tick > 0) {
          const statKey = `${item.color}-${item.purity}`
          node.stats[statKey] =
            (node.stats[statKey] ?? 0) + 1
          deleteItem(node)
        }
        // consumers can't output
        return
      }
      case NodeType.enum.Producer: {
        if (!item && rng.next() < node.rate) {
          item = {
            id: `${game.nextItemId++}`,
            nodeId: node.id,
            p: node.p,
            d: null,
            tick: 1,
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
      case NodeType.enum.Energizer: {
        if (
          item &&
          item.tick > 0 &&
          item.color === ItemColor.enum.Green &&
          item.purity > 0
        ) {
          node.power += item.purity
          deleteItem(node)
        }
        break
      }
    }

    invariant(!path.has(node))
    path.add(node)

    // randomize output order
    const outputs = shuffle(
      Object.keys(node.outputs)
        .map(idToNode)
        .filter(isNotPendingConstruction),
    )

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
        item.nodeId = output.id
        item.p = output.p
        item.d = getOutputDelta(node, output)
        item.tick = 0
        item = null
      }

      if (loop) {
        break
      }
    }

    if (loop?.root === node) {
      if (loop.item) {
        const input = idToNode(loop.item.nodeId)
        node.itemId = loop.item.id
        loop.item.nodeId = node.id
        loop.item.p = node.p
        loop.item.d = getOutputDelta(input, node)
        loop.item.tick = 0
      }
      loop = null
    }

    path.delete(node)
  }

  for (const root of shuffle(Object.values(game.nodes))) {
    if (!seen.has(root)) {
      visit(root)
      invariant(path.size === 0)
      invariant(loop === null)
    }
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
    case NodeType.enum.Normal:
    case NodeType.enum.Producer:
    case NodeType.enum.Energizer:
      return item.tick >= 1
    default:
      invariant(false)
  }
}

function isPendingConstruction(node: Node): boolean {
  return node.state === NodeState.enum.PendingConstruction
}

function isNotPendingConstruction(node: Node): boolean {
  return !isPendingConstruction(node)
}
