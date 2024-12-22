import { debounce, isEqual } from 'lodash-es'
import * as PIXI from 'pixi.js'
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  map,
  shareReplay,
  Subject,
  Subscription,
  throttleTime,
  withLatestFrom,
} from 'rxjs'
import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { Input } from '../app-graph/input-view'
import { mod } from '../common/math'
import { Vec2 } from '../common/vec2'
import { Game, Node } from '../game'
import { addNode } from '../game/util'
import { renderSvgToImage, TextureId } from '../textures'
import {
  CELL_SIZE,
  DRAG_THRESHOLD_PX,
  TICK_DURATION,
} from './const'
import { Graphics, PixiState } from './pixi-state'

const cache = new Map<string, Promise<PixiState>>()

enum PointerType {
  Free = 'free',
  Drag = 'drag',
}

interface FreePointer {
  type: PointerType.Free
  p: Vec2
}

interface DragPointer {
  type: PointerType.Drag
  p: Vec2
  down: { t: number; p: Vec2 }
  delta: Vec2
}

type Pointer = FreePointer | DragPointer

function deleteNode(draft: Game, node: Node): void {
  for (const input of Object.values(draft.nodes)) {
    const index = input.outputs.findIndex(
      ({ id }) => id === node.id,
    )
    if (index === -1) {
      continue
    }

    invariant(input.id !== node.id)
    input.outputs.splice(index, 1)
  }

  delete draft.nodes[node.id]
}

function handleClick(draft: Game, hover: Vec2): void {
  const node = Object.values(draft.nodes).find((node) =>
    new Vec2(node.p).equals(hover),
  )

  draft.updateType = null
  if (node) {
    deleteNode(draft, node)
  } else {
    addNode(draft.nodes, {
      p: hover,
    })
  }
}

export function initPixi(
  id: string,
  container: HTMLDivElement,
  setInput: Updater<Input>,
  setGame: Updater<Game>,
): Promise<PixiState> {
  const promise: Promise<PixiState> = new Promise(
    async (resolve) => {
      const { width, height } =
        container.getBoundingClientRect()

      const canvas = document.createElement('canvas')
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      canvas.width = width
      canvas.height = height
      container.appendChild(canvas)

      const app = new PIXI.Application()
      await app.init({
        canvas,
        width: canvas.width,
        height: canvas.height,
        antialias: true,
      })

      const textures = await initTextures(container)

      const reloadOnResize = debounce(
        window.location.reload.bind(window.location),
        500,
      )

      const ro = new ResizeObserver(() => {
        const { width, height } =
          canvas.getBoundingClientRect()
        if (
          canvas.width === width &&
          canvas.height === height
        ) {
          return
        }
        // TODO dynamically update canvas size
        reloadOnResize()
        // canvas.width = width
        // canvas.height = height
        // app.resize()
      })
      ro.observe(canvas)

      const controller = new AbortController()
      const { signal } = controller

      const viewport = new Vec2(width, height)
      const cellSize = CELL_SIZE
      const g = initGraphics(app, cellSize, viewport)

      const click$ = new Subject<void>()
      const camera$ = new BehaviorSubject<Vec2>(Vec2.ZERO)
      const pointer$ = new BehaviorSubject<Pointer | null>(
        null,
      )

      const sub = new Subscription()

      const effectiveCamera$ = combineLatest([
        camera$,
        pointer$,
      ]).pipe(
        map(([camera, pointer]) => {
          if (pointer?.type !== PointerType.Drag) {
            return camera
          }
          const delta = pointer.delta.div(cellSize)
          return camera.add(delta)
        }),
        distinctUntilChanged<Vec2>(isEqual),
        shareReplay(1),
      )

      // convert to screen coordinates
      const effectiveCameraScreen$ = effectiveCamera$.pipe(
        map((camera) =>
          camera.mul(cellSize).mul(-1).add(viewport.div(2)),
        ),
      )

      sub.add(
        effectiveCameraScreen$.subscribe((screen) => {
          g.grid.position.set(
            mod(screen.x, cellSize) - cellSize,
            mod(screen.y, cellSize) - cellSize,
          )
          g.world.position.set(screen.x, screen.y)
        }),
      )

      const hover$ = combineLatest([
        effectiveCamera$,
        pointer$,
      ]).pipe(
        map(([camera, pointer]) => {
          if (pointer === null) {
            return null
          }
          return pointer.p
            .sub(viewport.div(2))
            .div(cellSize)
            .add(camera)
            .floor()
        }),
        distinctUntilChanged<Vec2 | null>(isEqual),
        shareReplay(1),
      )

      sub.add(
        click$
          .pipe(
            throttleTime(100),
            withLatestFrom(hover$),
            map(([_, hover]) => {
              invariant(
                hover,
                'Received click but hover is null',
              )
              return hover
            }),
          )
          .subscribe((hover) => {
            setGame((draft) => {
              handleClick(draft, hover)
            })
          }),
      )

      sub.add(
        hover$.subscribe((hover) => {
          setInput((draft) => {
            draft.hoverCell = hover
          })
        }),
      )

      sub.add(
        combineLatest([effectiveCamera$, hover$])
          .pipe(
            map(([camera, hover]) =>
              hover
                ? hover
                    .sub(camera)
                    .mul(cellSize)
                    .add(viewport.div(2))
                : null,
            ),
            distinctUntilChanged<Vec2 | null>(isEqual),
          )
          .subscribe((screen) => {
            if (screen) {
              g.pointer.visible = true
              g.pointer.position.set(screen.x, screen.y)
            } else {
              g.pointer.visible = false
            }
          }),
      )

      const state: PixiState = {
        id,
        canvas,
        app,
        ro,
        controller,
        g,
        textures,
        frameHandle: -1,
        lastTickTime: null,
        viewPrev: null,
        viewNext: null,
        sub,
      }

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
              pointer$.value.delta.length() <
              DRAG_THRESHOLD_PX
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

      const frameRequestCallback: FrameRequestCallback =
        () => {
          const time = self.performance.now()
          let tickProgress = 0
          if (state.lastTickTime !== null) {
            tickProgress =
              (time - state.lastTickTime) / TICK_DURATION
          }
          invariant(tickProgress >= 0)
          // invariant(tickProgress < 1.1)
          renderFrame(state, tickProgress)
          state.frameHandle = self.requestAnimationFrame(
            frameRequestCallback,
          )
        }
      state.frameHandle = self.requestAnimationFrame(
        frameRequestCallback,
      )

      resolve(state)
    },
  )
  cache.set(id, promise)
  return promise
}

