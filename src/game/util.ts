import { curry } from 'lodash-es'
import invariant from 'tiny-invariant'
import {
  DEFAULT_PRODUCER_RATE,
  DEFAULT_PURIFIER_RATE,
} from '../app-grid/const'
import { Vec2 } from '../common/vec2'
import { Game } from './game'
import { Item } from './item'
import { Job, JobType } from './job'
import {
  ConsumerNode,
  EnergizerNode,
  FormLeafNode,
  FormRootNode,
  Node,
  NodeState,
  NodeType,
  NormalNode,
  OutputDirection,
  ProducerNode,
  PurifierNode,
} from './node'
import { Robot } from './robot'

export const shuffle = curry(function <T>(
  rng: () => number,
  array: T[],
): T[] {
  const result = array.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
})

export function addNode(
  game: Game,
  partial: {
    p: Vec2
    type?: NodeType
    state?: NodeState
  },
): void {
  const {
    p,
    type = NodeType.enum.Normal,
    state = NodeState.enum.Active,
  } = partial
  const id = toNodeId(p)

  const outputs: Node['outputs'] = {}
  const itemId: Node['itemId'] = null
  let node: Node

  invariant(type !== NodeType.enum.FormRoot)
  invariant(type !== NodeType.enum.FormLeaf)

  switch (type) {
    case NodeType.enum.Normal: {
      node = { id, p, itemId, outputs, type, state }
      break
    }
    case NodeType.enum.Consumer: {
      node = {
        id,
        p,
        itemId,
        outputs,
        type,
        state,
        stats: {},
      }
      break
    }
    case NodeType.enum.Producer: {
      const rate = DEFAULT_PRODUCER_RATE
      node = {
        id,
        p,
        itemId,
        outputs,
        type,
        state,
        rate,
        power: 0,
      }
      break
    }
    case NodeType.enum.Purifier: {
      const rate = DEFAULT_PURIFIER_RATE
      node = { id, p, itemId, outputs, type, state, rate }
      break
    }
    case NodeType.enum.Energizer: {
      node = {
        id,
        p,
        itemId,
        outputs,
        type,
        state,
        power: 0,
      }
      break
    }
    case NodeType.enum.RobotTerminal: {
      const robot: Robot = {
        id: `${game.nextRobotId++}`,
        nodeId: id,
        p,
        d: null,
        jobId: null,
      }
      game.robots[robot.id] = robot
      node = {
        id,
        p,
        itemId,
        outputs,
        state,
        type,
        robotId: robot.id,
      }
      break
    }
  }

  invariant(!game.nodes[id])
  game.nodes[id] = node

  if (node.state === NodeState.enum.PendingConstruction) {
    const job: Job = {
      id: `${game.nextJobId++}`,
      type: JobType.enum.Construct,
      nodeId: node.id,
      robotId: null,
    }
    game.jobs[job.id] = job
  }
}

type AddFormNodeResult =
  | { success: true }
  | { success: false; errors: string[] }

