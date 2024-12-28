import invariant from 'tiny-invariant'
import { CELL_SIZE } from './const'
import { PixiState } from './pixi-state'

export function renderFrame(
  state: PixiState,
  tickProgress: number,
) {
  if (!state.viewPrev) {
    return
  }
  invariant(state.viewNext)

  for (const item of Object.values(state.viewNext.items)) {
    const prev = state.viewPrev.items[item.id]
    if (!prev || item.p.equals(prev.p)) {
      continue
    }

    const g = state.g.items.get(item.id)
    invariant(g)

    const d = item.p.sub(prev.p)
    const p = prev.p.add(d.mul(tickProgress))

    g.position.set(p.x * CELL_SIZE, p.y * CELL_SIZE)
  }
}
