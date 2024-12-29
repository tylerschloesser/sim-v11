import invariant from 'tiny-invariant'
import { Game } from '../game/game'
import { gameToGameView } from './game-view'
import { PixiState } from './pixi-state'
import { renderNode } from './render-node'

export function renderGame(game: Game, state: PixiState) {
  const view = gameToGameView(game)
  const extra = new Set(state.g.nodes.keys())
  for (const node of Object.values(view.nodes)) {
    extra.delete(node.id)
    renderNode(node, state)
  }

  for (const id of extra) {
    const container = state.g.nodes.get(id)
    invariant(container)
    container.destroy({ children: true })

    state.g.nodes.delete(id)
  }
}
