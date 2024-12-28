import invariant from 'tiny-invariant'
import { CELL_SIZE } from './const'
import { PixiState } from './pixi-state'

export function renderFrame(
  state: PixiState,
  tickProgress: number,
) {
  if (!state.gameView) {
    return
  }
  for (const item of Object.values(
    state.gameView.itemsV2,
  )) {
    const g = state.g.items.get(item.id)
    invariant(g)

    const d = item.p.next.sub(item.p.prev)
    const p = item.p.prev.add(d.mul(tickProgress))

    g.position.set(p.x * CELL_SIZE, p.y * CELL_SIZE)
  }
}
