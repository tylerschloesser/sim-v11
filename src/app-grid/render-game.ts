import invariant from 'tiny-invariant'
import { Game } from '../game/game'
import { NodeContainer } from './node-container'
import { PixiState } from './pixi-state'

export function renderGame(game: Game, state: PixiState) {
  const extra = new Set(state.g.nodes.keys())
  for (const node of Object.values(game.nodes)) {
    let container = state.g.nodes.get(node.id)
    if (container) {
      container.update(node)
    } else {
      container = new NodeContainer(node, state)
      state.g.nodes.set(node.id, container)

      // add to the beginning, so they're always behind items
      state.g.world.addChildAt(container, 0)
    }
    extra.delete(node.id)
  }

  for (const id of extra) {
    const container = state.g.nodes.get(id)
    invariant(container)
    container.destroy({ children: true })

    state.g.nodes.delete(id)
  }
}