async function initTextures(
  container: HTMLDivElement,
): Promise<Record<TextureId, PIXI.Texture>> {
  const textures: Partial<Record<TextureId, PIXI.Texture>> =
    {}
  for (const id of TextureId.options) {
    const svg = container.querySelector(
      `svg[data-texture-id="${id}"]`,
    )
    invariant(svg instanceof SVGSVGElement)

    textures[id] = await PIXI.Assets.load(
      await renderSvgToImage(svg),
    )
  }
  return textures as Record<TextureId, PIXI.Texture>
}

function initGraphics(
  app: PIXI.Application,
  cellSize: number,
  viewport: Vec2,
): Graphics {
  const g: Graphics = {
    pointer: new PIXI.Graphics(),
    grid: new PIXI.Graphics(),
    world: new PIXI.Container(),
    nodes: new Map(),
    items: new Map(),
  }

  {
    const cols = Math.ceil(viewport.x / cellSize) + 1
    const rows = Math.ceil(viewport.y / cellSize) + 1
    g.grid.setStrokeStyle({
      color: 'hsl(0, 0%, 20%)',
      width: 2,
    })
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        g.grid
          .moveTo(col * cellSize, 0)
          .lineTo(col * cellSize, rows * cellSize)
          .moveTo(0, row * cellSize)
          .lineTo(cols * cellSize, row * cellSize)
      }
    }
    g.grid.stroke()
    app.stage.addChild(g.grid)
  }

  {
    app.stage.addChild(g.world)
  }

  {
    g.pointer.visible = false
    g.pointer.rect(0, 0, cellSize, cellSize)
    g.pointer.stroke({
      color: 'white',
      width: 2,
    })
    app.stage.addChild(g.pointer)
  }

  return g
}

function renderFrame(
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

export function destroyPixi(id: string) {
  const promise = cache.get(id)
  invariant(promise)
  promise.then((state) => {
    self.cancelAnimationFrame(state.frameHandle)
    state.controller.abort()
    state.canvas.style.display = 'none'
    state.ro.disconnect()
    state.app.destroy(false, {
      children: true,
      texture: false,
    })
    state.canvas.remove()
    cache.delete(id)
    state.sub.unsubscribe()
  })
}
