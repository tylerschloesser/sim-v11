import { BehaviorSubject, Subject } from 'rxjs'
import { Vec2 } from '../common/vec2'
import { DRAG_THRESHOLD_PX } from './const'
import { Pointer, PointerType } from './pointer'

interface InitInputArgs {
  container: HTMLElement
  signal: AbortSignal
  pointer$: BehaviorSubject<Pointer | null>
  click$: Subject<void>
  camera$: BehaviorSubject<Vec2>
  cellSize: number
}

export function initInput({
  container,
  signal,
  pointer$,
  click$,
  camera$,
  cellSize,
}: InitInputArgs): void {
  container.addEventListener(
    'pointerenter',
    (ev) => {
      pointer$.next({
        type: PointerType.Free,
        p: new Vec2(ev.offsetX, ev.offsetY),
      })
    },
    { signal },
  )

  container.addEventListener(
    'pointermove',
    (ev) => {
      const p = new Vec2(ev.offsetX, ev.offsetY)

      switch (pointer$.value?.type) {
        case PointerType.Drag: {
          pointer$.next({
            ...pointer$.value,
            p,
            delta: pointer$.value.down.p.sub(p),
          })
          break
        }
        default: {
          break
          pointer$.next({
            type: PointerType.Free,
            p,
          })
        }
      }
    },
    { signal },
  )

  container.addEventListener(
    'pointerleave',
    (_ev) => {
      pointer$.next(null)
    },
    { signal },
  )

  container.addEventListener(
    'pointerdown',
    (ev) => {
      const p = new Vec2(ev.offsetX, ev.offsetY)
      if (ev.shiftKey) {
        pointer$.next({
          type: PointerType.Path,
          p,
          down: {
            t: self.performance.now(),
            p,
          },
        })
      } else {
        pointer$.next({
          type: PointerType.Drag,
          p,
          down: {
            t: self.performance.now(),
            p,
          },
          delta: Vec2.ZERO,
        })
      }
    },
    { signal },
  )

  container.addEventListener(
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
