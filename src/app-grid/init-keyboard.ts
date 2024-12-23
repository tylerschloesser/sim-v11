import { Updater } from 'use-immer'
import { Input } from '../app-graph/input-view'
import { Vec2 } from '../common/vec2'
import { Game } from '../game'

interface InitKeyboardArgs {
  signal: AbortSignal
  setGame: Updater<Game>
  inputRef: React.MutableRefObject<Input>
}

export function initKeyboard({
  signal,
  setGame,
  inputRef,
}: InitKeyboardArgs) {
  window.addEventListener(
    'keyup',
    (ev) => {
      let d: Vec2 | null = null
      switch (ev.key) {
        case 'w':
        case 'ArrowUp':
          d = new Vec2(0, -1)
          break
        case 'a':
        case 'ArrowLeft':
          d = new Vec2(-1, 0)
          break
        case 's':
        case 'ArrowDown':
          d = new Vec2(0, 1)
          break
        case 'd':
        case 'ArrowRight':
          d = new Vec2(1, 0)
          break
      }
      if (!d) {
        return
      }

      setGame((draft) => {
        draft.updateType = null
        if (!inputRef.current.hover) {
          return
        }

        const cell = Object.values(draft.nodes).find(
          (node) =>
            new Vec2(node.p).equals(
              inputRef.current.hover!,
            ),
        )

        if (!cell) {
          return cell
        }

        const output = Object.values(draft.nodes).find(
          (node) =>
            new Vec2(node.p).equals(
              new Vec2(cell.p).add(d),
            ),
        )

        if (!output) {
          return
        }

        const outputIndex = cell.outputs.findIndex(
          (node) => node.id === output.id,
        )
        if (outputIndex === -1) {
          cell.outputs.push({ id: output.id })
        } else {
          cell.outputs.splice(outputIndex, 1)
        }
      })
    },
    { signal },
  )
}
