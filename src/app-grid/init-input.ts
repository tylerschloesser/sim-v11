import { BehaviorSubject, Subject } from 'rxjs'
import { Vec2 } from '../common/vec2'
import { AppView, AppViewType } from './app-view'
import { Pointer, PointerType } from './pointer'

interface InitInputArgs {
  container: HTMLElement
  signal: AbortSignal
  pointer$: BehaviorSubject<Pointer | null>
  pointerup$: Subject<Vec2>
  view$: BehaviorSubject<AppView>
}

export function initInput({
  container,
  signal,
  pointer$,
  pointerup$,
  view$,
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
        case PointerType.Path: {
          pointer$.next({
            ...pointer$.value,
            p,
          })
          break
        }
        default: {
          pointer$.next({
            type: PointerType.Free,
            p,
          })
          break
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
        if (view$.value.type === AppViewType.AddNode) {
          pointer$.next({
            type: PointerType.Path,
            p,
            down: {
              t: self.performance.now(),
              p,
            },
          })
        }
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
      pointerup$.next(p)
    },
    { signal },
  )
}
