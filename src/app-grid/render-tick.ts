import { Game } from '../game/game'
import { ItemContainer } from './item-container'
import { PixiState } from './pixi-state'

export function renderTick(game: Game, state: PixiState) {
  const extra = new Set(state.g.items.keys())

  for (const item of Object.values(game.items)) {
    extra.delete(item.id)

    let container = state.g.items.get(item.id)
    if (!container) {
      container = new ItemContainer(item)
      state.g.world.addChild(container)
      state.g.items.set(item.id, container)
    } else {
      container.update(item)
    }
  }

  for (const itemId of extra) {
    const container = state.g.items.get(itemId)
    if (!container) {
      continue
    }
    container.destroy({ children: true })
    state.g.items.delete(itemId)
  }
}
