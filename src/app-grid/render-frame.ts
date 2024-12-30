import { PixiState } from './pixi-state'

export function renderFrame(
  state: PixiState,
  tickProgress: number,
) {
  for (const container of state.g.items.values()) {
    container.animate(tickProgress)
  }
  for (const container of state.g.robots.values()) {
    container.animate(tickProgress)
  }
}
