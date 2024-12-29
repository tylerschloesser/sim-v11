import { BehaviorSubject } from 'rxjs'
import { Updater } from 'use-immer'
import { Vec2 } from '../common/vec2'
import { Game } from '../game/game'
import { connect, toNodeId } from '../game/util'
import { AppView } from './app-view'

interface InitKeyboardArgs {
  signal: AbortSignal
  setGame: Updater<Game>
  view$: BehaviorSubject<AppView>
}

export function initKeyboard({
  signal,
  setGame,
  view$,
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
        if (!view$.value.hover) {
          return
        }

        const inputId = toNodeId(view$.value.hover.p)
        const input = draft.nodes[inputId]
        if (!input) {
          return
        }

        const outputId = toNodeId(new Vec2(input.p).add(d))
        const output = draft.nodes[outputId]
        if (!output) {
          return
        }

        if (input.outputs[outputId]) {
          delete input.outputs[outputId]
        } else {
          const result = connect(
            draft.nodes,
            inputId,
            outputId,
          )
          if (!result.success) {
            console.error(result.errors)
          }
        }
      })
    },
    { signal },
  )
}
