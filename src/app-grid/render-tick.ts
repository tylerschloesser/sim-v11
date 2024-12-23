import * as PIXI from 'pixi.js'
import { Game } from '../game'
import { CELL_SIZE } from './const'
import { gameToGameView } from './game-view'
import { PixiState } from './pixi-state'

export function renderTick(game: Game, state: PixiState) {
  state.lastTickTime = self.performance.now()
  state.viewPrev = state.viewNext
  state.viewNext = gameToGameView(game)

  if (!state.viewPrev) {
    return
  }

  for (const item of Object.values(state.viewPrev.items)) {
    let g = state.g.items.get(item.id)

    if (!state.viewNext.items[item.id]) {
      if (g) {
        g.destroy()
      }
      continue
    }

    if (!g) {
      g = new PIXI.Graphics()
      g.rect(
        CELL_SIZE * 0.2,
        CELL_SIZE * 0.2,
        CELL_SIZE * 0.6,
        CELL_SIZE * 0.6,
      )
      g.fill({ color: item.color })

      state.g.items.set(item.id, g)
      state.g.world.addChild(g)
    }

    g.position.set(
      item.p.x * CELL_SIZE,
      item.p.y * CELL_SIZE,
    )
  }
}
