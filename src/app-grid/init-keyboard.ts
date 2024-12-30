import { BehaviorSubject } from 'rxjs'
import { Updater } from 'use-immer'
import { Vec2 } from '../common/vec2'
import { Game } from '../game/game'
import { OutputDirection } from '../game/node'
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
      let direction: OutputDirection | null = null
      switch (ev.key) {
        case 'w':
        case 'ArrowUp':
          direction = OutputDirection.enum.North
          break
        case 'a':
        case 'ArrowLeft':
          direction = OutputDirection.enum.West
          break
        case 's':
        case 'ArrowDown':
          direction = OutputDirection.enum.South
          break
        case 'd':
        case 'ArrowRight':
          direction = OutputDirection.enum.East
          break
      }
      if (!direction) {
        return
      }

      let d: Vec2
      switch (direction) {
        case OutputDirection.enum.North:
          d = new Vec2(0, -1)
          break
        case OutputDirection.enum.South:
          d = new Vec2(0, 1)
          break
        case OutputDirection.enum.East:
          d = new Vec2(1, 0)
          break
        case OutputDirection.enum.West:
          d = new Vec2(-1, 0)
          break
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
