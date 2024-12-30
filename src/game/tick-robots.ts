import { isEqual } from 'lodash-es'
import invariant from 'tiny-invariant'
import { Vec2 } from '../common/vec2'
import { Game } from './game'

export function tickRobots(game: Game): void {
  for (const robot of Object.values(game.robots)) {
    if (robot.jobId !== null) {
      continue
    }
    const node = game.nodes[robot.nodeId]
    invariant(node)
    if (isEqual(robot.p, node.p)) {
      robot.d = null
      continue
    }

    robot.d = new Vec2(node.p).sub(new Vec2(robot.p))
    robot.p = node.p
  }
}
