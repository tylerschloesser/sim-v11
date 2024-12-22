import { BehaviorSubject, Subject } from 'rxjs'
import { Vec2 } from '../common/vec2'
import { DRAG_THRESHOLD_PX } from './const'
import { Pointer, PointerType } from './pointer'

interface InitInputArgs {
  signal: AbortSignal
  pointer$: BehaviorSubject<Pointer | null>
  click$: Subject<void>
  camera$: BehaviorSubject<Vec2>
  cellSize: number
}

export function initInput({
  signal,
  pointer$,
  click$,
  camera$,
  cellSize,
}: InitInputArgs): void {
  document.addEventListener(
    'pointerenter',
    (ev) => {
      pointer$.next({
        type: PointerType.Free,
        p: new Vec2(ev.offsetX, ev.offsetY),
      })
    },
    { signal },
  )

  document.addEventListener(
    'pointermove',
    (ev) => {
      const p = new Vec2(ev.offsetX, ev.offsetY)
      if (pointer$.value?.type === PointerType.Drag) {
        pointer$.next({
          ...pointer$.value,
          p,
          delta: pointer$.value.down.p.sub(p),
        })
      } else {
        pointer$.next({
          type: PointerType.Free,
          p,
        })
      }
    },
    { signal },
  )

  document.addEventListener(
    'pointerleave',
    (_ev) => {
      pointer$.next(null)
    },
    { signal },
  )

  document.addEventListener(
    'pointerdown',
    (ev) => {
      const p = new Vec2(ev.offsetX, ev.offsetY)
      pointer$.next({
        type: PointerType.Drag,
        p,
        down: {
          t: self.performance.now(),
          p,
        },
        delta: Vec2.ZERO,
      })
    },
    { signal },
  )

  document.addEventListener(
    'pointerup',
    (ev) => {
      const p = new Vec2(ev.offsetX, ev.offsetY)

      if (pointer$.value?.type === PointerType.Drag) {
        const dt =
          self.performance.now() - pointer$.value.down.t
        if (dt < 200) {
          click$.next()
        } else if (
          pointer$.value.delta.length() < DRAG_THRESHOLD_PX
        ) {
          click$.next()
        }
        camera$.next(
          camera$.value.add(
            pointer$.value.delta.div(cellSize),
          ),
        )
      }

      pointer$.next({
        type: PointerType.Free,
        p,
      })
    },
    { signal },
  )
}