export function addFormNode(
  nodes: Game['nodes'],
  partial: {
    p: Vec2
    size: Vec2
  },
): AddFormNodeResult {
  invariant(partial.size.x > 0)
  invariant(partial.size.y > 0)

  const errors: string[] = []

  function* iterateFormNodes(): Generator<
    FormRootNode | FormLeafNode
  > {
    yield {
      type: NodeType.enum.FormRoot,
      p: partial.p,
      id: toNodeId(partial.p),
      itemId: null,
      outputs: {},
      targetNodeId: null,
      state: NodeState.enum.Active,
    }

    for (let x = 0; x < partial.size.x; x++) {
      for (let y = 0; y < partial.size.y; y++) {
        if (x === 0 && y === 0) {
          continue
        }

        const p = partial.p.add(new Vec2(x, y))
        yield {
          type: NodeType.enum.FormLeaf,
          p,
          id: toNodeId(p),
          itemId: null,
          outputs: {},
          state: NodeState.enum.Active,
        }
      }
    }
  }

  const formNodes = Array.from(iterateFormNodes())

  for (const node of formNodes) {
    if (nodes[node.id]) {
      errors.push(`Node [${node.id}] already exists`)
    }
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  for (const node of formNodes) {
    invariant(!nodes[node.id])
    nodes[node.id] = node
  }

  return { success: true }
}

type ConnectResult =
  | { success: true }
  | { success: false; errors: string[] }

export function connect(
  nodes: Game['nodes'],
  inputId: string,
  outputId: string,
): ConnectResult {
  invariant(inputId !== outputId)

  const errors: string[] = []

  const input = nodes[inputId]
  invariant(input)
  invariant(!input.outputs[inputId])

  if (!isValidInput(input)) {
    errors.push(`Invalid input [${inputId}]`)
  }

  const output = nodes[outputId]
  invariant(output)

  if (!isValidOutput(output)) {
    errors.push(`Invalid output [${outputId}]`)
  }

  const direction = getOutputDirection(input, output)

  if (errors.length === 0) {
    input.outputs[outputId] = direction
    return { success: true }
  } else {
    return { success: false, errors }
  }
}

export function getOutputDelta(
  input: Node,
  output: Node,
): Vec2 {
  const delta = new Vec2(output.p).sub(new Vec2(input.p))
  if (delta.length() !== 1) {
    debugger
    throw Error(`Invalid input/output pair`)
  }
  return delta
}

function getOutputDirection(
  input: Node,
  output: Node,
): OutputDirection {
  const delta = getOutputDelta(input, output)
  if (delta.x === 0 && delta.y === -1) {
    return OutputDirection.enum.North
  } else if (delta.x === 0 && delta.y === 1) {
    return OutputDirection.enum.South
  } else if (delta.x === 1 && delta.y === 0) {
    return OutputDirection.enum.East
  } else if (delta.x === -1 && delta.y === 0) {
    return OutputDirection.enum.West
  }
  debugger
  throw Error(`Invalid input/output pair`)
}

function isValidInput(
  node: Node,
): node is
  | NormalNode
  | ProducerNode
  | PurifierNode
  | EnergizerNode {
  return (
    node.type === NodeType.enum.Normal ||
    node.type === NodeType.enum.Producer ||
    node.type === NodeType.enum.Purifier ||
    node.type === NodeType.enum.Energizer
  )
}

function isValidOutput(
  node: Node,
): node is
  | NormalNode
  | ConsumerNode
  | PurifierNode
  | EnergizerNode {
  return (
    node.type === NodeType.enum.Normal ||
    node.type === NodeType.enum.Consumer ||
    node.type === NodeType.enum.Purifier ||
    node.type === NodeType.enum.Energizer
  )
}

export function parseNodeId(id: string): Vec2 {
  const match = id.match(/^(-?\d+)\.(-?\d+)$/)
  invariant(match?.length === 3)
  return new Vec2(
    parseInt(match.at(1)!),
    parseInt(match.at(2)!),
  )
}

export function toNodeId(p: Vec2): string {
  invariant(p.equals(p.floor()))
  return `${p.x}.${p.y}`
}

export function getNode(game: Game, nodeId: string): Node {
  const node = game.nodes[nodeId]
  invariant(node)
  return node
}

export function getNodeWithType<T extends NodeType>(
  game: Game,
  id: string,
  type: T,
): Extract<Node, { type: T }> {
  const node = getNode(game, id)
  invariant(node.type === type)
  return node as Extract<Node, { type: T }>
}

type DestroyNodeResult =
  | { success: true }
  | { success: false; errors: string[] }

export function destroyNode(
  draft: Game,
  nodeId: string,
): DestroyNodeResult {
  const node = draft.nodes[nodeId]
  invariant(node)

  if (
    node.type === NodeType.enum.FormRoot ||
    node.type === NodeType.enum.FormLeaf ||
    node.type === NodeType.enum.RobotTerminal
  ) {
    return {
      success: false,
      errors: [`Cannot destroy node [${nodeId}]`],
    }
  }

  if (node.state === NodeState.enum.PendingConstruction) {
    const jobs = Object.values(draft.jobs).filter(
      (job) => job.nodeId === nodeId,
    )
    invariant(jobs.length === 1)
    const job = jobs.at(0)!
    if (job.robotId) {
      const robot = draft.robots[job.robotId]
      invariant(robot)
      robot.jobId = null
    }
    delete draft.jobs[job.id]

    deleteNode(draft, nodeId)
  } else if (
    node.state !== NodeState.enum.PendingDestruction
  ) {
    node.state = NodeState.enum.PendingDestruction

    const job: Job = {
      id: `${draft.nextJobId++}`,
      type: JobType.enum.Destroy,
      nodeId: node.id,
      robotId: null,
    }
    draft.jobs[job.id] = job
  }

  return { success: true }
}

export function deleteNode(
  draft: Game,
  nodeId: string,
): void {
  const node = draft.nodes[nodeId]
  invariant(node)
  for (const input of Object.values(draft.nodes)) {
    if (input.outputs[nodeId]) {
      delete input.outputs[nodeId]
    }
  }

  delete draft.nodes[node.id]

  let item: Item | null = null
  if (node.itemId) {
    item = draft.items[node.itemId]!
    invariant(item)
    delete draft.items[item.id]
  }
}
