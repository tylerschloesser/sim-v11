import { Game } from '../game'
import { gameToGameView } from './game-view'
import { ItemContainer } from './item-container'
import { PixiState } from './pixi-state'

export function renderTick(game: Game, state: PixiState) {
  state.lastTickTime = self.performance.now()
  state.viewPrev = state.viewNext
  state.viewNext = gameToGameView(game)

  if (!state.viewPrev) {
    return
  }

  for (const item of Object.values(state.viewPrev.items)) {
    let container = state.g.items.get(item.id)

    if (!state.viewNext.items[item.id]) {
      container?.destroy({ children: true })
      state.g.items.delete(item.id)
      continue
    }

    if (!container) {
      container = new ItemContainer(item)
      state.g.world.addChild(container)
      state.g.items.set(item.id, container)
    } else {
      container.update(item)
    }
  }
}
