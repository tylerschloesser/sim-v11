import { debounce } from 'lodash-es'
import * as PIXI from 'pixi.js'
import invariant from 'tiny-invariant'
import { mod } from '../common/math'
import { Vec2 } from '../common/vec2'
import { renderSvgToImage, TextureId } from '../textures'
import { CELL_SIZE, TICK_DURATION } from './const'
import { Graphics, PixiState } from './pixi-state'

const cache = new Map<string, Promise<PixiState>>()

export function initPixi(
  id: string,
  container: HTMLDivElement,
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

      let camera = Vec2.ZERO
      let pointer: Vec2 | null = null
      let pointerDown: Vec2 | null = null
      let delta = Vec2.ZERO

      function updateCamera() {
        {
          const t = camera
            .mul(cellSize)
            .add(delta)
            .mul(-1)
            .add(viewport.div(2))
          g.grid.position.set(
            mod(t.x, cellSize) - cellSize,
            mod(t.y, cellSize) - cellSize,
          )
        }

        {
          const t = camera
            .mul(cellSize)
            .add(delta)
            .mul(-1)
            .add(viewport.div(2))
          g.world.position.set(t.x, t.y)
        }
      }
      updateCamera()

      function screenToWorld(screen: Vec2): Vec2 {
        return screen
          .sub(viewport.div(2))
          .add(delta)
          .div(cellSize)
          .add(camera)
      }

      function worldToScreen(world: Vec2): Vec2 {
        return world
          .sub(camera)
          .mul(cellSize)
          .add(viewport.div(2))
          .sub(delta)
      }

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
        inputViewPrev: { pointer: null },
        inputViewNext: { pointer: null },
      }

      document.addEventListener(
        'pointerenter',
        (ev) => {
          pointer = new Vec2(ev.offsetX, ev.offsetY)
          const world = screenToWorld(pointer)
          const screen = worldToScreen(world).floor()

          if (!state.inputViewNext) {
            state.inputViewNext = { pointer: screen }
          } else {
            state.inputViewNext.pointer = screen
          }

          g.pointer.visible = true
          g.pointer.position.set(screen.x, screen.y)
        },
        { signal },
      )

      document.addEventListener(
        'pointermove',
        (ev) => {
          if (pointerDown !== null) {
            const p = new Vec2(ev.offsetX, ev.offsetY)
            // update delta before updating camera!
            delta = pointerDown.sub(p)
            updateCamera()
          }

          pointer = new Vec2(ev.offsetX, ev.offsetY)
          const world = screenToWorld(pointer)
          const screen = worldToScreen(world.floor())

          if (!state.inputViewNext) {
            state.inputViewNext = { pointer: screen }
          } else {
            state.inputViewNext.pointer = screen
          }

          g.pointer.visible = true
          g.pointer.position.set(screen.x, screen.y)
        },
        { signal },
      )

      document.addEventListener(
        'pointerleave',
        (_ev) => {
          state.inputViewNext.pointer = null

          pointer = null
          g.pointer.visible = false
        },
        { signal },
      )

      document.addEventListener(
        'pointerdown',
        (ev) => {
          pointerDown = new Vec2(ev.offsetX, ev.offsetY)
        },
        { signal },
      )

      document.addEventListener(
        'pointerup',
        (_ev) => {
          pointerDown = null
          camera = camera.add(delta.div(cellSize))
          console.log('camera', camera)
          delta = Vec2.ZERO
          updateCamera()
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
    state.app.destroy(false, true)
    state.canvas.remove()
    cache.delete(id)
  })
}
