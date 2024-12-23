import { debounce, isEqual } from 'lodash-es'
import * as PIXI from 'pixi.js'
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  map,
  scan,
  shareReplay,
  Subject,
  Subscription,
  withLatestFrom,
} from 'rxjs'
import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { mod } from '../common/math'
import { Vec2 } from '../common/vec2'
import { Game, Node } from '../game'
import { addNode, toNodeId } from '../game/util'
import { renderSvgToImage, TextureId } from '../textures'
import { AppView, AppViewType } from './app-view'
import {
  CELL_SIZE,
  DRAG_THRESHOLD_PX,
  TICK_DURATION,
} from './const'
import { initInput } from './init-input'
import {
  buildPath,
  Path,
  PathStart,
  PathState,
} from './path'
import { PathContainer } from './path-container'
import { Graphics, PixiState } from './pixi-state'
import { Pointer, PointerType } from './pointer'

const cache = new Map<string, Promise<PixiState>>()

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

function handlePath(draft: Game, path: Path): void {
  draft.updateType = null
  for (const p of path) {
    const id = toNodeId(p)
    if (draft.nodes[id]) {
      continue
    }
    addNode(draft.nodes, { p })
  }
  for (let i = 0; i < path.length - 1; i++) {
    const p = path.at(i)
    invariant(p)
    const id = toNodeId(p)
    const node = draft.nodes[id]
    invariant(node)

    const next = path.at(i + 1)
    invariant(next)
    const nextId = toNodeId(next)

    const delta = next.sub(p)
    invariant(delta.length() === 1)

    if (
      node.outputs.every((value) => value.id !== nextId)
    ) {
      node.outputs.push({ id: nextId })
    }
  }
}

function handleClick(
  draft: Game,
  hover: Vec2,
  view: AppView,
): void {
  if (view.type !== AppViewType.AddNode) {
    return
  }

  const node = Object.values(draft.nodes).find((node) =>
    new Vec2(node.p).equals(hover),
  )

  draft.updateType = null
  if (node) {
    deleteNode(draft, node)
  } else {
    addNode(draft.nodes, {
      p: hover,
      type: view.nodeType,
    })
  }
}

interface InitPixiArgs {
  id: string
  container: HTMLDivElement
  setView: Updater<AppView>
  setGame: Updater<Game>
  viewRef: React.MutableRefObject<AppView>
}

export function initPixi({
  id,
  container,
  setView,
  setGame,
  viewRef,
}: InitPixiArgs): Promise<PixiState> {
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

      const pointerup$ = new Subject<Vec2>()
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

      const screenToWorld$ = effectiveCamera$.pipe(
        map((camera) => (screen: Vec2) => {
          return screen
            .sub(viewport.div(2))
            .div(cellSize)
            .add(camera)
        }),
        shareReplay(1),
      )

      const hover$ = combineLatest([
        screenToWorld$,
        pointer$,
      ]).pipe(
        map(([screenToWorld, pointer]) => {
          if (pointer === null) {
            return null
          }
          return screenToWorld(pointer.p).floor()
        }),
        distinctUntilChanged<Vec2 | null>(isEqual),
        shareReplay(1),
      )

      sub.add(
        hover$.subscribe((hover) => {
          setView((draft) => {
            draft.hover = hover
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

      const path$ = combineLatest([
        screenToWorld$,
        pointer$,
      ]).pipe(
        map(([screenToWorld, pointer]) => {
          if (pointer?.type !== PointerType.Path) {
            return null
          }
          const first = screenToWorld(
            pointer.down.p,
          ).floor()
          const last = screenToWorld(pointer.p).floor()
          const delta = last.sub(first)
          return { first, last, delta, start: null }
        }),
        scan((acc, state) => {
          if (
            state === null ||
            state.first.equals(state.last)
          ) {
            return state
          }
          if (acc?.start) {
            return {
              ...state,
              start: acc.start,
            }
          }
          const start: PathStart =
            Math.abs(state.delta.x) >
            Math.abs(state.delta.y)
              ? 'x'
              : 'y'
          return {
            ...state,
            start,
          }
        }),
        distinctUntilChanged<PathState | null>(isEqual),
        map((state) => {
          if (state === null) {
            return null
          }
          return buildPath(state)
        }),
        shareReplay(1),
      )

      sub.add(
        path$.subscribe((path) => {
          g.path.update(path, cellSize)
        }),
      )

      sub.add(
        pointerup$
          .pipe(
            withLatestFrom(
              pointer$,
              hover$,
              camera$,
              path$,
            ),
          )
          .subscribe(
            ([p, pointer, hover, camera, path]) => {
              switch (pointer?.type) {
                case PointerType.Drag: {
                  const dt =
                    self.performance.now() - pointer.down.t
                  if (
                    dt < 200 ||
                    pointer.delta.length() <
                      DRAG_THRESHOLD_PX
                  ) {
                    invariant(hover)
                    setGame((draft) => {
                      handleClick(
                        draft,
                        hover,
                        viewRef.current,
                      )
                    })
                  }

                  camera$.next(
                    camera.add(pointer.delta.div(cellSize)),
                  )

                  break
                }
                case PointerType.Path: {
                  invariant(path)
                  setGame((draft) => {
                    handlePath(draft, path)
                  })
                  break
                }
              }

              pointer$.next({
                type: PointerType.Free,
                p,
              })
            },
          ),
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

      initInput({
        container,
        signal,
        pointer$,
        pointerup$,
      })

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
    path: new PathContainer(),
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
    g.world.addChild(g.path)
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
