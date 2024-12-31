import { BehaviorSubject } from 'rxjs'
import { Updater } from 'use-immer'
import { Vec2 } from '../common/vec2'
import { Game } from '../game/game'
import { OutputDirection } from '../game/node'
import { connect, toNodeId } from '../game/util'
import { AppView, AppViewType } from './app-view'
import { Pointer, PointerType } from './pointer'

interface InitKeyboardArgs {
  signal: AbortSignal
  setGame: Updater<Game>
  view$: BehaviorSubject<AppView>
  setView: Updater<AppView>
  pointer$: BehaviorSubject<Pointer | null>
}

export function initKeyboard({
  signal,
  setGame,
  view$,
  setView,
  pointer$,
}: InitKeyboardArgs) {
  window.addEventListener(
    'keyup',
    (ev) => {
      switch (ev.key) {
        case 'w':
        case 'ArrowUp':
          handleOutputDirection(
            setGame,
            view$,
            OutputDirection.enum.North,
          )
          break
        case 'a':
        case 'ArrowLeft':
          handleOutputDirection(
            setGame,
            view$,
            OutputDirection.enum.West,
          )
          break
        case 's':
        case 'ArrowDown':
          handleOutputDirection(
            setGame,
            view$,
            OutputDirection.enum.South,
          )
          break
        case 'd':
        case 'ArrowRight':
          handleOutputDirection(
            setGame,
            view$,
            OutputDirection.enum.East,
          )
          break
        case 'q':
        case 'Escape': {
          setView((draft) => {
            draft.type = AppViewType.Home
          })
          break
        }
      }
    },
    { signal },
  )

  window.addEventListener(
    'keyup',
    (ev) => {
      if (
        ev.key === 'Shift' &&
        pointer$.value?.type === PointerType.Path
      ) {
        pointer$.next({
          type: PointerType.Free,
          p: pointer$.value.p,
        })
      }
    },
    { signal },
  )
}

function handleOutputDirection(
  setGame: Updater<Game>,
  view$: BehaviorSubject<AppView>,
  direction: OutputDirection,
): void {
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
      const result = connect(draft.nodes, inputId, outputId)
      if (!result.success) {
        console.error(result.errors)
      }
    }
  })
}
