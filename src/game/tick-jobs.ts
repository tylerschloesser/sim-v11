import { isEqual } from 'lodash-es'
import invariant from 'tiny-invariant'
import { Vec2 } from '../common/vec2'
import { Game } from './game'
import { ConstructJob, DestroyJob, JobType } from './job'
import { NodeState } from './node'
import { deleteNode } from './util'

export function tickJobs(game: Game): void {
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
