import { current, original } from 'immer'
import { DEBUG } from '../app-grid/const'
import { Game, UpdateType } from './game'
import { tickJobs } from './tick-jobs'
import { tickNodes } from './tick-nodes'
import { tickRobots } from './tick-robots'

export function tick(game: Game) {
  game.tick += 1
  game.updateType = UpdateType.enum.Tick

  tickNodes(game)
  tickJobs(game)
  tickRobots(game)

  if (DEBUG) {
    try {
      Game.parse(game)
    } catch (e) {
      // @ts-expect-error
      const prev = original(game),
        next = current(game)
      debugger
    }
  }
}
