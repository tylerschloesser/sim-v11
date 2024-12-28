import invariant from 'tiny-invariant'
import { Vec2 } from '../common/vec2'
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

    let p: Vec2
    if (item.p.prev) {
      const d = item.p.next.sub(item.p.prev)
      p = item.p.prev.add(d.mul(tickProgress))
    } else {
      p = item.p.next
    }

    g.position.set(p.x * CELL_SIZE, p.y * CELL_SIZE)
  }
}
